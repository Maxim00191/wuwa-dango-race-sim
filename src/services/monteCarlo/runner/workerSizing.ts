import {
  RUNNER_CONSERVATIVE_CHUNKS_PER_THREAD,
  RUNNER_CONSERVATIVE_MAX_DISPATCH_CHUNK,
  RUNNER_CONSERVATIVE_PROGRESS_STRIDE,
  RUNNER_EXTREME_MAX_WORKER_PROGRESS_STRIDE,
  RUNNER_EXTREME_MIN_DISPATCH_CHUNK,
  RUNNER_EXTREME_MIN_WORKER_PROGRESS_STRIDE,
} from "@/services/monteCarlo/config/runnerTiming";

export function readHardwareConcurrency(): number {
  const hardwareConcurrency =
    typeof navigator === "undefined" ? 1 : navigator.hardwareConcurrency;
  if (!Number.isFinite(hardwareConcurrency) || hardwareConcurrency < 1) {
    return 1;
  }
  return Math.floor(hardwareConcurrency);
}

export function getWorkerCount(
  totalRuns: number,
  extremePerformance: boolean
): number {
  const hc = readHardwareConcurrency();
  const pool = extremePerformance
    ? Math.max(1, hc - 1)
    : Math.max(1, Math.floor(hc / 2));
  return Math.max(1, Math.min(totalRuns, pool));
}

export function getDispatchChunkSize(
  totalRuns: number,
  workerCount: number,
  extremePerformance: boolean
): number {
  if (workerCount < 1) {
    return Math.max(1, totalRuns);
  }
  if (extremePerformance) {
    return Math.min(
      totalRuns,
      Math.max(
        RUNNER_EXTREME_MIN_DISPATCH_CHUNK,
        Math.ceil(totalRuns / workerCount)
      )
    );
  }
  return Math.max(
    1,
    Math.min(
      RUNNER_CONSERVATIVE_MAX_DISPATCH_CHUNK,
      Math.ceil(totalRuns / (workerCount * RUNNER_CONSERVATIVE_CHUNKS_PER_THREAD))
    )
  );
}

export function getWorkerProgressStride(
  dispatchChunkRuns: number,
  extremePerformance: boolean
): number {
  if (!extremePerformance) {
    return RUNNER_CONSERVATIVE_PROGRESS_STRIDE;
  }
  return Math.max(
    RUNNER_EXTREME_MIN_WORKER_PROGRESS_STRIDE,
    Math.min(
      RUNNER_EXTREME_MAX_WORKER_PROGRESS_STRIDE,
      Math.ceil(dispatchChunkRuns / 2)
    )
  );
}

export function canUseWorkers(): boolean {
  return typeof Worker !== "undefined" && typeof URL !== "undefined";
}

export function createMonteCarloWorker(): Worker {
  return new Worker(new URL("../worker.ts", import.meta.url), {
    type: "module",
  });
}
