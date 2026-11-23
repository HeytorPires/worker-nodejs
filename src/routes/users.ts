import { Router } from 'express';

const usuarios = [
  { id: 1, nome: 'Ana Souza', email: 'ana.souza@exemplo.com', criadoEm: '2026-01-10T12:00:00.000Z' },
  { id: 2, nome: 'Bruno Lima', email: 'bruno.lima@exemplo.com', criadoEm: '2026-03-22T09:30:00.000Z' },
  { id: 3, nome: 'Carla Mendes', email: 'carla.mendes@exemplo.com', criadoEm: '2026-07-05T15:45:00.000Z' },
];

export const usersRoutes = Router();

usersRoutes.get('/', (req, res) => {
  const nome = typeof req.query.nome === 'string' ? req.query.nome.trim().toLowerCase() : '';
  res.json(nome ? usuarios.filter((usuario) => usuario.nome.toLowerCase().includes(nome)) : usuarios);
});
