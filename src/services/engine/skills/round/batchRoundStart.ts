import { FINISH_LINE_CELL_INDEX } from "@/constants/board";
import { applySkillHookAtRoundStart } from "@/services/engine/skills/hooks/atRoundStart";
import { recordSkillTrigger } from "@/services/engine/state/mutations";
import { findCellIndexForEntity } from "@/services/stateCells";
import type { DangoId, GameState, PlaybackSegment } from "@/types/game";

export function applyRoundStartSkillHooks(
  state: GameState,
  orderedActorIds: DangoId[]
): {
  state: GameState;
  openingSegments: PlaybackSegment[];
} {
  let nextState = state;
  const openingSegments: PlaybackSegment[] = [];
  for (const actorId of orderedActorIds) {
    const roundStartOutcome = applySkillHookAtRoundStart(nextState, {
      actorId,
      cellIndex:
        findCellIndexForEntity(nextState.cells, actorId) ?? FINISH_LINE_CELL_INDEX,
      orderedActorIds,
    });
    nextState = roundStartOutcome.state;
    if (!roundStartOutcome.skillNarrative) {
      continue;
    }
    nextState = recordSkillTrigger(
      nextState,
      openingSegments,
      actorId,
      roundStartOutcome.skillNarrative,
      roundStartOutcome.skillBannerActionId
    );
  }
  return { state: nextState, openingSegments };
}
