// Message schema for main process -> sub process message with numbers to add.
export interface AddNumbersMsg {
  type: 'add-numbers';
  numbers: number[];
}

// Message schema for main process -> sub process message with numbers to subtract.
export interface SubtractNumbersMsg {
  type: 'subtract-numbers';
  numbers: number[];
}

// Message schema for main process -> sub process message with a result.
export interface MultiplyNumbersMsg {
  type: 'multiply-numbers';
  numbers: number[];
}

// Message schema for sub process -> main process message with numbers to multiply.
export interface ResultMsg {
  type: 'result';
  operation: 'add' | 'subtract' | 'multiply';
  result: number;
}

// Message schema for sub process -> main process message with metrics
export interface WorkerMetricsMsg {
  type: 'worker-metrics';
  uptime: string;
  totalCalculations: number;
}

export interface IpcEventMap {
'result': {
  operation: 'add' | 'subtract' | 'multiply';
  result: number;
};
'worker-metrics': {
  uptime: string;
  totalCalculations: number;
};
}

export interface IpcApiMap {
  'add-numbers': (args: { numbers: number[] }) => number;
  'subtract-numbers': (args: { numbers: number[] }) => number;
  'multiply-numbers': (args: { numbers: number[] }) => number;
  'say-hello': (args: { name: string }) => string;
}
