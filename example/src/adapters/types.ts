// Events
//
// Events represent ad-hoc external messages.
export type EventMap = object;

export type EventName<Map extends EventMap = EventMap> = keyof Map;

export type EventPayload<
  Map extends EventMap = EventMap,
  Event extends EventName<Map> = EventName<Map>,
> = Map[Event] extends unknown[]
  ? {
    eventName: Event;
    payload: Map[Event];
  }
  : never;

export type EventListener<
  Map extends EventMap = EventMap,
  Event extends EventName<Map> = EventName<Map>,
> = (...payload: EventPayload<Map, Event>["payload"]) => unknown;

export type EventListenerMap<Map extends EventMap = EventMap> = {
  [Event in keyof Map]?: EventListener<Map, Event>[];
};

// API
//
// API represents callable actions.
export type ApiMap = object;

export type ApiName<Map extends ApiMap = ApiMap> = keyof Map;

export type ApiPayload<
  Map extends ApiMap = ApiMap,
  ApiFn extends ApiName<Map> = ApiName<Map>,
> = Map[ApiFn] extends (...args: unknown[]) => void ? Map[ApiFn] : never;

export interface ApiCallMessage<
  Map extends ApiMap = ApiMap,
  ApiFn extends ApiName<Map> = ApiName<Map>,
> {
  apiCall: ApiFn;
  parameters: Parameters<ApiPayload<Map, ApiFn>>;
  id: number;
}
