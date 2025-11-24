import type { IpcApiMap, IpcEventMap } from "../common/messages.js";
import { createWorkerEventEmitter, createWorkerIpcApi } from "./ipc-wrapper.js";

function addNumbers(...args: number[]): number {
  return args.reduce(
    (total, curr) => total + curr,
    0,
  );
}

const ipcEvents = createWorkerEventEmitter<{}, IpcEventMap>(process);
const ipcApi = createWorkerIpcApi<{}, IpcApiMap>(process, (request) => {
  if (request.fnName === 'add-numbers') {
    request.args
    request.args[0]
    return addNumbers(...request.args[0].numbers);
  }
});

ipcEvents.addListener('add-numbers', (event) => {  
  // Add the numbers together
  const result = (event.payload as number[]).reduce(
    (total, curr) => total + curr,
    0,
  );

  console.log('Second process sending result back to main process.');

  // Send the result back to the main process.
  ipcEvents.dispatch('result', result);
});
