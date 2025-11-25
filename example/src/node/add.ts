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
  totalCalculations++;
  return `Hello, ${name}`;
});

setInterval(() => {
  ipcEvents.dispatch('worker-metrics', {
    uptime: `${Math.floor(process.uptime())}s`,
    totalCalculations,
  });
}, 6000); // Every 60s
