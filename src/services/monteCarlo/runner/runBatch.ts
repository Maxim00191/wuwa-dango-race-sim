import { MonteCarloCancelledError, hasAbortBeenRequested } from "@/services/monteCarlo/runner/abort";
import { runMonteCarloTimeSliced } from "@/services/monteCarlo/runner/timeSlice";
import type {
  MonteCarloBatchResult,
  MonteCarloRunnerControls,
} from "@/services/monteCarlo/runner/types";
import { runMonteCarloInWorkers } from "@/services/monteCarlo/runner/workerOrchestrator";
import { canUseWorkers } from "@/services/monteCarlo/runner/workerSizing";

function withWallClock(
  batchStartedAt: number,
  result: MonteCarloBatchResult
): MonteCarloBatchResult {
  if (!result.snapshot) {
    return result;
  }
  return {
    ...result,
    snapshot: {
      ...result.snapshot,
      totalRuntimeMs: performance.now() - batchStartedAt,
    },
  };
}

export async function runMonteCarloBatch(
  controls: MonteCarloRunnerControls
): Promise<MonteCarloBatchResult> {
  const batchStartedAt = performance.now();
  if (controls.totalRuns <= 0) {
    return {
      completedRuns: 0,
      aborted: false,
      strategy: "timeSlice",
      snapshot: null,
    };
  }
  if (canUseWorkers()) {
    try {
      return withWallClock(
        batchStartedAt,
        await runMonteCarloInWorkers(controls)
      );
    } catch (error) {
      if (
        error instanceof MonteCarloCancelledError ||
        hasAbortBeenRequested(controls.signal, controls.shouldAbort)
      ) {
        return {
          completedRuns: 0,
          aborted: true,
          strategy: "worker",
          snapshot: null,
        };
      }
    }
  }
  return withWallClock(
    batchStartedAt,
    await runMonteCarloTimeSliced(controls)
  );
}
