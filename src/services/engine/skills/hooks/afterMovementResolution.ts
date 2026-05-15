import { CHARACTER_BY_ID } from "@/services/characters";
import type { SkillBannerActionId } from "@/broadcast/skillBannerLexicon";
import type { LocalizedText } from "@/i18n";
import type { GameState, PlaybackSegment, PostMovementHookContext } from "@/types/game";

export function applySkillHookAfterMovementResolution(
  state: GameState,
  context: PostMovementHookContext
): {
  state: GameState;
  segments: PlaybackSegment[];
  skillNarrative?: LocalizedText;
  skillBannerActionId?: SkillBannerActionId;
} {
  const character = CHARACTER_BY_ID[context.rollerId];
  if (!character?.skillHooks.afterMovementResolution) {
    return { state, segments: [] };
  }
  const resolution = character.skillHooks.afterMovementResolution(state, context);
  return {
    state: resolution.state,
    segments: resolution.segments ?? [],
    skillNarrative: resolution.skillNarrative,
    skillBannerActionId: resolution.skillBannerActionId,
  };
}
