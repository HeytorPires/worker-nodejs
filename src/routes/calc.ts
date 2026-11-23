import { Router } from "express";
import { Worker } from "worker_threads";
import path from "node:path";

export const calcRoutes = Router();

calcRoutes.get("/job", async (req, res) => {
  console.log("Iniciando processamento em segundo plano...");
  try {
    const result = await new Promise((resolve, reject) => {
      const worker = new Worker(
        path.resolve(__dirname, "../worker/worker.ts"),
        {
          workerData: {
            durationMs: 60_000,
          },
        },
      );
      worker.on("message", resolve);
      worker.on("error", reject);
      worker.on("exit", (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });

    res
      .status(200)
      .json({ message: "Processamento concluído com sucesso", result });
  } catch (error) {
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
