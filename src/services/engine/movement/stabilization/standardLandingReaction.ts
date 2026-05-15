import { applyDirectTopLandingHooks } from "@/services/engine/movement/diceAndLanding";
import type { DangoId, GameState, PlaybackSegment } from "@/types/game";

export function resolveStandardLandingReaction(
  state: GameState,
  landingCellIndex: number,
  previousStackBottomToTop: DangoId[]
): { state: GameState; segments: PlaybackSegment[] } {
  const nextStackBottomToTop = [...(state.cells.get(landingCellIndex) ?? [])];
  const landingReactionOutcome = applyDirectTopLandingHooks(state, {
    turnIndex: state.turnIndex,
    cellIndex: landingCellIndex,
    previousStackBottomToTop,
    nextStackBottomToTop,
    landingCause: "standardMove",
  });
  return {
    state: landingReactionOutcome.state,
    segments: [...landingReactionOutcome.segments],
  };
}
