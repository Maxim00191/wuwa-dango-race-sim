import { MonteCarloCancelledError } from "@/services/monteCarlo/runner/abort";
import type {
  MonteCarloWorkerCompleteMessage,
  MonteCarloWorkerCompletePayload,
  MonteCarloWorkerErrorMessage,
  MonteCarloWorkerMessage,
  MonteCarloWorkerProgressMessage,
  MonteCarloWorkerRequest,
} from "@/services/monteCarlo/contracts/workerMessages";

export type WorkerChunkRegistry = {
  register: (reject: (reason?: unknown) => void) => void;
  unregister: (reject: (reason?: unknown) => void) => void;
  rejectAll: () => void;
};

export function createWorkerChunkRegistry(): WorkerChunkRegistry {
  const pendingRejects = new Set<(reason?: unknown) => void>();
  return {
    register: (reject) => {
      pendingRejects.add(reject);
    },
    unregister: (reject) => {
      pendingRejects.delete(reject);
    },
    rejectAll: () => {
      for (const reject of pendingRejects) {
        reject(new MonteCarloCancelledError());
      }
      pendingRejects.clear();
    },
  };
}

export function decodeWorkerCompletePayload(
  message: MonteCarloWorkerCompleteMessage
): MonteCarloWorkerCompletePayload {
  return JSON.parse(
    new TextDecoder().decode(message.payload)
  ) as MonteCarloWorkerCompletePayload;
}

export function runWorkerChunk(
  worker: Worker,
  request: MonteCarloWorkerRequest,
  onProgress: (message: MonteCarloWorkerProgressMessage) => void,
  chunkRegistry: WorkerChunkRegistry
): Promise<MonteCarloWorkerCompleteMessage> {
  return new Promise((resolve, reject) => {
    chunkRegistry.register(reject);

    const detach = () => {
      chunkRegistry.unregister(reject);
      worker.onmessage = null;
      worker.onerror = null;
    };

    worker.onmessage = (event: MessageEvent<MonteCarloWorkerMessage>) => {
      const message = event.data;
      if (message.requestId !== request.requestId) {
        return;
      }
      if (message.type === "progress") {
        onProgress(message);
        return;
      }
      if (message.type === "complete") {
        detach();
        resolve(message);
        return;
      }
      const errorMessage = (message as MonteCarloWorkerErrorMessage).message;
      detach();
      reject(new Error(errorMessage));
    };
    worker.onerror = () => {
      detach();
      reject(new MonteCarloCancelledError());
    };
    worker.postMessage(request);
  });
}

let workerRequestId = 0;

export function allocateWorkerRequestId(): number {
  workerRequestId += 1;
  return workerRequestId;
}
