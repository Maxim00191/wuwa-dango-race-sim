import { deriveBasicPlacementsFromRace } from "@/services/raceSetup";
import type { HeadlessRaceTelemetryCollector } from "@/services/engine/headless/telemetryTypes";
import { buildPlacementIndexByBasicId } from "@/services/engine/headless/telemetry";
import type { GameState } from "@/types/game";
import type { HeadlessRaceDeepMetrics } from "@/types/monteCarlo";
import type { MatchRecord } from "@/types/replay";
import type { RaceSetup } from "@/types/game";

export type HeadlessRaceResult = {
  state: GameState;
  metrics: HeadlessRaceDeepMetrics;
  record: MatchRecord | null;
};

export function buildHeadlessRaceMetrics(
  setup: RaceSetup,
  state: GameState,
  telemetry: HeadlessRaceTelemetryCollector
): HeadlessRaceDeepMetrics {
  const startingDisplacements = setup.selectedBasicIds.map(
    (basicId) => setup.startingDisplacementById[basicId] ?? 0
  );
  const maxProgressDebt = Math.min(0, ...startingDisplacements);
  return {
    mode: setup.mode,
    winnerBasicId: state.winnerId,
    turnsAtFinish: state.turnIndex,
    finalPlacements: deriveBasicPlacementsFromRace(state),
    startingPlacementByBasicId: buildPlacementIndexByBasicId(
      setup.selectedBasicIds
    ),
    startedWithMaxProgressDebtBasicIds:
      maxProgressDebt < 0
        ? setup.selectedBasicIds.filter(
            (basicId) =>
              (setup.startingDisplacementById[basicId] ?? 0) === maxProgressDebt
          )
        : [],
    basicMetricsById: telemetry.basicMetricsById,
  };
}
