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
