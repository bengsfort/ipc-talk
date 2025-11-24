import { fork } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWorkerEventEmitter, createWorkerIpcApi } from './ipc-wrapper.js';
import type { IpcApiMap, IpcEventMap } from '../common/messages.js';

// Make sure that the script is always relative to this file, not CWD.
const buildPath = dirname(fileURLToPath(import.meta.url));
const taskPath = join(buildPath, './add.js');

// Create a sub-process for the heavy task.
const taskProcess = fork(taskPath);

const ipcEvents = createWorkerEventEmitter<IpcEventMap>(taskProcess);
const ipcApi = createWorkerIpcApi<IpcApiMap>(taskProcess, () => {
  throw new Error('No API provided');
});

// Add a listener for the result of the task.
ipcEvents.addListener('result', (event) => {
  console.log(`Result: ${event.payload}`);
});

ipcEvents.addListener('worker-metrics', (event) => {
  console.log(`Uptime: ${event.payload.uptime}`);
});

const result = await ipcApi.callIpcFunction('add-numbers', {
  numbers: [5, 10],
});

console.log(`Result is: ${result}`);
