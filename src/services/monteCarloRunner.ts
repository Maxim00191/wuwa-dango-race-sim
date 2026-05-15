import type {
  HeadlessSimulationScenario,
} from "@/services/gameEngine";
import { simulateHeadlessScenario } from "@/services/gameEngine";
import {
  absorbHeadlessOutcomeIntoAggregate,
  absorbMonteCarloAggregateIntoAggregate,
  createEmptyMonteCarloAggregate,
  finalizeMonteCarloAggregate,
} from "@/services/monteCarloAggregate";
import {
  absorbObserverRecordsIntoSession,
  createObserverSession,
  finalizeObserverRecords,
  observeCompletedMatch,
} from "@/services/observerSession";
import type { LocalizedText } from "@/i18n";
import type { DangoId } from "@/types/game";
import type {
  MonteCarloAggregateSnapshot,
  MonteCarloScenarioKind,
} from "@/types/monteCarlo";
import type {
  MonteCarloWorkerCompleteMessage,
  MonteCarloWorkerCompletePayload,
  MonteCarloWorkerErrorMessage,
  MonteCarloWorkerMessage,
  MonteCarloWorkerProgressMessage,
  MonteCarloWorkerRequest,
  SerializedBoardEffects,
} from "@/services/monteCarloWorkerTypes";

export type MonteCarloRunnerControls = {
  totalRuns: number;
  scenario: HeadlessSimulationScenario;
  selectedBasicIds: DangoId[];
  scenarioKind: MonteCarloScenarioKind;
  scenarioLabel: LocalizedText;
  boardEffectByCellIndex: Map<number, string | null>;
  onProgress: (completedGames: number, totalGames: number) => void;
  signal?: AbortSignal;
  shouldAbort?: () => boolean;
  extremePerformance?: boolean;
};

export type MonteCarloExecutionStrategy = "worker" | "timeSlice";

export type MonteCarloBatchResult = {
  completedRuns: number;
  aborted: boolean;
  strategy: MonteCarloExecutionStrategy;
  snapshot: MonteCarloAggregateSnapshot | null;
};

const TIME_SLICE_MS = 14;
const CONSERVATIVE_CHUNKS_PER_THREAD = 6;
const CONSERVATIVE_MAX_DISPATCH_CHUNK = 250;
const EXTREME_MIN_DISPATCH_CHUNK = 5000;
const EXTREME_MIN_WORKER_PROGRESS_STRIDE = 5000;
let workerRequestId = 0;

class MonteCarloCancelledError extends Error {
  constructor() {
    super("Monte Carlo run cancelled");
    this.name = "MonteCarloCancelledError";
  }
}

type WorkerChunkRegistry = {
  register: (reject: (reason?: unknown) => void) => void;
  unregister: (reject: (reason?: unknown) => void) => void;
  rejectAll: () => void;
};

function createSeedBase(): number {
  return Math.floor(Math.random() * 0x100000000) >>> 0;
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    if (
      typeof window !== "undefined" &&
      typeof window.requestAnimationFrame === "function"
    ) {
      window.requestAnimationFrame(() => resolve());
      return;
    }
    globalThis.setTimeout(resolve, 0);
  });
}

function hasAbortBeenRequested(
  signal: AbortSignal | undefined,
  shouldAbort: (() => boolean) | undefined
): boolean {
  return Boolean(signal?.aborted || shouldAbort?.());
}

function serializeBoardEffects(
  boardEffectByCellIndex: Map<number, string | null>
): SerializedBoardEffects {
  return Array.from(boardEffectByCellIndex.entries());
}

function createResultAggregate(
  controls: MonteCarloRunnerControls
): MonteCarloAggregateSnapshot {
  return createEmptyMonteCarloAggregate(
    controls.selectedBasicIds,
    controls.scenarioKind,
    controls.scenarioLabel
  );
}

function finalizeResultAggregate(
  aggregate: MonteCarloAggregateSnapshot,
  observerSession: ReturnType<typeof createObserverSession>
): MonteCarloAggregateSnapshot | null {
  if (aggregate.totalRuns === 0) {
    return null;
  }
  return {
    ...finalizeMonteCarloAggregate(aggregate),
    observerRecords: finalizeObserverRecords(observerSession),
  };
}

function readHardwareConcurrency(): number {
  const hardwareConcurrency =
    typeof navigator === "undefined" ? 1 : navigator.hardwareConcurrency;
  if (!Number.isFinite(hardwareConcurrency) || hardwareConcurrency < 1) {
    return 1;
  }
  return Math.floor(hardwareConcurrency);
}

function getWorkerCount(totalRuns: number, extremePerformance: boolean): number {
  const hc = readHardwareConcurrency();
  const pool = extremePerformance
    ? Math.max(1, hc - 1)
    : Math.max(1, Math.floor(hc / 2));
  return Math.max(1, Math.min(totalRuns, pool));
}

function getDispatchChunkSize(
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
        EXTREME_MIN_DISPATCH_CHUNK,
        Math.ceil(totalRuns / workerCount)
      )
    );
  }
  return Math.max(
    1,
    Math.min(
      CONSERVATIVE_MAX_DISPATCH_CHUNK,
      Math.ceil(totalRuns / (workerCount * CONSERVATIVE_CHUNKS_PER_THREAD))
    )
  );
}

function getWorkerProgressStride(
  dispatchChunkRuns: number,
  extremePerformance: boolean
): number {
  if (!extremePerformance) {
    return 100;
  }
  return Math.max(
    EXTREME_MIN_WORKER_PROGRESS_STRIDE,
    Math.min(20_000, Math.ceil(dispatchChunkRuns / 2))
  );
}

function canUseWorkers(): boolean {
  return typeof Worker !== "undefined" && typeof URL !== "undefined";
}

function createMonteCarloWorker(): Worker {
  return new Worker(new URL("./monteCarloWorker.ts", import.meta.url), {
    type: "module",
  });
}

function decodeWorkerCompletePayload(
  message: MonteCarloWorkerCompleteMessage
): MonteCarloWorkerCompletePayload {
  return JSON.parse(new TextDecoder().decode(message.payload)) as MonteCarloWorkerCompletePayload;
}

function createWorkerChunkRegistry(): WorkerChunkRegistry {
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

function runWorkerChunk(
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

async function runMonteCarloInWorkers(
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
    onProgress(
      aggregate.totalRuns + inFlightCompletedRuns,
      totalRuns
    );
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
          const requestId = (workerRequestId += 1);
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

async function runMonteCarloTimeSliced(
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
      performance.now() - sliceStartedAt < TIME_SLICE_MS
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

export async function runMonteCarloBatch(
  controls: MonteCarloRunnerControls
): Promise<MonteCarloBatchResult> {
  const batchStartedAt = performance.now();
  const withWallClock = (result: MonteCarloBatchResult): MonteCarloBatchResult => {
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
  };
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
      return withWallClock(await runMonteCarloInWorkers(controls));
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
  return withWallClock(await runMonteCarloTimeSliced(controls));
}
