import { CHARACTER_BY_ID } from "@/services/characters";
import type { SkillBannerActionId } from "@/broadcast/skillBannerLexicon";
import type { LocalizedText } from "@/i18n";
import type { DangoId, GameState } from "@/types/game";

export function applySkillHookAtRoundEnd(
  state: GameState,
  context: {
    actorId: DangoId;
    cellIndex: number;
    orderedActorIds: DangoId[];
  }
): {
  state: GameState;
  skillNarrative?: LocalizedText;
  skillBannerActionId?: SkillBannerActionId;
} {
  const character = CHARACTER_BY_ID[context.actorId];
  if (!character?.skillHooks.atRoundEnd) {
    return { state };
  }
  return character.skillHooks.atRoundEnd(state, {
    turnIndex: state.turnIndex,
    actorId: context.actorId,
    cellIndex: context.cellIndex,
    orderedActorIds: context.orderedActorIds,
  });
}
