import type { MonteCarloWorkerRequest } from "@/services/monteCarlo/contracts/workerMessages";
import { executeMonteCarloWorkerChunk } from "@/services/monteCarlo/worker/executeChunk";
import { postWorkerMessage } from "@/services/monteCarlo/worker/transfer";

export function registerMonteCarloWorkerHandler(): void {
  self.onmessage = (event: MessageEvent<MonteCarloWorkerRequest>) => {
    const request = event.data;
    if (request.type !== "run") {
      return;
    }
    try {
      executeMonteCarloWorkerChunk(request);
    } catch (error) {
      postWorkerMessage({
        type: "error",
        requestId: request.requestId,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };
}

registerMonteCarloWorkerHandler();
