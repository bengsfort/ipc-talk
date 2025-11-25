import type { ChildProcess } from "node:child_process";

import type {
  EventMap,
  EventListenerMap,
  EventName,
  IPCEvent,
  WorkerEventEmitter,
  ApiMap,
  IpcRequestMessage,
  ApiFnReturnType,
  WorkerIpcApi,
  IpcResponseMessage,
  ApiHandlerMap,
} from "../common/types.js";

import { createPromiseWithResolvers, type PromiseWithResolvers } from "../common/utils.js";

// Worker Process Event Emitter API.
// Wraps the given worker with a type-safe event emitter.
export function createWorkerEventEmitter<
  WorkerEvents extends EventMap = EventMap,
  ThisEvents extends EventMap = EventMap,
>(
  worker: ChildProcess | NodeJS.Process
): WorkerEventEmitter<WorkerEvents, ThisEvents> {
  const listenerMap: EventListenerMap<WorkerEvents> = {};

  const handleWorkerMessage = (message: IPCEvent<WorkerEvents>) => {
    // Ignore events that do not have an eventName.
    if (typeof message.eventName !== 'string') {
      return;
    }

    // Call each callback with the payload for this event (if they exist).
    const eventName = message.eventName as EventName<WorkerEvents>;
    listenerMap[eventName]?.forEach((listener) => listener(message));
  };

  worker.on('message', handleWorkerMessage);

  return {
    addListener: (eventName, listener) => {
      // Create a Set for the event if it doesn't yet exist.
      if (typeof listenerMap[eventName] === 'undefined') {
        listenerMap[eventName] = new Set();
      }
    
      // Add the listener to the Set for this event.
      listenerMap[eventName].add(listener);
    },

    removeListener: (eventName, listener) => {
      // If there are not any listeners for this event, we don't need to do anything.
      if (typeof listenerMap[eventName] === 'undefined') {
        return;
      }

      // Remove the listener from the Set for this event.
      listenerMap[eventName].delete(listener);
    },

    dispatch: (eventName, payload) => {
      const message: IPCEvent<ThisEvents> = {
        eventName,
        payload,
      };

      // Structure and dispatch the message to the worker.
      worker.send?.(message);
    },

    cleanup: () => {
      // Remove our message handler.
      worker.off('message', handleWorkerMessage);

      // Remove all saved listeners so everything can be cleaned up.
      for (const eventName of Object.keys(listenerMap)) {
        listenerMap[eventName as EventName<WorkerEvents>]?.clear();
      }
    },
  };
}

// Worker Process IPC Call API.
// Wraps the given worker with a type-safe IPC call manager.
export function createWorkerIpcApi<
  WorkerApi extends ApiMap = ApiMap,
  ThisApi extends ApiMap = ApiMap
>(worker: ChildProcess | NodeJS.Process): WorkerIpcApi<WorkerApi, ThisApi> {
  const waitingRequests = new Map<
    number,
    PromiseWithResolvers<ApiFnReturnType<WorkerApi>>
  >();
  const apiHandlers: ApiHandlerMap<ThisApi> = {};
  let idCounter = 0;
  let connected = true;

  // Handle response messages from the other process.
  const handleResponse = (response: IpcResponseMessage<WorkerApi>) => {
    // Retrieve the promise. If there is none, we have an ID mismatch and ignore.
    const promise = waitingRequests.get(response.requestId);
    if (!promise) {
      return;
    }

    // Remove the request from our map since it is being handled.
    waitingRequests.delete(response.requestId);

    // If we have a result, resolve the promise with it. Otherwise, reject the promise.
    if (typeof response.result !== 'undefined') {
      promise.resolve(response.result);
    } else {
      promise.reject(response.error ?? "Invalid response from other process.");
    }
  };

  // Handle incoming API requests.
  const handleRequest = (request: IpcRequestMessage<ThisApi>) => {
    // Create our base response.
    const response: Partial<IpcResponseMessage<ThisApi>> = {
      callType: 'response',
      requestId: request.requestId,
    };

    try {
      // Attempt to retrieve a handler for this function.
      // If it does not exist, throw an error.
      const handler = apiHandlers[request.fnName];
      if (!handler) {
        throw new Error(`No API Handler defined for ${request.fnName.toString()}`);
      }

      // Store the result of calling the handler with the args in the response.
      response.result = handler(...request.args);
      worker.send?.(response);
    } catch (err) {
      // If there was an error, make sure we surface it in the response.
      response.error = JSON.stringify(err);
      worker.send?.(response);
    }
  };

  const handleWorkerMessage = (
    message: IpcResponseMessage<WorkerApi> | IpcRequestMessage<ThisApi>
  ) => {
    // Ignore irrelevant messages.
    if (
      typeof message.requestId === 'undefined'
      || typeof message.callType === 'undefined'
    ) {
      return;
    }

    // Handle responses and requests separately.
    if (message.callType === 'response') {
      handleResponse(message);
    } else if (message.callType === 'request') {
      handleRequest(message);
    }
  };

  worker.on('message', handleWorkerMessage);

  return {
    callIpcFunction: (fnName, ...args) => {
      if (!connected) {
        throw new Error('IPC not connected.');
      }
      
      // Create our request.
      const request: IpcRequestMessage<WorkerApi> = {
        callType: 'request',
        fnName,
        args,
        requestId: idCounter++,
      };

      // Create a promise that we can externally resolve and cache the resolver.
      const promiseWithResolvers = createPromiseWithResolvers<ApiFnReturnType<WorkerApi>>();
      waitingRequests.set(request.requestId, promiseWithResolvers);

      // Send the request to the other process.
      worker.send?.(request);

      // Return the saved promise.
      return promiseWithResolvers.promise;
    },

    registerIpcHandler: (fnName, handler) => {
      // Add the handler for the given function within our handler map.
      apiHandlers[fnName] = handler;
    },

    cleanup: () => {
      // Remove our message handler.
      connected = false;
      worker.off('message', handleWorkerMessage);

      // Reject any existing requests that are waiting for a response.
      waitingRequests.forEach((promise) => {
        promise.reject('IPC Handler closing');
      });
      waitingRequests.clear();
    },
  };
}
