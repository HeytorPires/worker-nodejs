import { parentPort, threadId } from "node:worker_threads";

// O worker fica vivo esperando tarefas: cada mensagem recebida é um job.
parentPort!.on("message", ({ durationMs }: { durationMs: number }) => {
  const startTime = Date.now();
  const endTime = startTime + durationMs;
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
});
