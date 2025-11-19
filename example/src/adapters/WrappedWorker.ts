import {
  createPromiseWithResolvers,
  type PromiseWithResolvers,
} from "../utils";

import type {
  EventListenerMap,
  EventMap,
  EventListener,
  ApiMap,
  EventName,
  ApiName,
  ApiPayload,
  EventPayload,
  ApiCallMessage,
} from "./types";

interface WorkerEventEmitter<Events extends EventMap> {
  addListener<Event extends EventName<Events> = EventName<Events>>(
    eventName: Event,
    listener: EventListener<Events, Event>,
  ): void;
  removeListener<Event extends EventName<Events> = EventName<Events>>(
    eventName: Event,
    listener: EventListener<Events, Event>,
  ): void;
}

export function workerWithEventEmitter<E extends EventMap>(
  worker: Worker,
): WorkerEventEmitter<E> {
  const listeners: EventListenerMap<E> = {};

  const handleWorkerEvent = (event: MessageEvent<EventPayload<E>>): void => {
    if (typeof event.data !== "object") {
      return;
    }

    if (
      !Object.hasOwn(event.data, "eventName") ||
      !Object.hasOwn(event.data, "payload")
    ) {
      return;
    }

    const { eventName, payload } = event.data;
    listeners[eventName]?.forEach((listener) => listener(...payload));
  };

  worker.addEventListener("message", handleWorkerEvent);

  return {
    addListener(eventName, listener): void {
      if (!listeners[eventName]) {
        listeners[eventName] = [];
      }

      listeners[eventName].push(listener);
    },
    removeListener(eventName, listener): void {
      if (!listeners[eventName]) {
        return;
      }

      const filtered = listeners[eventName].filter((l) => l !== listener);
      listeners[eventName] = filtered;
    },
  };
}

interface WorkerApiProvider<Apis extends ApiMap> {
  invoke<Fn extends ApiName<Apis> = ApiName<Apis>>(
    fnName: Fn,
    ...args: Parameters<ApiPayload<Apis, Fn>>
  ): ReturnType<ApiPayload<Apis, Fn>>;
}

type PromiseResolver<T> = (value: T) => void;

export function workerWithApi<API extends ApiMap>(
  worker: Worker,
): WorkerApiProvider<API> {
  const promises = new Map<number, PromiseWithResolvers<unknown>>();

  let idCounter = 0;

  return {
    invoke(fnName, ...args) {
      const promise = createPromiseWithResolvers<unknown>();
      const promiseId = idCounter++;

      const msg: ApiCallMessage = {
        apiCall: fnName,
        parameters: args,
        id: promiseId,
      };

      worker.postMessage(JSON.stringify(msg));
      return promise;
    },
  };
}
