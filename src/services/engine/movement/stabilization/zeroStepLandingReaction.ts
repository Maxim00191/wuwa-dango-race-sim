import { appendLog } from "@/services/engine/state/mutations";
import { applyDirectTopLandingHooks } from "@/services/engine/movement/diceAndLanding";
import { findCellIndexForEntity } from "@/services/stateCells";
import type { DangoId, GameState, PlaybackSegment } from "@/types/game";

export function resolveZeroStepLandingReaction(
  state: GameState,
  actingEntityId: DangoId,
  finalLandingCellIndex: number | null,
  finalLandingPreviousStackBottomToTop: DangoId[]
): { state: GameState; segments: PlaybackSegment[] } {
  const effectiveCellIndex =
    finalLandingCellIndex ?? findCellIndexForEntity(state.cells, actingEntityId);
  if (effectiveCellIndex === null) {
    return { state, segments: [] };
  }
  const previousStackBottomToTop = [...finalLandingPreviousStackBottomToTop];
  const nextStackBottomToTop = [...(state.cells.get(effectiveCellIndex) ?? [])];
  const landingReactionOutcome = applyDirectTopLandingHooks(state, {
    turnIndex: state.turnIndex,
    cellIndex: effectiveCellIndex,
    previousStackBottomToTop,
    nextStackBottomToTop,
    landingCause: "standardMove",
  });
  let nextState = landingReactionOutcome.state;
  for (const narrative of landingReactionOutcome.skillNarratives) {
    nextState = appendLog(nextState, {
      kind: "skillTrigger",
      message: narrative,
    });
  }
  return {
    state: nextState,
    segments: [...landingReactionOutcome.segments],
  };
}
