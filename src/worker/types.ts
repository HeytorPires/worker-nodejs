// Contrato entre a thread principal e o worker.
// Fica num arquivo só de tipos para os dois lados importarem sem executar o worker.ts.

// O que a thread principal envia para o worker (pool.run)
export type CalcJobData = {
  durationMs: number;
};

// O que o worker devolve (parentPort.postMessage)
export type CalcJobResult = {
  threadId: number;
  iterations: number;
  durationMs: number;
};
