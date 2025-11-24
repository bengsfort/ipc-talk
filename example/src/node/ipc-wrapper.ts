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
} from "../common/types.js";

import { createPromiseWithResolvers, type PromiseWithResolvers } from "../common/utils.js";

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

export function createWorkerIpcApi<
  WorkerApi extends ApiMap = ApiMap,
  ThisApi extends ApiMap = ApiMap
>(
  worker: ChildProcess | NodeJS.Process,
  apiHandler: (request: IpcRequestMessage<ThisApi>) => ApiFnReturnType<ThisApi>,
): WorkerIpcApi<WorkerApi> {
  const waitingRequests = new Map<
    number,
    PromiseWithResolvers<ApiFnReturnType<WorkerApi>>
  >();

  let idCounter = 0;

  const handleResponse = (response: IpcResponseMessage<WorkerApi>) => {
    const promise = waitingRequests.get(response.requestId);
    // The promise somehow does not exist! Id Mismatch,
    if (!promise) {
      return;
    }

    waitingRequests.delete(response.requestId);

    if (typeof response.result !== 'undefined') {
      promise.resolve(response.result);
      return;
    } else if (typeof response.error !== 'undefined') {
      promise.reject(response.error);
      return;
    }

    promise.reject('Invalid response from other process');
  };

  const handleRequest = (request: IpcRequestMessage<ThisApi>) => {
    const response: Partial<IpcResponseMessage<ThisApi>> = {
      callType: 'response',
      requestId: request.requestId,
    };

    try {
      response.result = apiHandler(request);
      worker.send?.(response);
    } catch (err) {
      response.error = JSON.stringify(err);
      worker.send?.(response);
    }
  };

  worker.on(
    'message',
    (message: IpcResponseMessage<WorkerApi> | IpcRequestMessage<ThisApi>) => {
      // Ignore irrelevant messages.
      if (
        typeof message.requestId === 'undefined'
        || typeof message.callType === 'undefined'
      ) {
        return;
      }

      if (message.callType === 'response') {
        handleResponse(message);
      } else if (message.callType === 'request') {
        handleRequest(message);
      }
    },
  );

  return {
    callIpcFunction(fnName, args) {
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
  };
}
