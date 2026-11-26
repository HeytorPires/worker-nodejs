import { parentPort, threadId } from "node:worker_threads";
import { calcService } from "../service/calc.service";
import type { CalcJobData, CalcJobResult } from "./types";

// O worker fica vivo esperando tarefas: cada mensagem recebida é um job.
parentPort!.on("message", ({ durationMs }: CalcJobData) => {
  const startTime = Date.now();
  const endTime = startTime + durationMs;
  let iterations = 0;

  const calc = calcService(endTime, iterations);

  const result: CalcJobResult = {
    threadId,
    iterations: calc,
    durationMs: Date.now() - startTime,
  };
  parentPort!.postMessage(result);
});
