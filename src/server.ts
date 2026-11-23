import express, { NextFunction, Request, Response } from 'express';
import { calcRoutes } from './routes/calc';
import { usersRoutes } from './routes/users';

const app = express();

app.use(express.json());
app.use('/calc', calcRoutes);
app.use('/users', usersRoutes);

app.use((erro: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(erro);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

const porta = Number(process.env.PORT ?? 3333);
app.listen(porta, () => console.log(`[api] ouvindo na porta ${porta}`));
