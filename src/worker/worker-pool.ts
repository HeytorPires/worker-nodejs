import { Worker } from "node:worker_threads";

// Uma tarefa: o dado enviado ao worker + resolve/reject da Promise de run()
type Task<TData, TResult> = {
  data: TData;
  resolve: (value: TResult) => void;
  reject: (error: Error) => void;
};

// Reaproveita um número fixo de workers em vez de criar um por requisição.
// TData: o que run() envia ao worker. TResult: o que o worker devolve.
export class WorkerPool<TData, TResult> {
  // workers livres
  private availableWorkers: Worker[] = [];
  // tarefas esperando um worker livre
  private queue: Task<TData, TResult>[] = [];
  // qual tarefa cada worker ocupado está executando
  private running = new Map<Worker, Task<TData, TResult>>();

  constructor(file: string, size: number) {
    // cria todos os workers uma única vez
    for (let i = 0; i < size; i++) {
      const worker = new Worker(file);

      // worker terminou: entrega o resultado e libera o worker
      worker.on("message", (result: TResult) => {
        this.running.get(worker)?.resolve(result);
        this.release(worker);
      });

      // worker quebrou: rejeita a tarefa (o worker morre e não volta ao pool)
      worker.on("error", (error) => {
        this.running.get(worker)?.reject(error);
        this.running.delete(worker);
      });

      // começa livre
      this.availableWorkers.push(worker);
    }
  }

  // coloca a tarefa na fila e devolve uma Promise com o resultado
  run(data: TData): Promise<TResult> {
    console.log(
      `Fila de tarefas: ${this.queue.length}, Tarefas em execução: ${this.running.size}`,
    );
    return new Promise<TResult>((resolve, reject) => {
      console.log(`Adicionando tarefa à fila (dado: ${JSON.stringify(data)})`);
      this.queue.push({ data, resolve, reject });
      // tenta executar já, se houver worker livre
      this.next();
    });
  }

  // devolve o worker para os livres e puxa a próxima tarefa
  private release(worker: Worker) {
    this.running.delete(worker);
    this.availableWorkers.push(worker);
    this.next();
  }

  // enquanto houver worker livre e tarefa na fila, junta os dois
  private next() {
    while (this.availableWorkers.length > 0 && this.queue.length > 0) {
      const worker = this.availableWorkers.pop()!;
      // pega a tarefa mais antiga
      const task = this.queue.shift()!;
      this.running.set(worker, task);
      // envia o dado para o worker processar
      worker.postMessage(task.data);
    }
  }
}
