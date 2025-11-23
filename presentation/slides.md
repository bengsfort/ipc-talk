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

---
transition: fade
layout: center
---

<h1 class="text-center">Available to a javascript near you!</h1>

<div class="text-center">
Usable in Node.js via Child Processes and Worker Threads
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

---
transition: fade
layout: statement
---

# Even across runtimes, IPC uses the same fundamentals.

<div class="text-xs text-center">Examples will focus on Node.js now since it is less verbose :)</div>

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
  type: 'worker-metrics',
  uptime: string;
  totalCalculations: number;
}
```
````

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

---
transition: fade
layout: center
---

# Now, some problems are starting to emerge

1. As more events are added, the more complex our handlers become.
2. Tracking the result of a message we have sent from one process to another is difficult.
3. Typing of the `send`/`postMessage` does not really enforce anything.

---
transition: fade
layout: default
---

<Transform :scale="0.5">

```ts
export interface IRSDKEvents {
  simStarted: [startTime: number];
  simEnded: [stopTime: number];
  sessionInit: [id: string, startTime: number, sessionInfo: SessionInfo, trackInfo: TrackInfo, localDriver: DriverInfo];
  sessionEnded: [id: string, endTime: number];
  carSetupChanged: [setupName: string, settingsChanged: Partial<CarSetup>, carInfo: CarInfo];
  lapStarted: [lapNumber: number, startTime: number, outLap: boolean];
  lapCompleted: [lapNunber: number, endTime: number, inLap: boolean, lapInfo: LapInfo];
  sectorCompleted: [sectorTime: number, lapNumber: number, isSessionFastest: boolean, isAllTimeFastest: boolean];
  driverEnteredPits: [lapNumber: number];
  driverExitedPits: [lapNumber: number, timeInPits: number, hadPitStop: boolean];
  driverJoined: [carNumber: number, driver: DriverInfo];
  driverLeft: [carNumber: number, driver: DriverInfo];
  driverPositionChange: [driver1: DriverInfo, driver2: DriverInfo];
  pitStopStarted: [startTime: number, prevStintInfo: StintInfo, driver: DriverInfo];
  pitStopCompleted: [duration: number, changedTires: boolean, refuelAmount: number, driver: DriverInfo];
  incidentOccurred: [penalty: number, newTotal: number, incidentType: IrsdkIncidentType, driver: DriverInfo];
  qualifyingStateChanged: [newState: QualifyingState, oldState: QualifyingState];
  raceStateChanged: [newState: RaceState, oldState: RaceState];
  simTick: [tickNumber: number, tickTime: number, deltaTime: number, data: SimData];
  raceFlagWaved: [flagType: IrsdkFlagType, driver: DriverInfo | undefined];
  carDisqualified: [carNumber: number, reason: IrsdkDQReason, driver: DriverInfo];
  fuelWarning: [fuelLeft: number, timeTilEmpty: number, lapsTilEmpty: number];
  tireWarning: [tireLeft: number[], lapsTilDone: number];
  strategyChange: [options: RaceStrategy[]];
}

export interface IRSDKFuncs {
  isSimRunning;
  startSDK: [];
  stopSDK: [];
  startEventDetection: [];
  stopEventDetection: [];
  waitForData: [];
  getTelemetry: [];
  getSessionData: [];
  getWeekendInfo: [];
  getSessionInfo: [];
  getSplitInfo: [];
  getCameraInfo: [];
  getRadioInfo: [];
  getDriverInfo: [];
  getCarSetupInfo: [];
  enableTelemetry: [];
  restartTelemetry: [];
}
```

</Transform>

---
transition: fade
layout: statement
---

# Ok? This looks easy?

What are the problems with IPC in practice?

---
transition: fade
layout: default
---

_Problems with IPC in practice_

# 1. Structured data is needed to support multiple message types

<v-clicks>

- Once you have more than one message, you need to be able to identify each message.
- If anything in your codebase can add listeners directly, this needs to happen in every listener.

</v-clicks>

<v-click>

````md magic-move
```ts
// Expected events:
// number
worker.addEventListener('message', ({ data }: MessageEvent<number>) => {
  doSomethingWithNumber(data);
});
```

```ts
// Expected events:
// number
// string
worker.addEventListener('message', ({ data }: MessageEvent<number | string>) => {
  if (typeof data === 'string') {
    doSomethingWithString(data);
  } else {
    doSomethingWithNumber(data);
  }
});
```

```ts
// TECHNICALLY works, but...
// No self-documentation of what messages are available
// No self-documentation of what each value even is
worker.addEventListener('message', ({ data }: MessageEvent<number | string>) => {
  if (typeof data === 'string') {
    doSomethingWithString(data);
  } else { // Hopefully those really are the only 2 events...
    doSomethingWithNumber(data);
  }
});
```

```ts
// Let's give these some structure...
type WorkerMessage = {
  type: 'processed-file';  
  value: string;           
} | {
  type: 'processing-duration';
  value: number;
};

worker.addEventListener('message', ({ data }: MessageEvent<WorkerMessage>) => {
  // ...
});
```

```ts
type WorkerMessage = {
  type: 'processed-file';
  value: string;
} | {
  type: 'processing-duration';
  value: number;
};

worker.addEventListener('message', ({ data }: MessageEvent<WorkerMessage>) => {
  if (data.type === 'processed-file') {
    doSomethingWithString(data.value);
  } else if (data.type === 'processing-duration') {
    doSomethingWithNumber(data.value);
  }
});

```

```ts
type WorkerMessage = {
  type: 'processed-file'; // Now we have a reference to what messages there are...
  value: string;          // And what they provide!
} | {
  type: 'processing-duration';
  value: number;
};

worker.addEventListener('message', ({ data }: MessageEvent<WorkerMessage>) => {
  if (data.type === 'processed-file') {
    doSomethingWithString(data.value);
  } else if (data.type === 'processing-duration') {
    doSomethingWithNumber(data.value);
  }
});
```
````

</v-click>

---
transition: fade
---

_Problems with IPC in practice_

# 2. Mistakes and typos are silent runtime bugs

<v-clicks>

- An event name with a typo won't cause a runtime error -- it will just never trigger. Happy debugging!

</v-clicks>

<v-click>

````md magic-move
```ts {*|12}
// Client
worker.addEventListener('message', ({ data }) => {
  if (data.type === 'processed-file') {
    doSomethingWithString(data.value);
  } else if (data.type === 'processing-duration') {
    doSomethingWithNumber(data.value);
  }
});

// Worker
postMessage({
  type: 'procesed-file',
  value: 'pretend this is a file or something',
});
```
```ts
// Client
worker.addEventListener('message', ({ data }) => {
  if (data.type === 'processed-file') {
    doSomethingWithString(data.value);
  } else if (data.type === 'processing-duration') {
    doSomethingWithNumber(data.value);
  }
});

// Worker
postMessage({
  type: 'processed-file',
  value: 'pretend this is a file or something',
});
```
```ts {3}
// Client
worker.addEventListener('message', ({ data }) => {
  if (data.type === 'procesed-file') {
    doSomethingWithString(data.value);
  } else if (data.type === 'processing-duration') {
    doSomethingWithNumber(data.value);
  }
});

// Worker
postMessage({
  type: 'processed-file',
  value: 'pretend this is a file or something',
});
```

```ts
// Client
worker.addEventListener('message', ({ data }) => {
  if (data.type === 'processed-file') {
    doSomethingWithString(data.value);
  } else if (data.type === 'processing-duration') {
    doSomethingWithNumber(data.value);
  }
});

// Worker
postMessage({
  type: 'processed-file',
  value: 'pretend this is a file or something',
});
```
````

</v-click>

---
transition: fade
---

_Problems with IPC in practice_

# 2. Mistakes and typos are silent runtime bugs

````md magic-move
```ts
// Client
worker.addEventListener('message', ({ data }) => {
  if (data.type === 'processed-file') {
    doSomethingWithString(data.value);
  } else if (data.type === 'processing-duration') {
    doSomethingWithNumber(data.value);
  }
});

// Worker
postMessage({
  type: 'processed-file',
  value: 'pretend this is a file or something',
});
```

```ts
// Enum
const MessageTypes = {
  ProcessedFile: 'processed-file',
  ProcessingDuration: 'processing-duration',
} as const;

// Client
worker.addEventListener('message', ({ data }) => {
  if (data.type === 'processed-file') {
    doSomethingWithString(data.value);
  } else if (data.type === 'processing-duration') {
    doSomethingWithNumber(data.value);
  }
});

// Worker
postMessage({
  type: 'processed-file',
  value: 'pretend this is a file or something',
});
```

```ts
// Enum
const MessageTypes = {
  ProcessedFile: 'processed-file',
  ProcessingDuration: 'processing-duration',
} as const;

// Client
worker.addEventListener('message', ({ data }) => {
  if (data.type === MessageTypes.ProcessedFile) {
    doSomethingWithString(data.value);
  } else if (data.type === MessageTypes.ProcessingDuration) {
    doSomethingWithNumber(data.value);
  }
});

// Worker
postMessage({
  type: MessageTypes.ProcessedFile,
  value: 'pretend this is a file or something',
});

```
````

---
transition: fade
---

_Problems with IPC in practice_

# 2a. Mistakes and typos _can also_ be runtime errors

<v-clicks>

- Only the listener API's allow specifying a message's type.

````md magic-move
```ts
// Strongly typed.
worker.addEventListener('message', (message: MessageEvent<WorkerMessage>) => {});
childProcess.on('message', (message: WorkerMessage) => {});

// Not strongly typed.
worker.postMessage({/*...*/});
childProcess.send({/*...*/});
```

```ts
// Strongly typed.
worker.addEventListener('message', (message: MessageEvent<WorkerMessage>) => {});
childProcess.on('message', (message: WorkerMessage) => {});

// Not strongly typed.
worker.postMessage({/*...*/} as WorkerMessage);
childProcess.send({/*...*/} as WorkerMessage);
```
````

</v-clicks>
<v-clicks>

- All messages go through Serialization, but are serialized differently by each runtime.
  - Web Workers use the HTML structured clone algorithm.
  - Node.js uses JSON by default.
- Sometimes it is valuable to manually JSON serialize/deserialize to avoid surprises.
  - In these cases, it's important to stay consistent so event handling does not get overly complex.

</v-clicks>

---
transition: fade
layout: default
---

_Problems with IPC in practice_

# 3. Tracking IPC call output is clunky

<v-clicks>

- Sometimes we want to _call_ a function in another process then use the result.
- This would require:
  1. 'request' message from process A to process B
  2. 'response' message from process B back to process A

```ts
// This triggers a function using `data` in another process,
// and then resolves with the final result!
const result = await executeSomeIpcFunction(data);
```

</v-clicks>

---
transition: fade
layout: default
---

_Problems with IPC in practice_

# 3. Tracking IPC call output is clunky

<v-click>

````md magic-move
```ts
const worker = new Worker('add.js');

function addNumbers(x: number, y: number): Promise<number> {
  // ...
}
```

```ts
function addNumbers(x: number, y: number): Promise<number> {
  return new Promise<number>((resolve) => {
    // ...
  });
}
```

```ts {3-6}
function addNumbers(x: number, y: number): Promise<number> {
  return new Promise<number>((resolve) => {
    worker.postMessage({
      type: 'add-numbers',
      numbers: [x, y],
    });
  });
}
```

```ts {3-7}
function addNumbers(x: number, y: number): Promise<number> {
  return new Promise<number>((resolve) => {
    const onWorkerMessage = ({ data }) => {
     // ...
    };

    worker.addEventListener('message', onWorkerMessage);

    worker.postMessage({
      type: 'add-numbers',
      numbers: [x, y],
    });
  });
}
```

```ts {4-9|*}
function addNumbers(x: number, y: number): Promise<number> {
  return new Promise<number>((resolve) => {
    const onWorkerMessage = ({ data }) => {
      if (data.type !== 'add-numbers-result') {
        return;
      }

      worker.removeEventListener('message', onWorkerMessage);
      resolve(data.result);
    };

    worker.addEventListener('message', onWorkerMessage);

    worker.postMessage({
      type: 'add-numbers',
      numbers: [x, y],
    });
  });
}
```
````

</v-click>

---
transition: fade
layout: statement
---

# There's a slight issue here...

---
transition: fade
layout: default
---

_Problems with IPC in practice_

# 3. Tracking IPC call output is clunky

````md magic-move
```ts {9}
function addNumbers(x: number, y: number): Promise<number> {
  return new Promise<number>((resolve) => {
    const onWorkerMessage = ({ data }) => {
      if (data.type !== 'add-numbers-result') {
        return;
      }

      worker.removeEventListener('message', onWorkerMessage);
      resolve(data.result); // How do we know this is the result for x and y?
    };

    worker.addEventListener('message', onWorkerMessage);

    worker.postMessage({
      type: 'add-numbers',
      numbers: [x, y],
    });
  });
}
```

```ts
function addNumbers(x: number, y: number): Promise<number> {
  // ...
}

calculateNumbersButton.addEventListener('click', async () => {
  const x = xInputElement.valueAsNumber;
  const y = yInputElement.valueAsNumber;

  const result = await addNumbers(x, y);
  resultLabel.innerText = `Result is ${result}!`;
});

// Click 1:
//    x = 5, y = 5. Result = 10. All good!
```

```ts
function addNumbers(x: number, y: number): Promise<number> {
  // ...
}

calculateNumbersButton.addEventListener('click', async () => {
  const x = xInputElement.valueAsNumber;
  const y = yInputElement.valueAsNumber;

  const result = await addNumbers(x, y);
  resultLabel.innerText = `Result is ${result}!`;
});

// Click 1:
//    x = 5, y = 5. Result = 10. All good!
// Click 2:
//    x = 2, y = 1. Result = 3. Yay!
```

```ts
function addNumbers(x: number, y: number): Promise<number> {
  // ...
}

calculateNumbersButton.addEventListener('click', async () => {
  const x = xInputElement.valueAsNumber;
  const y = yInputElement.valueAsNumber;

  const result = await addNumbers(x, y);
  resultLabel.innerText = `Result is ${result}!`;
});

// Click 1:
//    x = 5, y = 5. Result = 10. All good!
// Click 2 (before click 1 resolves):
//    x = 2, y = 1.
```

```ts
function addNumbers(x: number, y: number): Promise<number> {
  // ...
}

calculateNumbersButton.addEventListener('click', async () => {
  const x = xInputElement.valueAsNumber;
  const y = yInputElement.valueAsNumber;

  const result = await addNumbers(x, y);
  resultLabel.innerText = `Result is ${result}!`;
});

// Click 1:
//    x = 5, y = 5. Result = 10. All good!
// Click 2 (before click 1 resolves):
//    x = 2, y = 1. Result = 10. Uh oh!
```

```ts
function addNumbers(x: number, y: number): Promise<number> {
  return new Promise<number>((resolve) => {
    const onWorkerMessage = ({ data }) => {
      if (data.type !== 'add-numbers-result') {
        return;
      }

      worker.removeEventListener('message', onWorkerMessage);
      resolve(data.result);
    };

    worker.addEventListener('message', onWorkerMessage);

    worker.postMessage({
      type: 'add-numbers',
      numbers: [x, y],
    });
  });
}
```

```ts {2}
function addNumbers(x: number, y: number): Promise<number> {
  const requestId = `${x}:${y}`;
  return new Promise<number>((resolve) => {
    const onWorkerMessage = ({ data }) => {
      if (data.type !== 'add-numbers-result') {
        return;
      }

      worker.removeEventListener('message', onWorkerMessage);
      resolve(data.result);
    };

    worker.addEventListener('message', onWorkerMessage);

    worker.postMessage({
      type: 'add-numbers',
      numbers: [x, y],
    });
  });
}
```

```ts {2,4-11,15-19|*}
function addNumbers(x: number, y: number): Promise<number> {
  const requestId = `${x}:${y}`;
  return new Promise<number>((resolve) => {
    const onWorkerMessage = ({ data }) => {
      if (requestId !== data.requestId || data.type !== 'add-numbers-result') {
        return;
      }

      worker.removeEventListener('message', onWorkerMessage);
      resolve(data.result);
    };

    worker.addEventListener('message', onWorkerMessage);

    worker.postMessage({
      type: 'add-numbers',
      numbers: [x, y],
      requestId,
    });
  });
}
```
````

---
transition: fade
layout: default
---

_Problems with IPC in practice_

# 3. Tracking IPC call output is clunky


- This doesn't even cover every edge case for a good UX. For example:
  - Timeouts
  - Errors

<v-clicks>

- AND this would need to be replicated separately for every _IPC call_ that you have.

</v-clicks>

---
transition: fade
layout: center
---

# Problems with IPC in practice

1. Structured data is needed to support multiple message types
2. Mistakes and typos are silent runtime bugs (and sometimes crashes)
3. Tracking IPC call output is clunky

---
transition: fade
layout: statement
---

# How can we improve this?
