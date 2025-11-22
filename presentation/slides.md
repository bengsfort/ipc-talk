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
layout: two-code-blocks
---

# IPC in Node.js

::left::

<div v-click="1">
<div class="code-block-header font-mono">
  main.ts
</div>

```ts
import { fork } from 'node:child_process';

// Create a sub-process for the heavy task.
const taskProcess = fork('./do-heavy-task.js');

// Add a listener for the result of the task.
taskProcess.on('message', (message) => {
  console.log(
    'Task process finished work',
    message.result
  );
});

// Send a message to the sub-process to start the task.
taskProcess.send({
  fileToProcess: './some-big-file.txt'
});
```

</div>

::right::

<div v-click="2">

<div class="code-block-header font-mono">
  do-heavy-task.ts
</div>

```ts
function processFile(file: string): any {
  // ...
}

// Listen for a message from the main process.
process.on('message', (message) => {
  // Do some very serious and heavy processing.
  const result = processFile(message.fileToProcess);

  // Send the result back to the main process.
  process.send({
    result,
  });
});
```

</div>

---
transition: fade
layout: two-code-blocks
---

# IPC in Web

::left::

<div v-click="1">
<div class="code-block-header font-mono">
  app.ts
</div>

```ts
const resultEl = getElementById('result-label');
const buttonEl = getElementById('calculate-button');

// Create the worker.
const worker = new Worker('add.js');

// Add a listener for the message containing the result.
worker.addEventListener('message', (event) => {
  resultEl.innerText = `Result: ${event.data}`;
});

// Send a message to the worker to initialize the work.
buttonEl.addEventListener('click', (ev) => {
  worker.postMessage({ x: 50, y: 100 });
});
```
</div>

::right::

<div v-click="2">
<div class="code-block-header font-mono">
  add.ts
</div>

```ts
// Listen for a message from the main process.
addEventListener('message', (event) => {
  // Do some serious work.
  const result = event.x + event.y;

  // Send the result back to the main thread.
  postMessage(result);
});
```
</div>

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
worker.addListener('message', ({ data }: MessageEvent<number>) => {
  doSomethingWithNumber(data);
});
```

```ts
// Expected events:
// number
// string
worker.addListener('message', ({ data }: MessageEvent<number | string>) => {
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
worker.addListener('message', ({ data }: MessageEvent<number | string>) => {
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

worker.addListener('message', ({ data }: MessageEvent<WorkerMessage>) => {
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

worker.addListener('message', ({ data }: MessageEvent<WorkerMessage>) => {
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

worker.addListener('message', ({ data }: MessageEvent<WorkerMessage>) => {
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
worker.addListener('message', ({ data }) => {
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
worker.addListener('message', ({ data }) => {
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
worker.addListener('message', ({ data }) => {
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
worker.addListener('message', ({ data }) => {
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
worker.addListener('message', ({ data }) => {
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
worker.addListener('message', ({ data }) => {
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
worker.addListener('message', ({ data }) => {
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
childProcess.addListener('message', (message: WorkerMessage) => {});

// Not strongly typed.
worker.postMessage({/*...*/});
childProcess.send({/*...*/});
```

```ts
// Strongly typed.
worker.addEventListener('message', (message: MessageEvent<WorkerMessage>) => {});
childProcess.addListener('message', (message: WorkerMessage) => {});

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
