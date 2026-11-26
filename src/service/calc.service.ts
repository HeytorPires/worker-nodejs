// Serviço que faz um calculo que travaria a thread principal se fosse executado nela. Por isso é executado
export const calcService = (endTime: number, iterations: number): number => {
  while (Date.now() < endTime) {
    Math.sqrt(Math.random() * 1_000_000);
    iterations++;
  }
  return iterations;
};
