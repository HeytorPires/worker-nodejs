// Especificação OpenAPI 3 da API, servida pelo swagger-ui-express em /docs.
// Escrita à mão: ao mudar uma rota, atualize aqui também.

const durationParam = {
  name: "duration",
  in: "query",
  required: false,
  description:
    "Tempo de processamento em milissegundos. Ausente ou inválido (NaN, 0, negativo) usa o padrão de 60000.",
  schema: { type: "integer", minimum: 1, default: 60000, example: 5000 },
};

export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Worker Threads API",
    version: "1.0.0",
    description:
      "API de estudo que compara processamento CPU-bound na thread principal (bloqueia o event loop) com processamento em um pool de worker threads.",
  },
  servers: [{ url: "http://localhost:3333" }],
  tags: [
    { name: "calc", description: "Processamento pesado de CPU" },
    {
      name: "users",
      description: "Rota leve para testar se o event loop responde",
    },
  ],
  paths: {
    "/calc": {
      get: {
        tags: ["calc"],
        summary: "Processa na thread principal (bloqueia o event loop)",
        description:
          "Executa o cálculo direto na thread principal. Enquanto roda, NENHUMA outra request é atendida, inclusive GET /users.",
        parameters: [durationParam],
        responses: {
          200: {
            description: "Processamento concluído",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SyncResult" },
              },
            },
          },
        },
      },
    },
    "/calc/job": {
      get: {
        tags: ["calc"],
        summary: "Processa em um worker do pool (não bloqueia)",
        description:
          "Envia o cálculo para o WorkerPool. Se não houver workers disponíveis (availableWorkers vazio), a tarefa espera na fila. O event loop continua livre para outras requests.",
        parameters: [durationParam],
        responses: {
          200: {
            description: "Processamento concluído",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Processamento concluído com sucesso",
                    },
                    result: { $ref: "#/components/schemas/CalcJobResult" },
                  },
                },
              },
            },
          },
          500: {
            description: "Worker falhou durante o processamento",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Message" },
                example: { message: "Erro ao processar a solicitação" },
              },
            },
          },
        },
      },
    },
    "/users": {
      get: {
        tags: ["users"],
        summary: "Lista usuários (dados em memória)",
        parameters: [
          {
            name: "nome",
            in: "query",
            required: false,
            description:
              "Filtra por parte do nome, sem diferenciar maiúsculas/minúsculas.",
            schema: { type: "string", example: "ana" },
          },
        ],
        responses: {
          200: {
            description: "Lista de usuários",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      SyncResult: {
        type: "object",
        properties: {
          durationMs: { type: "integer", example: 5000 },
          result: {
            type: "integer",
            description: "Iterações executadas",
            example: 150000000,
          },
        },
      },
      CalcJobResult: {
        type: "object",
        properties: {
          threadId: {
            type: "integer",
            description: "Id da worker thread que executou",
            example: 2,
          },
          iterations: { type: "integer", example: 150000000 },
          durationMs: { type: "integer", example: 5000 },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          nome: { type: "string", example: "Ana Souza" },
          email: { type: "string", example: "ana.souza@exemplo.com" },
          criadoEm: {
            type: "string",
            format: "date-time",
            example: "2026-01-10T12:00:00.000Z",
          },
        },
      },
      Message: {
        type: "object",
        properties: { message: { type: "string" } },
      },
    },
  },
};
