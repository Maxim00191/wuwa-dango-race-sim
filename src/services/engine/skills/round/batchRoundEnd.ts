import { FINISH_LINE_CELL_INDEX } from "@/constants/board";
import { applySkillHookAtRoundEnd } from "@/services/engine/skills/hooks/atRoundEnd";
import { recordSkillTrigger } from "@/services/engine/state/mutations";
import { findCellIndexForEntity } from "@/services/stateCells";
import type { DangoId, GameState, PlaybackSegment } from "@/types/game";

export function applyRoundEndSkillHooks(
  state: GameState,
  orderedActorIds: DangoId[]
): {
  state: GameState;
  closingSegments: PlaybackSegment[];
} {
  let nextState = state;
  const closingSegments: PlaybackSegment[] = [];
  for (const actorId of orderedActorIds) {
    const roundEndOutcome = applySkillHookAtRoundEnd(nextState, {
      actorId,
      cellIndex:
        findCellIndexForEntity(nextState.cells, actorId) ?? FINISH_LINE_CELL_INDEX,
      orderedActorIds,
    });
    nextState = roundEndOutcome.state;
    if (!roundEndOutcome.skillNarrative) {
      continue;
    }
    nextState = recordSkillTrigger(
      nextState,
      closingSegments,
      actorId,
      roundEndOutcome.skillNarrative,
      roundEndOutcome.skillBannerActionId
    );
  }
  return { state: nextState, closingSegments };
}
