import { NON_TRANSFERRED_AGGREGATE_KEYS } from "@/services/monteCarlo/config/aggregateKeys";
import type {
  MonteCarloWorkerCompletePayload,
  MonteCarloWorkerMessage,
} from "@/services/monteCarlo/contracts/workerMessages";
import type { MonteCarloAggregateSnapshot } from "@/types/monteCarlo";

type WorkerPostMessageScope = {
  postMessage(message: MonteCarloWorkerMessage, transfer?: Transferable[]): void;
};

const workerScope = self as unknown as WorkerPostMessageScope;

export function postWorkerMessage(
  message: MonteCarloWorkerMessage,
  transfer?: Transferable[]
): void {
  workerScope.postMessage(message, transfer);
}

export function encodeCompletePayload(
  payload: MonteCarloWorkerCompletePayload
): ArrayBuffer {
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  return encoded.buffer.slice(
    encoded.byteOffset,
    encoded.byteOffset + encoded.byteLength
  );
}

export function pruneAggregateForTransfer(
  aggregate: MonteCarloAggregateSnapshot
): Partial<MonteCarloAggregateSnapshot> {
  const payload: Partial<Record<keyof MonteCarloAggregateSnapshot, unknown>> =
    {};
  for (const key of Object.keys(aggregate) as (keyof MonteCarloAggregateSnapshot)[]) {
    if (NON_TRANSFERRED_AGGREGATE_KEYS.has(key)) {
      continue;
    }
    payload[key] = aggregate[key];
  }
  return payload as Partial<MonteCarloAggregateSnapshot>;
}
