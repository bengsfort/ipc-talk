// 
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
  'add-numbers': (numbers: number[]) => number;
  'subtract-numbers': (numbers: number[]) => number;
  'multiply-numbers': (numbers: number[]) => number;
  'say-hello': (name: string) => string;
}
