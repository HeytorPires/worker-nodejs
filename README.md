# worker-nodejs

Projeto de estudo sobre **worker threads no Node.js**: mostra na prática por que um cálculo pesado de CPU trava uma API Express inteira e como um **pool de workers** resolve isso.

## Intuito

O Node.js executa o seu JavaScript em **uma única thread** (o event loop). Isso funciona muito bem para I/O (banco, rede, arquivos), mas um trabalho **CPU-bound** — um loop longo, criptografia, processamento de imagem — ocupa essa thread e **nenhuma outra request é atendida** até ele terminar.

A API expõe o mesmo cálculo de duas formas para comparar:

| Rota | Onde roda | Efeito |
|---|---|---|
| `GET /calc` | Thread principal | Bloqueia o event loop: `GET /users` fica sem resposta enquanto o cálculo roda |
| `GET /calc/job` | Worker thread do pool | O event loop continua livre: `GET /users` responde na hora |

### Experimento

1. Suba a API (`npm run dev`).
2. Chame `GET /calc?duration=10000` e, logo em seguida, `GET /users` → `/users` só responde depois de ~10 s.
3. Chame `GET /calc/job?duration=10000` e, logo em seguida, `GET /users` → `/users` responde imediatamente.
4. Dispare 3 ou mais `GET /calc/job` ao mesmo tempo → como o pool tem 2 workers, o terceiro espera na fila (veja o log `Fila de tarefas: ...`).

## Como rodar

Requisitos: Node.js 20+.

```bash
npm install
npm run dev        # desenvolvimento com reload (tsx watch)
npm start          # execução simples
npm run typecheck  # checagem de tipos
```

A API sobe em `http://localhost:3333`.

- **Swagger UI:** http://localhost:3333/docs
- **Spec OpenAPI (JSON):** http://localhost:3333/docs.json
- **Requests prontas:** pasta `http/` (extensão REST Client do VS Code ou HTTP Client do JetBrains)

## Endpoints

Todas as rotas de cálculo aceitam `?duration=<ms>`: quanto tempo o cálculo deve ocupar a CPU. Ausente ou inválido (não numérico, 0, negativo) usa o padrão de **60000 ms**.

| Método | Rota | Descrição | Exemplo de resposta |
|---|---|---|---|
| GET | `/calc?duration=5000` | Cálculo síncrono na thread principal | `{ "durationMs": 5000, "result": 150000000 }` |
| GET | `/calc/job?duration=5000` | Cálculo em um worker do pool | `{ "message": "...", "result": { "threadId": 2, "iterations": 150000000, "durationMs": 5000 } }` |
| GET | `/users?nome=ana` | Lista usuários em memória (rota leve para testar o event loop) | `[{ "id": 1, "nome": "Ana Souza", ... }]` |

`threadId` mostra qual worker executou o job: com o pool reaproveitando threads, ele alterna sempre entre os mesmos valores.

## Como foi implementado

### Fluxo de `GET /calc/job`

```
request ─► calc.routes.ts ─► pool.run({ durationMs })
                                  │
                                  ├─ há availableWorkers? ─► postMessage(data) ─► worker.ts
                                  │                                                 │
                                  └─ senão, entra na queue                          ▼
                                                                           calcService(...)
                                                                                    │
response ◄─ Promise resolvida ◄─ on("message") ◄─ postMessage(result) ◄─────────────┘
                                       │
                                       └─ worker volta para availableWorkers e puxa a próxima tarefa da queue
```

### Peças principais

- **`WorkerPool<TData, TResult>`** (`src/worker/worker-pool.ts`) — cria um número fixo de workers **uma única vez**, ao subir a aplicação, e os reaproveita. Criar uma thread por request seria caro (cada worker tem seu próprio V8 isolate) e sem limite, o que derrubaria a máquina sob carga.
  - `availableWorkers`: workers livres
  - `queue`: tarefas esperando worker (FIFO)
  - `running`: qual tarefa cada worker ocupado está executando
  - `run(data)`: enfileira e devolve uma `Promise<TResult>` que resolve quando o worker responde
  - Se um worker emitir `error`, a tarefa dele é rejeitada e esse worker sai do pool
- **`worker.ts`** — fica vivo escutando mensagens; cada mensagem é um job. Executa o cálculo e devolve o resultado com `parentPort.postMessage`.
- **`calcService`** (`src/service/calc.service.ts`) — o cálculo em si: um loop de `Math.sqrt` até atingir o tempo pedido. É o **mesmo código** usado nas duas rotas, então a única diferença entre elas é **em qual thread** ele roda.
- **`types.ts`** — contrato da mensagem entre a thread principal e o worker (`CalcJobData` / `CalcJobResult`). Fica num arquivo só de tipos para que os dois lados importem com `import type` sem executar o `worker.ts`.
- **Injeção do pool** — o pool é criado no `server.ts` e passado para `createCalcRoutes(pool)`. Assim fica explícito o que a aplicação cria ao subir, o mesmo pool pode ser reaproveitado por outras rotas e, em testes, dá para injetar um pool falso.

> O pool tem tamanho **2** de propósito, para ser fácil observar a fila. Em produção, use `os.availableParallelism()` (aproximadamente um worker por núcleo).

## Arquitetura das pastas

```
.
├── http/                      # requests prontas para testar a API
│   ├── calc.http
│   └── users.http
├── src/
│   ├── server.ts              # ponto de entrada: cria o pool, monta o Express, rotas e Swagger
│   ├── docs/
│   │   └── swagger.ts         # especificação OpenAPI 3 servida em /docs
│   ├── routes/                # camada HTTP: lê a request, chama o serviço/pool, responde
│   │   ├── calc.routes.ts     # GET /calc e GET /calc/job
│   │   └── users.routes.ts    # GET /users
│   ├── service/               # regra de negócio, sem dependência do Express
│   │   └── calc.service.ts    # cálculo CPU-bound
│   └── worker/                # tudo que envolve worker threads
│       ├── worker-pool.ts     # pool genérico: queue, availableWorkers e running
│       ├── worker.ts          # código que roda dentro de cada thread
│       └── types.ts           # contrato de mensagens entre thread principal e worker
├── package.json
└── tsconfig.json
```

## Stack

- Node.js + TypeScript (executado direto com `tsx`, sem build)
- Express 5
- `node:worker_threads`
- swagger-ui-express (documentação)

## Limitações conhecidas

- **Sem limite máximo para `duration`**: `GET /calc?duration=999999999` trava a API por dias. Aceitável em um projeto de estudo, nunca em produção.
- **Fila sem limite**: sob carga, a fila do pool cresce indefinidamente em memória. Bibliotecas como [Piscina](https://github.com/piscinajs/piscina) oferecem `maxQueue`, timeout por tarefa e reposição de workers que morrem.
- **Worker que quebra não é recriado**: o pool perde capacidade até reiniciar a aplicação.
- **Tipos não validados em runtime**: `TData`/`TResult` são checados só na compilação; o `postMessage` não valida o formato da mensagem.
