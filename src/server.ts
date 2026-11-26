import express, { NextFunction, Request, Response } from "express";
import path from "node:path";
import { createCalcRoutes } from "./routes/calc.routes";
import { usersRoutes } from "./routes/users.routes";
import { WorkerPool } from "./worker/worker-pool";
import type { CalcJobData, CalcJobResult } from "./worker/types";

// Tamanho 2 para facilitar ver a fila. Em produção: os.availableParallelism().
const pool = new WorkerPool<CalcJobData, CalcJobResult>(
  path.resolve(__dirname, "worker/worker.ts"),
  2,
);

const app = express();

app.use(express.json());
app.use("/calc", createCalcRoutes(pool));
app.use("/users", usersRoutes);

app.use((erro: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(erro);
  res.status(500).json({ erro: "Erro interno do servidor" });
});

const porta = Number(process.env.PORT ?? 3333);
app.listen(porta, () => console.log(`API ouvindo na porta ${porta}`));
