import { simulateHeadlessScenario } from "@/services/gameEngine";
import {
  absorbHeadlessOutcomeIntoAggregate,
  createEmptyMonteCarloAggregate,
} from "@/services/monteCarloAggregate";
import {
  createObserverSession,
  finalizeObserverRecords,
  observeCompletedMatch,
} from "@/services/observerSession";
import type {
  MonteCarloWorkerCompletePayload,
  MonteCarloWorkerMessage,
  MonteCarloWorkerRequest,
} from "@/services/monteCarloWorkerTypes";
import type { MonteCarloAggregateSnapshot } from "@/types/monteCarlo";

const NON_TRANSFERRED_AGGREGATE_KEYS = new Set<keyof MonteCarloAggregateSnapshot>([
  "selectedBasicIds",
  "participantCount",
  "scenarioKind",
  "scenarioLabel",
  "basicAnalyticsByBasicId",
  "basicAnalyticsByContext",
  "modeAnalytics",
  "observerRecords",
  "totalRuntimeMs",
]);

type WorkerPostMessageScope = {
  postMessage(message: MonteCarloWorkerMessage, transfer?: Transferable[]): void;
};

const workerScope = self as unknown as WorkerPostMessageScope;

function postWorkerMessage(
  message: MonteCarloWorkerMessage,
  transfer?: Transferable[]
): void {
  workerScope.postMessage(message, transfer);
}

function encodeCompletePayload(
  payload: MonteCarloWorkerCompletePayload
): ArrayBuffer {
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  return encoded.buffer.slice(
    encoded.byteOffset,
    encoded.byteOffset + encoded.byteLength
  );
}

function pruneAggregateForTransfer(
  aggregate: MonteCarloAggregateSnapshot
): Partial<MonteCarloAggregateSnapshot> {
  const payload: Partial<Record<keyof MonteCarloAggregateSnapshot, unknown>> = {};
  for (const key of Object.keys(aggregate) as (keyof MonteCarloAggregateSnapshot)[]) {
    if (NON_TRANSFERRED_AGGREGATE_KEYS.has(key)) {
      continue;
    }
    payload[key] = aggregate[key];
  }
  return payload as Partial<MonteCarloAggregateSnapshot>;
}

self.onmessage = (event: MessageEvent<MonteCarloWorkerRequest>) => {
  const request = event.data;
  if (request.type !== "run") {
    return;
  }
  try {
    const boardEffectByCellIndex = new Map(request.boardEffects);
    const aggregate = createEmptyMonteCarloAggregate(
      request.selectedBasicIds,
      request.scenarioKind,
      request.scenarioLabel
    );
    const observerSession = createObserverSession();
    const progressStride = Math.max(
      1,
      Math.min(request.totalRuns, request.progressReportInterval)
    );
    let lastProgressAt = 0;
    for (let completedRuns = 0; completedRuns < request.totalRuns; completedRuns += 1) {
      const seed = (request.seedBase + completedRuns) >>> 0;
      const outcome = simulateHeadlessScenario(
        request.scenario,
        boardEffectByCellIndex,
        { captureReplay: false, seed }
      );
      absorbHeadlessOutcomeIntoAggregate(aggregate, outcome);
      observeCompletedMatch(observerSession, outcome, () =>
        simulateHeadlessScenario(request.scenario, boardEffectByCellIndex, {
          captureReplay: true,
          seed,
        })
      );
      const reportedRuns = completedRuns + 1;
      if (
        reportedRuns === request.totalRuns ||
        reportedRuns - lastProgressAt >= progressStride
      ) {
        lastProgressAt = reportedRuns;
        postWorkerMessage({
          type: "progress",
          requestId: request.requestId,
          completedRuns: reportedRuns,
        });
      }
    }
    const payload = encodeCompletePayload({
      aggregate: pruneAggregateForTransfer(aggregate),
      observerRecords: finalizeObserverRecords(observerSession),
    });
    postWorkerMessage({
      type: "complete",
      requestId: request.requestId,
      payload,
    }, [payload]);
  } catch (error) {
    postWorkerMessage({
      type: "error",
      requestId: request.requestId,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
