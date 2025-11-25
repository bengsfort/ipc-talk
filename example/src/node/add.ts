import type { IpcApiMap, IpcEventMap } from "../common/messages.js";
import { createWorkerEventEmitter, createWorkerIpcApi } from "./ipc-wrapper.js";

let totalCalculations = 0;

const ipcEvents = createWorkerEventEmitter<{}, IpcEventMap>(process);
const ipcApi = createWorkerIpcApi<{}, IpcApiMap>(process);

ipcApi.registerIpcHandler('add-numbers', (numbers) => {
  totalCalculations++;
  return numbers.reduce(
    (total, curr) => total + curr,
    0,
  );
});

ipcApi.registerIpcHandler('multiply-numbers', (numbers) => {
  totalCalculations++;
  return numbers.reduce(
    (total, curr) => total * curr,
    0,
  );
});

ipcApi.registerIpcHandler('subtract-numbers', (numbers) => {
  totalCalculations++;
  return numbers.reduce(
    (total, curr) => total - curr,
    0,
  );
});

ipcApi.registerIpcHandler('say-hello', (name) => {
  return `Hello, ${name}!`;
});

// Trigger a message every 60s with some metrics from this worker.
setInterval(() => {
  ipcEvents.dispatch('worker-metrics', {
    uptime: `${Math.floor(process.uptime())}s`,
    totalCalculations,
  });
}, 60000);
