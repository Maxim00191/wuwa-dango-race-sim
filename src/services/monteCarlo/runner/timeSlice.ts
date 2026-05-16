import { absorbHeadlessOutcomeIntoAggregate } from "@/services/monteCarlo/aggregate";
import { RUNNER_TIME_SLICE_MS } from "@/services/monteCarlo/config/runnerTiming";
import {
  hasAbortBeenRequested,
  yieldToBrowser,
} from "@/services/monteCarlo/runner/abort";
import {
  createResultAggregate,
  finalizeResultAggregate,
} from "@/services/monteCarlo/runner/finalizeResult";
import { createSeedBase } from "@/services/monteCarlo/runner/seed";
import type {
  MonteCarloBatchResult,
  MonteCarloRunnerControls,
} from "@/services/monteCarlo/runner/types";
import { simulateHeadlessScenario } from "@/services/gameEngine";
import {
  createObserverSession,
  observeCompletedMatch,
} from "@/services/observerSession";

export async function runMonteCarloTimeSliced(
  controls: MonteCarloRunnerControls
): Promise<MonteCarloBatchResult> {
  const {
    totalRuns,
    scenario,
    boardEffectByCellIndex,
    onProgress,
    signal,
    shouldAbort,
  } = controls;
  const aggregate = createResultAggregate(controls);
  const observerSession = createObserverSession();
  const seedBase = createSeedBase();
  if (totalRuns <= 0) {
    return {
      completedRuns: 0,
      aborted: false,
      strategy: "timeSlice",
      snapshot: null,
    };
  }
  while (aggregate.totalRuns < totalRuns) {
    if (hasAbortBeenRequested(signal, shouldAbort)) {
      onProgress(aggregate.totalRuns, totalRuns);
      return {
        completedRuns: aggregate.totalRuns,
        aborted: true,
        strategy: "timeSlice",
        snapshot: finalizeResultAggregate(aggregate, observerSession),
      };
    }
    const sliceStartedAt = performance.now();
    while (
      aggregate.totalRuns < totalRuns &&
      performance.now() - sliceStartedAt < RUNNER_TIME_SLICE_MS
    ) {
      if (hasAbortBeenRequested(signal, shouldAbort)) {
        onProgress(aggregate.totalRuns, totalRuns);
        return {
          completedRuns: aggregate.totalRuns,
          aborted: true,
          strategy: "timeSlice",
          snapshot: finalizeResultAggregate(aggregate, observerSession),
        };
      }
      const seed = (seedBase + aggregate.totalRuns) >>> 0;
      const outcome = simulateHeadlessScenario(
        scenario,
        boardEffectByCellIndex,
        { captureReplay: false, seed }
      );
      absorbHeadlessOutcomeIntoAggregate(aggregate, outcome);
      observeCompletedMatch(observerSession, outcome, () =>
        simulateHeadlessScenario(scenario, boardEffectByCellIndex, {
          captureReplay: true,
          seed,
        })
      );
    }
    onProgress(aggregate.totalRuns, totalRuns);
    if (aggregate.totalRuns < totalRuns) {
      await yieldToBrowser();
    }
  }
  return {
    completedRuns: aggregate.totalRuns,
    aborted: false,
    strategy: "timeSlice",
    snapshot: finalizeResultAggregate(aggregate, observerSession),
  };
}
