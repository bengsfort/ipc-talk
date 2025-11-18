type EventMap = object;

type EventName<Map extends EventMap = EventMap> = keyof Map;

type EventPayload<
  Map extends EventMap = EventMap,
  Event extends EventName<Map> = EventName<Map>,
> = Map[Event] extends unknown[] ? Map[Event] : never;

type EventListener<
  Map extends EventMap = EventMap,
  Event extends EventName<Map> = EventName<Map>,
> = (...payload: EventPayload<Map, Event>) => unknown;

type EventListenerMap<Map extends EventMap = EventMap> = {
  [Event in keyof Map]?: EventListener<Map, Event>[];
};

type ApiMap = object;

type ApiName<Map extends ApiMap = ApiMap> = keyof Map;

type ApiPayload<
  Map extends ApiMap = ApiMap,
  ApiFn extends ApiName<Map> = ApiName<Map>,
> = Map[ApiFn] extends (...args: unknown[]) => void ? Map[ApiFn] : never;

interface IPCProvider {
  onMessage: (ev: unknown) => void;
  postMessage: (...data: unknown[]) => void;
}

export class Bridge<Events extends EventMap, API extends ApiMap> {
  #_provider: IPCProvider;
  #_eventListeners: EventListenerMap<Events>;

  constructor(provider: IPCProvider) {
    this.#_provider = provider;
    this.#_eventListeners = {};
  }

  public addListener<Event extends EventName<Events> = EventName<Events>>(
    eventName: Event,
    listener: EventListener<Events, Event>,
  ): void {
    if (!this.#_eventListeners[eventName]) {
      this.#_eventListeners[eventName] = [];
    }

    this.#_eventListeners[eventName].push(listener);
  }

  public removeListener<Event extends EventName<Events> = EventName<Events>>(
    eventName: Event,
    listener: EventListener<Events, Event>,
  ): void {
    if (!this.#_eventListeners[eventName]) {
      return;
    }

    const filtered = this.#_eventListeners[eventName].filter(
      (l) => l !== listener,
    );
    this.#_eventListeners[eventName] = filtered;
  }
}
