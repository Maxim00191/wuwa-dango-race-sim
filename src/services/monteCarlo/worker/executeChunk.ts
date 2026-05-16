import {
  absorbHeadlessOutcomeIntoAggregate,
  createEmptyMonteCarloAggregate,
} from "@/services/monteCarlo/aggregate";
import type { MonteCarloWorkerRequest } from "@/services/monteCarlo/contracts/workerMessages";
import {
  encodeCompletePayload,
  postWorkerMessage,
  pruneAggregateForTransfer,
} from "@/services/monteCarlo/worker/transfer";
import { simulateHeadlessScenario } from "@/services/gameEngine";
import {
  createObserverSession,
  finalizeObserverRecords,
  observeCompletedMatch,
} from "@/services/observerSession";

export function executeMonteCarloWorkerChunk(
  request: MonteCarloWorkerRequest
): void {
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
  postWorkerMessage(
    {
      type: "complete",
      requestId: request.requestId,
      payload,
    },
    [payload]
  );
}
