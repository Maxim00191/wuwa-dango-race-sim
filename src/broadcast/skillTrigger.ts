import type { SkillBannerActionId } from "@/broadcast/skillBannerLexicon";
import type { LocalizedText } from "@/i18n/types";

export type SkillTriggerPayload = {
  skillNarrative: LocalizedText;
  skillBannerActionId: SkillBannerActionId;
};

export function skillTrigger(
  skillBannerActionId: SkillBannerActionId,
  skillNarrative: LocalizedText
): SkillTriggerPayload {
  return { skillBannerActionId, skillNarrative };
}
