import { CHARACTER_BY_ID } from "@/services/characters";
import type { SkillBannerActionId } from "@/broadcast/skillBannerLexicon";
import type { LocalizedText } from "@/i18n";
import type { DangoId, GameState, TurnRollPlan } from "@/types/game";

export function applySkillHookAfterTurnRolls(
  state: GameState,
  context: {
    actorId: DangoId;
    rankedBasicIds: DangoId[];
    plansByActorId: Record<DangoId, TurnRollPlan | undefined>;
    allInitialRollsById: Record<DangoId, number | undefined>;
    allResolvedRollsById: Record<DangoId, number | undefined>;
  }
): {
  state: GameState;
  planPatches?: Partial<Record<DangoId, Partial<TurnRollPlan>>>;
  skillNarrative?: LocalizedText;
  skillBannerActionId?: SkillBannerActionId;
} {
  const character = CHARACTER_BY_ID[context.actorId];
  if (!character?.skillHooks.afterTurnRolls) {
    return { state };
  }
  const resolution = character.skillHooks.afterTurnRolls(state, {
    turnIndex: state.turnIndex,
    actorId: context.actorId,
    rankedBasicIds: context.rankedBasicIds,
    plansByActorId: context.plansByActorId,
    allInitialRollsById: context.allInitialRollsById,
    allResolvedRollsById: context.allResolvedRollsById,
  });
  return {
    state: resolution.state,
    planPatches: resolution.planPatches,
    skillNarrative: resolution.skillNarrative,
    skillBannerActionId: resolution.skillBannerActionId,
  };
}
