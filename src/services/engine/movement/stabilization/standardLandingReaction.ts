import { appendLog } from "@/services/engine/state/mutations";
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
