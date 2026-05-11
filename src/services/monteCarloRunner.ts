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
    scenario,
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
      const outcome = simulateHeadlessScenario(
        scenario,
        boardEffectByCellIndex
      );
      onOutcome(outcome);
      completedGames += 1;
    }
    onProgress(completedGames, totalRuns);
    await yieldToBrowser();
  }
}
