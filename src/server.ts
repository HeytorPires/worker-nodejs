import express, { NextFunction, Request, Response } from "express";
import path from "node:path";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./docs/swagger";
import { createCalcRoutes } from "./routes/calc.routes";
import { usersRoutes } from "./routes/users.routes";
import { WorkerPool } from "./worker/worker-pool";
import type { CalcJobData, CalcJobResult } from "./worker/types";

const pool = new WorkerPool<CalcJobData, CalcJobResult>(
  path.resolve(__dirname, "worker/worker.ts"),
  2,
);

const app = express();

app.use(express.json());
app.use("/calc", createCalcRoutes(pool));
app.use("/users", usersRoutes);

// Documentação: interface em /docs e JSON da spec em /docs.json
app.get("/docs.json", (_req, res) => {
  res.json(swaggerDocument);
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((erro: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(erro);
  res.status(500).json({ erro: "Erro interno do servidor" });
});

const porta = 3333;
app.listen(porta, () => console.log(`API ouvindo na porta ${porta}`));
