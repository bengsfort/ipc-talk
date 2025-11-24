---
theme: seriph
title: Making IPC less painful
class: text-center
drawings:
  persist: false
transition: fade
mdc: true
duration: 26min to get to the "problems" recap currently...
---

# Making IPC Less Painful

Utilizing Typescript to make Inter-process communication (IPC) less of a headache

<div class="abs-br m-6 text-xl">
  <a href="https://github.com/bengsfort/ipc-talk" target="_blank" class="slidev-icon-btn">
    <carbon:logo-github />
  </a>
</div>

---
transition: fade
layout: quote
---

<h1 class="text-center">Inter-process communication is sending data between multiple javascript instances.</h1>

---
transition: fade
layout: center
---

<h1 class="text-center">Splitting work across multiple processes is used for...</h1>

<v-clicks>

- Moving processing intensive work off of the main javascript process.
- Improving lifecycle management for long-running, possibly external integrations.

</v-clicks>

<!--
- Touch on how JS is a single threaded language, and backing up the main queue leads to dropped inputs and jank.
- Lifecycle management = SDK/SDK-like integrations that should be able to fail gracefully
-->

---
transition: fade
layout: center
---

<h1 class="text-center">Available to a javascript near you!</h1>

<div class="text-center">
Usable in Node.js via Child Processes
</div>

<div
  class="process-visual"
  v-motion
  :enter="{ opacity: 1 }"
  :leave="{ opacity: 0 }"
>

  <div
    class="process-visual-item"
    v-motion
    :initial="{ x: 100, y: 0 }"
    :enter="{ x: 0 }"
  >
    <img alt="Node.js process image" src="/process.svg" />
    Node.js app
  </div>

  <div
    class="process-visual-item"
    v-motion
    :initial="{ x: -25, y: 0 }"
    :enter="{ x: 0 }"
  >
    <img alt="Busy node.js process image" src="/process-busy.svg" />
    Forked child process
  </div>

  <FlyingData
    class="data-block"
    :startPos="{ x: 90, y: -25 }"
    :endPos="{ x: -100, y: -25 }"
    :delay="5000"
  />

</div>

<div v-click="1" class="text-center">
Usable in browsers via the Worker API (Web Workers, Shared workers, etc)
</div>

<div
  class="process-visual"
  v-click="1"
  v-motion
  :enter="{ opacity: 1 }"
  :leave="{ opacity: 0 }"
>
  <div
    class="process-visual-item"
    v-click="1"
    v-motion
    :initial="{ x: 100, y: 0 }"
    :click-1="{ x: 0 }"
  >
    <img alt="Browser image" src="/browser.svg" />
    Browser
  </div>

  <div
    class="process-visual-item"
    v-click="1"
    v-motion
    :initial="{ x: -25, y: 0 }"
    :click-1="{ x: 0 }"
  >
    <img alt="Web Worker image" src="/process-busy.svg" />
    Web Worker
  </div>

  <FlyingData
    class="data-block"
    v-click="1"
    :startPos="{ x: 90, y: -25 }"
    :endPos="{ x: -100, y: -25 }"
    :delay="5000"
  />
</div>

<!--
- Technically communicating with Node.js Worker Threads and VM's is also IPC
- TECHNICALLY communicating with iframes could KINDA be considered IPC but... not really
- All of these patterns apply to things outside of these examples
-->

---
transition: fade
layout: default
---

# A very basic example

- We have a function that adds numbers in a sub-process.

<v-clicks>

- We want to send a message to the process with numbers to add, then log the result in our main process.

```ts
// Message schema for main process -> sub process message with numbers to add.
interface AddNumbersMsg {
  type: 'add-numbers';
  numbers: number[];
}

// Message schema for sub process -> main process message with the result.
interface AddResultMsg {
  type: 'add-numbers:result',
  result: number;
}
```

</v-clicks>

<!--
- Don't go too deep on the first bullet point, cause then the rest becomes awkward.
- Next slide will be ONLY the MAIN PROCESS for both node and web!
-->

---
transition: fade
layout: two-code-blocks
---

# A very basic example

::left::

<div class="code-block-header font-mono">
  Node.js - main process
</div>

```ts {*|3-4|6-12|14-18|*}
import { fork } from 'node:child_process';

// Create a sub-process for the heavy task.
const taskProcess = fork('./add.js');

// Add a listener for the result of the task.
taskProcess.on(
  'message',
  (message: AddResultMsg) => {
    console.log(`Result: ${message.result}`);
  },
);

// Send a message to the sub-process to start the task.
taskProcess.send({
  type: 'add-numbers',
  numbers: [5, 10],
} as AddNumbersMsg);
```

::right::

<div v-click="4">

<div class="code-block-header font-mono">
  Web - main script
</div>

```ts {*|3-4|6-12|14-18|*}
// Worker is in the global scope, so no need to import.

// Create a Worker for the heavy task.
const worker = new Worker('./add.js');

// Add a listener for the result of the task.
worker.addEventListener(
  'message',
  (event: MessageEvent<AddResultMsg>) => {
    console.log(`Result: ${event.data.result}`);
  },
);

// Send a message to the sub-process to start the task.
worker.postMessage({
  type: 'add-numbers',
  numbers: [5, 10],
} as AddNumbersMsg);
```

</div>

<!--
- Highlight `message` event!
- Remember to click to highlight the lines when going through the examples!
- Remember this slide is only main processes.
-->

---
transition: fade
layout: two-code-blocks
---

# A very basic example

::left::

<div class="code-block-header font-mono">
  Node.js - sub process
</div>

```ts {*|1-4,16-17|5-9|11-15|*}
// Listen for a message from the main process.
process.on(
  'message',
  (message: AddNumbersMsg) => {
    // Add the numbers together
    const result = message.numbers.reduce(
      (total, curr) => total + curr,
      0,
    );

    // Send the result back to the main process.
    process.send({
      type: 'add-numbers:result',
      result,
    } as AddResultMsg);
  },
);
```

::right::

<div v-click="4">

<div class="code-block-header font-mono">
  Web - worker
</div>

```ts {*|1-4,16-17|5-9|11-15|*}
// Listen for a message from the main process.
addEventListener(
  'message',
  (event: MessageEvent<AddNumbersMsg>) => {
    // Add the numbers together
    const result = event.data.numbers.reduce(
      (total, curr) => total + curr,
      0,
    );

    // Send the result back to the main process.
    postMessage({
      type: 'add-numbers:result',
      result,
    } as AddResultMsg);
  },
);
```

</div>

<!--
- Remember to use the click highlighting!
- Add listener for messages -> calculate -> send result back
- Remind at the end that this  teaches us about the IPC fundamentals and that they go across runtimes.
-->

---
transition: fade
layout: statement
---

# Even across runtimes, IPC uses the same fundamentals.

We're just working with event emitters and a pre-defined event.
<p class="text-xs text-center">Examples will now focus on Node.js now since it is less verbose :)</p>


<!--
- Highlight using Node.js cause the examples are easier to fit on the screen :D
- Will be adding an event on the next slide.
-->

---
transition: fade
layout: default
---

# Let's make a slight adjustment...

<div v-click="1">
We have a new message! Our worker process now emits a message with metrics every 60 seconds.
</div>

````md magic-move
```ts
// Message schema for main process -> sub process message with numbers to add.
interface AddNumbersMsg {
  type: 'add-numbers';
  numbers: number[];
}

// Message schema for sub process -> main process message with the result.
interface AddResultMsg {
  type: 'add-numbers:result',
  result: number;
}
```

```ts
// Message schema for main process -> sub process message with numbers to add.
interface AddNumbersMsg {
  type: 'add-numbers';
  numbers: number[];
}

// Message schema for sub process -> main process message with the result.
interface AddResultMsg {
  type: 'add-numbers:result',
  result: number;
}

// Message schema for sub process -> main process message with metrics
interface WorkerMetricsMsg {
  type: 'worker-metrics';
  uptime: string;
  totalCalculations: number;
}
```
````

<!--
- We will not be going into the worker implementation here.
- Checking our main process after this.
-->

---
transition: fade
layout: default
---

# Revisiting our main process

````md magic-move
```ts {*|6-9}
import { fork } from 'node:child_process';

// Create a sub-process for the heavy task.
const taskProcess = fork('./add.js');

// Add a listener for the result of the task.
taskProcess.on('message', (message: AddResultMsg) => {
  console.log(`Result: ${message.result}`);
});

// Send a message to the sub-process to start the task.
taskProcess.send({
  type: 'add-numbers',
  numbers: [5, 10],
} as AddNumbersMsg);
```

```ts
import { fork } from 'node:child_process';

// Create a sub-process for the heavy task.
const taskProcess = fork('./add.js');

// Add a listener for the result of the task.
taskProcess.on('message', (message: AddResultMsg | WorkerMetricsMsg) => {
  console.log(`Result: ${message.result}`);
});

// Send a message to the sub-process to start the task.
taskProcess.send({
  type: 'add-numbers',
  numbers: [5, 10],
} as AddNumbersMsg);
```

```ts
import { fork } from 'node:child_process';

// Create a sub-process for the heavy task.
const taskProcess = fork('./add.js');

// Add a listener for the result of the task.
taskProcess.on('message', (message: AddResultMsg | WorkerMetricsMsg) => {
  if (message.type === 'add-numbers:result') {
    console.log(`Result: ${message.result}`);
  } else if (message.type === 'worker-metrics') {
    console.log(`Worker uptime: ${message.uptime}, ${message.totalCalculations} performed.`);
  }
});

// Send a message to the sub-process to start the task.
taskProcess.send({
  type: 'add-numbers',
  numbers: [5, 10],
} as AddNumbersMsg);
```
````

<!--
- Event listener is no longer accurate because we have a new message type.
- Highlights listener first -> adds new type -> adds implementation.
- Highlight the need to do this in every listener.
-->

---
transition: fade
layout: statement
---

# This doesn't seem too bad!

Maybe it's a bit inconvenient, but...

<!--
- After the inconvenient bit, show the 3 messages we have, they are "not so bad"
-->

---
transition: fade
layout: full-screen-code
---

<Transform :scale="1">

```ts
// Message schema for main process -> sub process message with numbers to add.
interface AddNumbersMsg {
  type: 'add-numbers';
  numbers: number[];
}

// Message schema for sub process -> main process message with the result.
interface AddResultMsg {
  type: 'add-numbers:result',
  result: number;
}

// Message schema for sub process -> main process message with metrics
interface WorkerMetricsMsg {
  type: 'worker-metrics';
  uptime: string;
  totalCalculations: number;
}
```

</Transform>

---
transition: fade
layout: full-screen-code
---

<Transform :scale="0.88">

````md magic-move
```ts
// Message schema for main process -> sub process message with numbers to add.
interface AddNumbersMsg {
  type: 'add-numbers';
  numbers: number[];
}

// Message schema for sub process -> main process message with the addition result.
interface AddResultMsg {
  type: 'add-numbers:result',
  result: number;
}

// Message schema for main process -> sub process message with numbers to subtract.
interface SubtractNumbersMsg {
  type: 'subtract-numbers';
  numbers: number[];
}

// Message schema for sub process -> main process message with subtraction result..
interface SubtractResultMsg {
  type: 'subtract-numbers:result';
  result: number;
}

// Message schema for sub process -> main process message with metrics
interface WorkerMetricsMsg {
  type: 'worker-metrics';
  uptime: string;
  totalCalculations: number;
}
```

```ts
// Message schema for main process -> sub process message with numbers to add.
interface AddNumbersMsg {
  type: 'add-numbers';
  numbers: number[];
}

// Message schema for main process -> sub process message with numbers to subtract.
interface SubtractNumbersMsg {
  type: 'subtract-numbers';
  numbers: number[];
}

// Message schema for sub process -> main process message with a result.
interface ResultMsg {
  type: 'result';
  operation: 'add' | 'subtract';
  result: number;
}

// Message schema for sub process -> main process message with metrics
interface WorkerMetricsMsg {
  type: 'worker-metrics';
  uptime: string;
  totalCalculations: number;
}
```

```ts
// Message schema for main process -> sub process message with numbers to add.
interface AddNumbersMsg {
  type: 'add-numbers';
  numbers: number[];
}

// Message schema for main process -> sub process message with numbers to subtract.
interface SubtractNumbersMsg {
  type: 'subtract-numbers';
  numbers: number[];
}

// Message schema for main process -> sub process message with a result.
interface MultiplyNumbersMsg {
  type: 'multiply-numbers';
  numbers: number[];
}

// Message schema for sub process -> main process message with numbers to multiply.
interface ResultMsg {
  type: 'result';
  operation: 'add' | 'subtract' | 'multiply';
  result: number;
}

// Message schema for sub process -> main process message with metrics
interface WorkerMetricsMsg {
  type: 'worker-metrics';
  uptime: string;
  totalCalculations: number;
}
```
````

</Transform>

---
transition: fade
layout: full-screen-code
---

<Transform :scale="0.7">

```ts
// Message schema for main process -> sub process message with numbers to add.
interface AddNumbersMsg {
  type: 'add-numbers';
  numbers: number[];
}

// Message schema for main process -> sub process message with numbers to subtract.
interface SubtractNumbersMsg {
  type: 'subtract-numbers';
  numbers: number[];
}

// Message schema for main process -> sub process message with a result.
interface MultiplyNumbersMsg {
  type: 'multiply-numbers';
  numbers: number[];
}

// Message schema for sub process -> main process message with numbers to multiply.
interface ResultMsg {
  type: 'result';
  operation: 'add' | 'subtract' | 'multiply';
  result: number;
}

// Message schema for sub process -> main process message with metrics
interface WorkerMetricsMsg {
  type: 'worker-metrics';
  uptime: string;
  totalCalculations: number;
}

// Message schema for sub process -> main process message with synchronization status
interface SyncStatusMsg {
  type: 'sync-status-change';
  status: 'syncing' | 'sync-complete';
  lastSync: string;
}
```

</Transform>

---
transition: fade
layout: image
image: /irsdk-definitions.png
backgroundSize: contain
---

---
transition: fade
layout: two-cols
---

::default::

<Transform scale="0.60">

```ts
// IPC Events
"simStarted"
"simEnded"
"sessionInit"
"sessionEnded"
"carSetupChanged"
"lapStarted"
"lapCompleted"
"sectorCompleted"
"driverEnteredPits"
"driverExitedPits"
"driverJoined"
"driverLeft"
"driverPositionChange"
"pitStopStarted"
"pitStopCompleted"
"incidentOccurred"
"qualifyingStateChanged"
"raceStateChanged"
"simTick"
"raceFlagWaved"
"carDisqualified"
"fuelWarning"
"tireWarning"
"strategyChange"

// IPC Calls
"isSimRunning"
"startSDK"
"stopSDK"
"startEventDetection"
"stopEventDetection"
"waitForData"
"getTelemetry"
"getSessionData"
"getWeekendInfo"
"getSessionInfo"
"getSplitInfo"
"getCameraInfo"
"getRadioInfo"
"getDriverInfo"
"getCarSetupInfo"
"enableTelemetry"
"restartTelemetry"
```

</Transform>

::right::

# It can get out of hand really fast

- This is a real list of all of the IPC calls from a production app consuming Sim Racing data.
- 24 unique IPC Events and 17 unique IPC Calls (That's 41 unique messages!)
- With the patterns we have been using so far, each IPC Call would need a unique message as well.

---
transition: fade
layout: statement
---

# Speaking of IPC calls...


---
transition: fade
---

# What if we want to use the result of IPC calls?

- Tracking the result is hard due to the generic event-based nature of IPC.

<div v-click="1">

- Ideally we could be able to use IPC calls like any other API.

</div>

````md magic-move
```ts
process.on('message', (message) => {
  if (message.type !== 'result') {
    return;
  }

  // How do we know this is the result of 5 + 10?
  console.log(`Addition result is ${message.result}`);
});

// How do we tie the resulting message above to THIS call?
process.send({
  type: 'add-numbers',
  numbers: [5, 10],
});
```

```ts
// This would handle the IPC messages internally, and resolve with
// the result of THIS operation
const result = await ipcAddNumbers(5, 10);

// That way we can use it naturally like an API
console.log(result); // 10
```
````

---
transition: fade
layout: center
---

# Now, some problems are starting to emerge

<v-clicks>

1. As more events are added, the more complex our handlers become.
2. Typing of the `send`/`postMessage` does not really enforce anything.
3. Tracking the result of a message we have sent from one process to another is difficult.

</v-clicks>

<!--
- There were 41 unique messages in the racing app example.
- Remember all of this stuff must happen in all handlers!
- We saw the typing issue passively. If we forget the assertion and have a typo, it is a silent runtime bug.
-->

---
transition: fade
layout: statement
---

# So how do we make this sane?

<!--
- How do we make this practical?
- How do we not lose our hair?
-->

---
transition: fade
layout: default
---

# Let's start by fixing events

1. <span v-mark.underline.blue>As more events are added, the more complex our handlers become.</span>
2. Typing of the `send`/`postMessage` does not really enforce anything.
3. Tracking the result of a message we have sent from one process to another is difficult.

---
transition: fade
layout: default
---

# Fixing event handling

- We want to make sure that all events follow the same schema, so we can reliably detect and handle them.
- Let's also make a placeholder type for callbacks consuming these events, as well.

```ts
// Schema for all IPC events.
interface IPCEvent {
  eventName: string;
  payload: any;
}

// Generic function type.
type EventListenerCb = (event: IPCEvent) => void;
```


---
transition: fade
layout: default
---

# Fixing event handling

- We also want to wrap our worker to ensure we have a single main access point.

<v-clicks>

- This way we can control listener lifetimes and allow listeners to opt-in to specific events without worrying about boilerplate.
- Since the IPC API's are so similar, we can draft a typescript interface that we can then implement for whatever runtime we need.
- Strict typing will come later.

</v-clicks>

<v-click>

```ts
// Our base event emitter API.
//
// Event name will map to our messages `type` fields, and the listeners will
// get called with the messages themselves.
interface WorkerEventEmitter {
  addListener(eventName: string, listener: EventListenerCb): void;
  removeListener(eventName: string, listener: EventListenerCb): void;
  dispatch(eventName: string, payload: any): void;
  cleanup(): void;
}
```

</v-click>

---
transition: fade
layout: Statement
---

# Are we really creating an event emitter for an event emitter?

<v-click>Yes.</v-click>

<!--
- Go over benefits.
  - Easier cleanup when killing the process
  - Less boilerplate-per-listener
  - Process reference stays clean
- Plus typing benefits, soon to come..
-->

---
transition: fade
layout: default
---

Fixing event handling

# Implementing a basic event emitter

````md magic-move
```ts
// Our base event emitter API.
//
// Event name will map to our messages `type` fields, and the listeners will
// get called with the messages themselves.
interface WorkerEventEmitter {
  addListener(eventName: string, listener: EventListenerCb): void;
  removeListener(eventName: string, listener: EventListenerCb): void;
  dispatch(eventName: string, payload: any): void;
  cleanup(): void;
}
```

```ts
export function createWorkerEventEmitter(worker: ChildProcess): WorkerEventEmitter {
  const listenerMap: Record<string, Set<EventListenerCb>> = {};

  return {
    addListener: (eventName: string, listener: EventListenerCb) => {},
    removeListener: (eventName: string, listener: EventListenerCb) => {},
    dispatch: (eventName: string, payload: any) => {},
    cleanup: () => {},
  };
}
```

```ts
export function createWorkerEventEmitter(worker: ChildProcess): WorkerEventEmitter {
  // We want to use Set here, since it handles de-duplication for us.
  const listenerMap: Record<string, Set<EventListenerCb>> = {};

  return {
    addListener: (eventName: string, listener: EventListenerCb) => {},
    removeListener: (eventName: string, listener: EventListenerCb) => {},
    dispatch: (eventName: string, payload: any) => {},
    cleanup: () => {},
  };
}
```

```ts {*|5}
export function createWorkerEventEmitter(worker: ChildProcess): WorkerEventEmitter {
  const listenerMap: Record<string, Set<EventListenerCb>> = {};

  return {
    addListener: (eventName: string, listener: EventListenerCb) => {},
    removeListener: (eventName: string, listener: EventListenerCb) => {},
    dispatch: (eventName: string, payload: any) => {},
    cleanup: () => {},
  };
}
```

```ts
export function createWorkerEventEmitter(worker: ChildProcess): WorkerEventEmitter {
  const listenerMap: Record<string, Set<EventListenerCb>> = {};

  return {
    addListener: (eventName: string, listener: EventListenerCb) => {
      // Create a Set for the event if it doesn't yet exist.
      if (typeof listenerMap[eventName] === 'undefined') {
        listenerMap[eventName] = new Set();
      }
    
      // Add the listener to the Set for this event.
      listeners[eventName].add(listener);
    },
    removeListener: (eventName: string, listener: EventListenerCb) => {},
    dispatch: (eventName: string, payload: any) => {},
    cleanup: () => {},
  };
}
```

```ts {*|6}
export function createWorkerEventEmitter(worker: ChildProcess): WorkerEventEmitter {
  const listenerMap: Record<string, Set<EventListenerCb>> = {};

  return {
    addListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    removeListener: (eventName: string, listener: EventListenerCb) => {},
    dispatch: (eventName: string, payload: any) => {},
    cleanup: () => {},
  };
}
```

```ts
export function createWorkerEventEmitter(worker: ChildProcess): WorkerEventEmitter {
  const listenerMap: Record<string, Set<EventListenerCb>> = {};

  return {
    addListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    removeListener: (eventName: string, listener: EventListenerCb) => {
      // If there are not any listeners for this event, we don't need to do anything.
      if (typeof listenerMap[eventName] === 'undefined') {
        return;
      }

      // Remove the listener from the Set for this event.
      listenerMap[eventName].delete(listener);
    },
    dispatch: (eventName: string, payload: any) => {},
    cleanup: () => {},
  };
}
```

```ts {*|7}
export function createWorkerEventEmitter(worker: ChildProcess): WorkerEventEmitter {
  const listenerMap: Record<string, Set<EventListenerCb>> = {};

  return {
    addListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    removeListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    dispatch: (eventName: string, payload: any) => {},
    cleanup: () => {},
  };
}
```

```ts
export function createWorkerEventEmitter(worker: ChildProcess): WorkerEventEmitter {
  const listenerMap: Record<string, Set<EventListenerCb>> = {};

  return {
    addListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    removeListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    dispatch: (eventName: string, payload: any) => {
      const message: IPCEvent = {
        eventName,
        payload,
      };

      // Structure and dispatch the message to the worker.
      worker.send(message);
    },
    cleanup: () => {},
  };
}
```

```ts
export function createWorkerEventEmitter(worker: ChildProcess): WorkerEventEmitter {
  const listenerMap: Record<string, Set<EventListenerCb>> = {};

  return {
    addListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    removeListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    dispatch: (eventName: string, payload: any) => {/* ... */},
    cleanup: () => {},
  };
}
```
````

---
transition: fade
layout: default
---

Fixing event handling

# Re-cap

<v-clicks>

- Wrap out worker and expose an event emitter-like API
- Create a map for storing listeners for specific events
- `addListener` -> Store the listener with the list of callbacks for the given event.
- `removeListener` -> Remove the listener from the list of callbacks for the given event.
- `dispatch` -> Take the event name and payload and 'send' them through the worker.

</v-clicks>

<!--
- There are other design choices you can make, and features you could add, but we are keeping it simple.
-->

---
transition: fade
layout: default
---

Fixing event handling

# A note about our event emitter...

<v-clicks>

- This implementation is intentionally basic
- If you want more features, or don't feel comfortable maintaining your own event emitter, use a library with type support!
  - [eventemitter3](https://github.com/primus/eventemitter3)
  - [EventEmitter from 'node:events'](https://nodejs.org/en/learn/asynchronous-work/the-nodejs-event-emitter)
- Now we need to hook up our event emitter 

</v-clicks>

---
transition: fade
layout: default
---

Fixing event handling

# Hooking up our event emitter

````md magic-move
```ts {*|1}
export function createWorkerEventEmitter(worker: ChildProcess): WorkerEventEmitter {
  const listenerMap: Record<string, Set<EventListenerCb>> = {};

  return {
    addListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    removeListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    dispatch: (eventName: string, payload: any) => {/* ... */},
    cleanup: () => {},
  };
}
```

```ts
export function createWorkerEventEmitter(worker: ChildProcess): WorkerEventEmitter {
  const listenerMap: Record<string, Set<EventListenerCb>> = {};

  // Create a callback we can reference directly so that we can remove it later.
  const handleWorkerMessage = (message: IPCEvent) => {
    // ...
  };

  worker.on('message', handleWorkerMessage);

  return {
    addListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    removeListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    dispatch: (eventName: string, payload: any) => {/* ... */},
    cleanup: () => {},
  };
}
```

```ts
export function createWorkerEventEmitter(worker: ChildProcess): WorkerEventEmitter {
  const listenerMap: Record<string, Set<EventListenerCb>> = {};

  // ...

  return {
    addListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    removeListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    dispatch: (eventName: string, payload: any) => {/* ... */},
    cleanup: () => {
      // Remove our message handler.
      worker.off('message', handleWorkerMessage);
    },
  };
}
```

```ts
export function createWorkerEventEmitter(worker: ChildProcess): WorkerEventEmitter {
  const listenerMap: Record<string, Set<EventListenerCb>> = {};

  // ...

  return {
    addListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    removeListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    dispatch: (eventName: string, payload: any) => {/* ... */},
    cleanup: () => {
      // Remove our message handler.
      worker.off('message', handleWorkerMessage);

      // Remove all saved listeners so everything can be cleaned up.
      for (const eventName of Object.keys(listenerMap)) {
        listenerMap[eventName].clear();
      }
    },
  };
}
```

```ts
export function createWorkerEventEmitter(worker: ChildProcess): WorkerEventEmitter {
  const listenerMap: Record<string, Set<EventListenerCb>> = {};

  const handleWorkerMessage = (message: IPCEvent) => {
    // ...
  };

  worker.on('message', handleWorkerMessage);

  return {
    addListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    removeListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    dispatch: (eventName: string, payload: any) => {/* ... */},
    cleanup: () => {/* ... */},
  };
}
```

```ts
export function createWorkerEventEmitter(worker: ChildProcess): WorkerEventEmitter {
  const listenerMap: Record<string, Set<EventListenerCb>> = {};

  const handleWorkerMessage = (message: IPCEvent) => {
    // Make sure we have an event name to check against.
    if (typeof message.eventName !== 'string') {
      return;
    }
  };

  worker.on('message', handleWorkerMessage);

  return {
    addListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    removeListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    dispatch: (eventName: string, payload: any) => {/* ... */},
    cleanup: () => {/* ... */},
  };
}
```

```ts
export function createWorkerEventEmitter(worker: ChildProcess): WorkerEventEmitter {
  const listenerMap: Record<string, Set<EventListenerCb>> = {};

  const handleWorkerMessage = (message: IPCEvent) => {
    if (typeof message.eventName !== 'string') {
      return;
    }

    // Call each callback with the payload for this event (if they exist).
    const { eventName, payload } = message;
    listeners[eventName]?.forEach((listener) => listener(payload));
  };

  worker.on('message', handleWorkerMessage);

  return {
    addListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    removeListener: (eventName: string, listener: EventListenerCb) => {/* ... */},
    dispatch: (eventName: string, payload: any) => {/* ... */},
    cleanup: () => {/* ... */},
  };
}
```
````
