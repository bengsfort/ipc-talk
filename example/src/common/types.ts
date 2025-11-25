// Event API's -------------------------------------------
export type EventMap = object;

export type EventName<Map extends EventMap> = keyof Map;

export type EventPayload<
  Map extends EventMap,
  Event extends EventName<Map> = EventName<Map>,
> = Map[Event] extends Record<string, unknown>
    ? Map[Event]
    : never;

export type EventListenerCb<
  Map extends EventMap,
  Event extends EventName<Map> = EventName<Map>,
> = (event: IPCEvent<Map, Event>) => void;

export interface IPCEvent<
  Map extends EventMap,
  Event extends EventName<Map> = EventName<Map>,
> {
  eventName: Event;
  payload: EventPayload<Map, Event>;
}

export type EventListenerMap<Map extends EventMap> = {
  [Event in keyof Map]?: Set<EventListenerCb<Map, Event>>;
};

/**
 * Base event emitter API.
 */
export interface WorkerEventEmitter<
  WorkerEvents extends EventMap = EventMap,
  ThisEvents extends EventMap = EventMap,
> {
  addListener<Event extends EventName<WorkerEvents> = EventName<WorkerEvents>>(
    eventName: Event,
    listener: EventListenerCb<WorkerEvents, Event>,
  ): void;
  removeListener<Event extends EventName<WorkerEvents> = EventName<WorkerEvents>>(
    eventName: Event,
    listener: EventListenerCb<WorkerEvents, Event>,
  ): void;
  dispatch<Event extends EventName<ThisEvents> = EventName<ThisEvents>>(
    eventName: Event,
    payload: EventPayload<ThisEvents, Event>
  ): void;
  cleanup(): void;
}

// IPC Call API's -----------------------------------------

export type ApiMap = object;

export type ApiFnName<Map extends ApiMap> = keyof Map;

export type ApiFnSignature<
  Map extends ApiMap,
  ApiName extends ApiFnName<Map> = ApiFnName<Map>,
> = Map[ApiName] extends (...args: any[]) => any
  ? Map[ApiName]
  : never;

export type ApiFnArgs<
  Map extends ApiMap,
  ApiName extends ApiFnName<Map> = ApiFnName<Map>,
> = Parameters<ApiFnSignature<Map, ApiName>>;

export type ApiFnReturnType<
  Map extends ApiMap,
  ApiName extends ApiFnName<Map> = ApiFnName<Map>,
> = ReturnType<ApiFnSignature<Map, ApiName>>;

// Schema for IPC Call/Function messages -- this comes from the process MAKING the call.
export interface IpcRequestMessage<
  Map extends ApiMap,
  ApiName extends ApiFnName<Map> = ApiFnName<Map>,
> {
  callType: 'request';
  requestId: number;
  fnName: ApiName;
  args: ApiFnArgs<Map, ApiName>;
}

// Schema for IPC call/Function results -- this comes from the process RESPONDING to the call.
export type IpcResponseMessage<
  Map extends ApiMap,
  ApiName extends ApiFnName<Map> = ApiFnName<Map>,
> = {
  callType: 'response';
  requestId: number;
  result?: ApiFnReturnType<Map, ApiName>;
  error?: string;
};

export type ApiHandlerMap<Map extends ApiMap> = {
  [Fn in keyof Map]?: ApiFnSignature<Map, Fn>;
};

/**
 * Base event emitter API.
 */
export interface WorkerIpcApi<WorkerApi extends ApiMap, ThisApi extends ApiMap> {
  callIpcFunction<Fn extends ApiFnName<WorkerApi> = ApiFnName<WorkerApi>>(
    fnName: Fn,
    ...args: ApiFnArgs<WorkerApi, Fn>
  ): Promise<ApiFnReturnType<WorkerApi, Fn>>;
  registerIpcHandler<Fn extends ApiFnName<ThisApi> = ApiFnName<ThisApi>>(
    fnName: Fn,
    handler: ApiFnSignature<ThisApi, Fn>,
  ): void;
  cleanup(): void;
}
