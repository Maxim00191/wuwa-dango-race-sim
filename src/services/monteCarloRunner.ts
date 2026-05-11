import type {
  HeadlessSimulationOutcome,
  HeadlessSimulationScenario,
} from "@/services/gameEngine";
import { simulateHeadlessScenario } from "@/services/gameEngine";

export type MonteCarloRunnerControls = {
  totalRuns: number;
  scenario: HeadlessSimulationScenario;
  boardEffectByCellIndex: Map<number, string | null>;
  onProgress: (completedGames: number, totalGames: number) => void;
  onOutcome: (outcome: HeadlessSimulationOutcome) => void;
  signal?: AbortSignal;
  shouldAbort?: () => boolean;
};

export type MonteCarloBatchResult = {
  completedRuns: number;
  aborted: boolean;
};

const TIME_SLICE_MS = 14;

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => resolve());
      return;
    }
    window.setTimeout(resolve, 0);
  });
}

function hasAbortBeenRequested(
  signal: AbortSignal | undefined,
  shouldAbort: (() => boolean) | undefined
): boolean {
  return Boolean(signal?.aborted || shouldAbort?.());
}

export async function runMonteCarloBatch(
  controls: MonteCarloRunnerControls
): Promise<MonteCarloBatchResult> {
  const {
    totalRuns,
    scenario,
    boardEffectByCellIndex,
    onProgress,
    onOutcome,
    signal,
    shouldAbort,
  } = controls;
  let completedGames = 0;
  if (totalRuns <= 0) {
    return { completedRuns: 0, aborted: false };
  }
  while (completedGames < totalRuns) {
    if (hasAbortBeenRequested(signal, shouldAbort)) {
      onProgress(completedGames, totalRuns);
      return { completedRuns: completedGames, aborted: true };
    }
    const sliceStartedAt = performance.now();
    while (
      completedGames < totalRuns &&
      performance.now() - sliceStartedAt < TIME_SLICE_MS
    ) {
      if (hasAbortBeenRequested(signal, shouldAbort)) {
        onProgress(completedGames, totalRuns);
        return { completedRuns: completedGames, aborted: true };
      }
      const outcome = simulateHeadlessScenario(
        scenario,
        boardEffectByCellIndex
      );
      onOutcome(outcome);
      completedGames += 1;
    }
    onProgress(completedGames, totalRuns);
    if (completedGames < totalRuns) {
      await yieldToBrowser();
    }
  }
  return { completedRuns: completedGames, aborted: false };
}
