import { CHARACTER_BY_ID } from "@/services/characters";
import type { SkillBannerActionId } from "@/broadcast/skillBannerLexicon";
import type { LocalizedText } from "@/i18n";
import type { GameState, PlaybackSegment, SkillHookContext } from "@/types/game";

export function applySkillHookAfterDice(
  state: GameState,
  context: SkillHookContext
): {
  state: GameState;
  segments: PlaybackSegment[];
  skillNarrative?: LocalizedText;
  skillBannerActionId?: SkillBannerActionId;
} {
  const character = CHARACTER_BY_ID[context.rollerId];
  if (!character?.skillHooks.afterDiceRoll) {
    return { state, segments: [] };
  }
  const resolution = character.skillHooks.afterDiceRoll(state, context);
  return {
    state: resolution.state,
    segments: resolution.segments ?? [],
    skillNarrative: resolution.skillNarrative,
    skillBannerActionId: resolution.skillBannerActionId,
  };
}
