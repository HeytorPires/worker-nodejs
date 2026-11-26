import { Request, Router } from "express";
import { WorkerPool } from "../worker/worker-pool";
import type { CalcJobData, CalcJobResult } from "../worker/types";
import { calcService } from "../service/calc.service";

const DEFAULT_DURATION_MS = 60_000;

// Lê ?duration=<ms> da query. Ausente ou inválido (NaN, 0, negativo) usa o padrão.
function parseDuration(req: Request): number {
  const duration = Number(req.query.duration);
  return duration > 0 ? duration : DEFAULT_DURATION_MS;
}

// Recebe o pool de fora: quem cria (server.ts) é quem encerra.
export function createCalcRoutes(pool: WorkerPool<CalcJobData, CalcJobResult>) {
  const calcRoutes = Router();

  calcRoutes.get("/job", async (req, res) => {
    const durationMs = parseDuration(req);
    console.log(
      `Iniciando processamento em segundo plano (${durationMs}ms)...`,
    );
    try {
      const result = await pool.run({ durationMs });

      res
        .status(200)
        .json({ message: "Processamento concluído com sucesso", result });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao processar a solicitação" });
    }
  });

  calcRoutes.get("/", (req, res) => {
    const durationMs = parseDuration(req);

    console.log(`Iniciando processamento síncrono (${durationMs}ms)...`);
    const startTime = Date.now();
    const endTime = startTime + durationMs;

    const result = calcService(endTime, 0);

    console.log("Processamento síncrono concluído.");
    res.json({ durationMs: Date.now() - startTime, result });
  });

  return calcRoutes;
}
