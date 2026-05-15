import { createNormalRaceSetup } from "@/services/raceSetup";
import { withSeededRandom } from "@/services/engine/core/random";
import { simulateHeadlessScenarioInternal } from "@/services/engine/headless/simulateRace";
import type {
  HeadlessSimulationScenario,
  HeadlessSimulationOptions,
} from "@/services/engine/headless/scenarioTypes";
import type { DangoId } from "@/types/game";
import type { HeadlessSimulationOutcome } from "@/types/monteCarlo";

export function simulateHeadlessScenario(
  scenario: HeadlessSimulationScenario,
  boardEffectByCellIndex: Map<number, string | null>,
  options: HeadlessSimulationOptions = {}
): HeadlessSimulationOutcome {
  const captureReplay = options.captureReplay ?? true;
  if (options.seed !== undefined) {
    return withSeededRandom(options.seed, () =>
      simulateHeadlessScenarioInternal(
        scenario,
        boardEffectByCellIndex,
        captureReplay
      )
    );
  }
  return simulateHeadlessScenarioInternal(
    scenario,
    boardEffectByCellIndex,
    captureReplay
  );
}

export function simulateHeadlessFullGame(
  selectedBasicIds: DangoId[],
  boardEffectByCellIndex: Map<number, string | null>
): HeadlessSimulationOutcome {
  return simulateHeadlessScenario(
    {
      kind: "singleRace",
      setup: createNormalRaceSetup(selectedBasicIds),
    },
    boardEffectByCellIndex
  );
}
