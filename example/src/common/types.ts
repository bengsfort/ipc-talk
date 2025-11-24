
export interface IPCEvent {
  eventName: string;
  payload: any;
}

export type EventListenerCb = (event: IPCEvent) => void;

/**
 * Base event emitter API.
 */
export interface WorkerEventEmitter {
  addListener(eventName: string, listener: EventListenerCb): void;
  removeListener(eventName: string, listener: EventListenerCb): void;
  dispatch(eventName: string, payload: any): void;
  cleanup(): void;
}
