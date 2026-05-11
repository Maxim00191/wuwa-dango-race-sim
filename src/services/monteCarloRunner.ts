import type { HeadlessSimulationOutcome } from "@/services/gameEngine";
import { simulateHeadlessFullGame } from "@/services/gameEngine";
import type { DangoId } from "@/types/game";

export type MonteCarloRunnerControls = {
  totalRuns: number;
  selectedBasicIds: DangoId[];
  boardEffectByCellIndex: Map<number, string | null>;
  onProgress: (completedGames: number, totalGames: number) => void;
  onOutcome: (outcome: HeadlessSimulationOutcome) => void;
  shouldAbort?: () => boolean;
};

const TIME_SLICE_MS = 14;

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

export async function runMonteCarloBatch(
  controls: MonteCarloRunnerControls
): Promise<void> {
  const {
    totalRuns,
    selectedBasicIds,
    boardEffectByCellIndex,
    onProgress,
    onOutcome,
    shouldAbort,
  } = controls;
  let completedGames = 0;
  while (completedGames < totalRuns) {
    if (shouldAbort?.()) {
      return;
    }
    const sliceStartedAt = performance.now();
    while (
      completedGames < totalRuns &&
      performance.now() - sliceStartedAt < TIME_SLICE_MS
    ) {
      if (shouldAbort?.()) {
        return;
      }
      const outcome = simulateHeadlessFullGame(
        selectedBasicIds,
        boardEffectByCellIndex
      );
      onOutcome(outcome);
      completedGames += 1;
    }
    onProgress(completedGames, totalRuns);
    await yieldToBrowser();
  }
}
