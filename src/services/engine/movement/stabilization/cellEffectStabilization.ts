import {
  CELL_EFFECT_IDS,
  CELL_EFFECT_LOG_KEY_BY_ID,
  resolveCellEffectIfPresent,
} from "@/services/cellEffects";
import { appendLog } from "@/services/engine/state/mutations";
import { applyDirectTopLandingHooks } from "@/services/engine/movement/diceAndLanding";
import { recordHeadlessCellEffectTrigger } from "@/services/engine/headless/telemetry";
import type { HeadlessRaceTelemetryCollector } from "@/services/engine/headless/telemetryTypes";
import { text } from "@/i18n";
import type { CellEffectAnalyticsKey } from "@/types/monteCarlo";
import type {
  DangoId,
  GameState,
  PlaybackSegment,
  TravelDirection,
} from "@/types/game";

export function resolveCellEffectStabilization(
  state: GameState,
  actingEntityId: DangoId,
  turnIndex: number,
  travelDirection: TravelDirection,
  boardEffectByCellIndex: Map<number, string | null>,
  finalCellIndex: number,
  finalStackBottomToTop: DangoId[],
  telemetry?: HeadlessRaceTelemetryCollector
): { state: GameState; segments: PlaybackSegment[] } | null {
  const stackBeforeCellEffect = [...finalStackBottomToTop];
  const cellEffectOutcome = resolveCellEffectIfPresent(
    state,
    boardEffectByCellIndex,
    {
      turnIndex,
      moverId: actingEntityId,
      destinationCellIndex: finalCellIndex,
      stackBottomToTop: finalStackBottomToTop,
      moverTravelDirection: travelDirection,
    }
  );
  if (!cellEffectOutcome) {
    return null;
  }
  let nextState = cellEffectOutcome.state;
  const segments: PlaybackSegment[] = [];
  if (telemetry) {
    recordHeadlessCellEffectTrigger(
      telemetry,
      actingEntityId,
      cellEffectOutcome.effectId as CellEffectAnalyticsKey
    );
  }
  const effectMessage =
    cellEffectOutcome.message ??
    text(CELL_EFFECT_LOG_KEY_BY_ID[cellEffectOutcome.effectId]);
  segments.push({
    kind: "cellEffect",
    actorId: actingEntityId,
    effectId: cellEffectOutcome.effectId,
    message: effectMessage,
  });
  nextState = appendLog(nextState, {
    kind: "cellEffect",
    message: effectMessage,
  });
  if (cellEffectOutcome.shift) {
    segments.push({
      kind: "slide",
      travelingIds: cellEffectOutcome.shift.travelingIds,
      direction: cellEffectOutcome.shift.direction,
      fromCell: cellEffectOutcome.shift.fromCell,
      toCell: cellEffectOutcome.shift.toCell,
    });
  }
  const reactiveCellIndex = cellEffectOutcome.shift?.toCell ?? finalCellIndex;
  const reactiveLandingOutcome = applyDirectTopLandingHooks(nextState, {
    turnIndex: nextState.turnIndex,
    cellIndex: reactiveCellIndex,
    previousStackBottomToTop:
      cellEffectOutcome.effectId === CELL_EFFECT_IDS.timeRift
        ? stackBeforeCellEffect
        : [...(state.cells.get(reactiveCellIndex) ?? [])],
    nextStackBottomToTop: [...(nextState.cells.get(reactiveCellIndex) ?? [])],
    landingCause:
      cellEffectOutcome.effectId === CELL_EFFECT_IDS.timeRift
        ? "shuffle"
        : "cellEffectSlide",
  });
  nextState = reactiveLandingOutcome.state;
  for (const narrative of reactiveLandingOutcome.skillNarratives) {
    nextState = appendLog(nextState, {
      kind: "skillTrigger",
      message: narrative,
    });
  }
  segments.push(...reactiveLandingOutcome.segments);
  return { state: nextState, segments };
}
