/* eslint-disable promise/param-names */
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PromiseWithResolvers<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}

export function createPromiseWithResolvers<T>(): PromiseWithResolvers<T> {
  let resolve: PromiseWithResolvers<T>["resolve"] = () => { };

  let reject: PromiseWithResolvers<T>["reject"] = () => { };

  const promise = new Promise<T>((resolver, rejecter) => {
    resolve = resolver;
    reject = rejecter;
  });

  return {
    promise,
    resolve,
    reject,
  };
}
