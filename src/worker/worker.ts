import { parentPort, workerData, threadId } from "node:worker_threads";

const startTime = Date.now();
const endTime = startTime + workerData.durationMs;

let iterations = 0;

while (Date.now() < endTime) {
  Math.sqrt(Math.random() * 1_000_000);
  iterations++;
}

parentPort!.postMessage({
  threadId,
  iterations,
  durationMs: Date.now() - startTime,
});
