import { Bridge } from "./adapters/Bridge.js";
import type { Events, Api } from "./worker.js";

const worker = new Worker(new URL("./worker.ts", import.meta.url), {
  type: "module",
});

worker.

const bridge = new Bridge<Events, Api>({
  onMessage(ev) {},
  postMessage(...data) {},
});

bridge.addListener("started", () => {
  console.log("(main) started");
});

bridge.addListener("tick", (now) => {
  console.log("(main) tick", now);
});

bridge.addListener("reset", () => {
  console.log("(main) reset");
});

worker.postMessage("foo");
console.log("running!");
