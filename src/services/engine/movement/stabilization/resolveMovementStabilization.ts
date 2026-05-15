import { findCellIndexForEntity } from "@/services/stateCells";
import { resolveCellEffectStabilization } from "@/services/engine/movement/stabilization/cellEffectStabilization";
import { resolveStandardLandingReaction } from "@/services/engine/movement/stabilization/standardLandingReaction";
import { resolveZeroStepLandingReaction } from "@/services/engine/movement/stabilization/zeroStepLandingReaction";
import type { HeadlessRaceTelemetryCollector } from "@/services/engine/headless/telemetryTypes";
import type {
  DangoId,
  GameState,
  PlaybackSegment,
  TravelDirection,
} from "@/types/game";

export function resolveMovementStabilization(
  state: GameState,
  actingEntityId: DangoId,
  turnIndex: number,
  diceValue: number,
  travelDirection: TravelDirection,
  boardEffectByCellIndex: Map<number, string | null>,
  finalLandingCellIndex: number | null,
  finalLandingPreviousStackBottomToTop: DangoId[],
  telemetry?: HeadlessRaceTelemetryCollector
): { state: GameState; segments: PlaybackSegment[] } {
  if (diceValue <= 0) {
    return resolveZeroStepLandingReaction(
      state,
      actingEntityId,
      finalLandingCellIndex,
      finalLandingPreviousStackBottomToTop
    );
  }
  const finalCellIndex = findCellIndexForEntity(state.cells, actingEntityId);
  if (finalCellIndex === null) {
    return { state, segments: [] };
  }
  const finalStackBottomToTop = state.cells.get(finalCellIndex) ?? [];
  const cellEffectOutcome = resolveCellEffectStabilization(
    state,
    actingEntityId,
    turnIndex,
    travelDirection,
    boardEffectByCellIndex,
    finalCellIndex,
    finalStackBottomToTop,
    telemetry
  );
  if (cellEffectOutcome) {
    return cellEffectOutcome;
  }
  if (finalLandingCellIndex === null) {
    return { state, segments: [] };
  }
  return resolveStandardLandingReaction(
    state,
    finalLandingCellIndex,
    finalLandingPreviousStackBottomToTop
  );
}
