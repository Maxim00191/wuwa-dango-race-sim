import {
  absorbMonteCarloAggregateIntoAggregate,
} from "@/services/monteCarlo/aggregate";
import {
  absorbObserverRecordsIntoSession,
  createObserverSession,
} from "@/services/observerSession";
import { serializeBoardEffects } from "@/services/monteCarlo/runner/boardEffects";
import {
  MonteCarloCancelledError,
  hasAbortBeenRequested,
} from "@/services/monteCarlo/runner/abort";
import {
  allocateWorkerRequestId,
  createWorkerChunkRegistry,
  decodeWorkerCompletePayload,
  runWorkerChunk,
} from "@/services/monteCarlo/runner/chunkRunner";
import {
  createResultAggregate,
  finalizeResultAggregate,
} from "@/services/monteCarlo/runner/finalizeResult";
import { createSeedBase } from "@/services/monteCarlo/runner/seed";
import type {
  MonteCarloBatchResult,
  MonteCarloRunnerControls,
} from "@/services/monteCarlo/runner/types";
import {
  createMonteCarloWorker,
  getDispatchChunkSize,
  getWorkerCount,
  getWorkerProgressStride,
} from "@/services/monteCarlo/runner/workerSizing";

export async function runMonteCarloInWorkers(
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
  const extremePerformance = Boolean(controls.extremePerformance);
  const workerCount = getWorkerCount(totalRuns, extremePerformance);
  const chunkSize = getDispatchChunkSize(totalRuns, workerCount, extremePerformance);
  const workers = Array.from({ length: workerCount }, createMonteCarloWorker);
  const chunkRegistry = createWorkerChunkRegistry();
  const boardEffects = serializeBoardEffects(boardEffectByCellIndex);
  const workerCompletedRuns = Array.from({ length: workerCount }, () => 0);
  const seedBase = createSeedBase();
  let nextStart = 0;
  let aborted = false;
  let inFlightCompletedRuns = 0;
  let workersTerminated = false;

  const disposeWorkers = () => {
    if (workersTerminated) {
      return;
    }
    workersTerminated = true;
    for (const worker of workers) {
      worker.terminate();
    }
    workers.length = 0;
  };

  const hardTerminateWorkers = () => {
    aborted = true;
    chunkRegistry.rejectAll();
    disposeWorkers();
  };

  const onAbortRequested = () => {
    hardTerminateWorkers();
  };

  if (hasAbortBeenRequested(signal, shouldAbort)) {
    hardTerminateWorkers();
  } else {
    signal?.addEventListener("abort", onAbortRequested, { once: true });
  }

  const reportProgress = () => {
    onProgress(aggregate.totalRuns + inFlightCompletedRuns, totalRuns);
  };

  const takeChunk = () => {
    if (nextStart >= totalRuns) {
      return null;
    }
    const start = nextStart;
    const remainingRuns = totalRuns - nextStart;
    const runs = Math.min(chunkSize, remainingRuns);
    nextStart += runs;
    return { start, runs };
  };

  try {
    await Promise.all(
      workers.map(async (worker, workerIndex) => {
        while (!aborted && !hasAbortBeenRequested(signal, shouldAbort)) {
          const chunk = takeChunk();
          if (!chunk) {
            return;
          }
          const { start, runs } = chunk;
          workerCompletedRuns[workerIndex] = 0;
          const requestId = allocateWorkerRequestId();
          try {
            const completeMessage = await runWorkerChunk(
              worker,
              {
                type: "run",
                requestId,
                totalRuns: runs,
                seedBase: (seedBase + start) >>> 0,
                progressReportInterval: getWorkerProgressStride(
                  runs,
                  extremePerformance
                ),
                scenario,
                selectedBasicIds: controls.selectedBasicIds,
                scenarioKind: controls.scenarioKind,
                scenarioLabel: controls.scenarioLabel,
                boardEffects,
              },
              (message) => {
                inFlightCompletedRuns +=
                  message.completedRuns - workerCompletedRuns[workerIndex];
                workerCompletedRuns[workerIndex] = message.completedRuns;
                reportProgress();
              },
              chunkRegistry
            );
            inFlightCompletedRuns -= workerCompletedRuns[workerIndex];
            workerCompletedRuns[workerIndex] = 0;
            const payload = decodeWorkerCompletePayload(completeMessage);
            absorbMonteCarloAggregateIntoAggregate(
              aggregate,
              payload.aggregate
            );
            absorbObserverRecordsIntoSession(
              observerSession,
              payload.observerRecords
            );
            reportProgress();
          } catch (error) {
            inFlightCompletedRuns -= workerCompletedRuns[workerIndex];
            workerCompletedRuns[workerIndex] = 0;
            if (
              error instanceof MonteCarloCancelledError ||
              hasAbortBeenRequested(signal, shouldAbort)
            ) {
              return;
            }
            throw error;
          }
        }
      })
    );
    if (!aborted) {
      aborted = hasAbortBeenRequested(signal, shouldAbort);
    }
  } catch (error) {
    if (
      error instanceof MonteCarloCancelledError ||
      hasAbortBeenRequested(signal, shouldAbort)
    ) {
      aborted = true;
    } else {
      throw error;
    }
  } finally {
    signal?.removeEventListener("abort", onAbortRequested);
    disposeWorkers();
    inFlightCompletedRuns = 0;
    reportProgress();
  }

  return {
    completedRuns: aggregate.totalRuns,
    aborted,
    strategy: "worker",
    snapshot: finalizeResultAggregate(aggregate, observerSession),
  };
}
