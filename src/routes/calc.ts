import { Router } from "express";
import path from "node:path";
import { WorkerPool } from "../worker/worker-pool";

export const calcRoutes = Router();

// Tamanho 2 para facilitar ver a fila. Em produção: os.availableParallelism().
const pool = new WorkerPool(path.resolve(__dirname, "../worker/worker.ts"), 2);

calcRoutes.get("/job", async (req, res) => {
  console.log("Iniciando processamento em segundo plano...");
  try {
    const result = await pool.run({ durationMs: 60_000 });

    res
      .status(200)
      .json({ message: "Processamento concluído com sucesso", result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao processar a solicitação" });
  }
});

calcRoutes.get("/", (req, res) => {
  console.log("Iniciando processamento síncrono...");
  const endTime = Date.now() + 60_000;

  while (Date.now() < endTime) {
    Math.sqrt(Math.random() * 1_000_000);
  }

  console.log("Processamento síncrono concluído.");
  res.json({ 200: "ok" });
});
