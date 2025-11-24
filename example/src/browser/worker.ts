export interface Events {
  started: [];
  tick: [now: number];
  reset: [now: number];
}

export interface Api {
  add(x: number, y: number): number;
  doLongRunningThing(): boolean;
}

addEventListener("message", (ev) => {
  console.log("worker got event!", ev);
});
