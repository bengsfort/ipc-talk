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
const ipcApi = createWorkerIpcApi<IpcApiMap>(taskProcess);

ipcEvents.addListener('worker-metrics', ({ payload }) => {
  console.log(`Uptime: ${payload.uptime}\nTotal operations: ${payload.totalCalculations}`);
});

const greeting = await ipcApi.callIpcFunction('say-hello', 'Bob');
console.log(`Got greeting from other process: ${greeting}`);
