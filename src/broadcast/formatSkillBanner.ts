import type { BroadcastBannerPayload } from "@/components/BroadcastBanner";
import {
  inferSkillBannerActionId,
  resolveSkillBannerActionId,
  resolveSkillBannerDetailKey,
  resolveSkillNameKey,
  type SkillBannerActionId,
} from "@/broadcast/skillBannerLexicon";
import { characterParam, lexiconParam, text } from "@/i18n";
import type { LocalizedText, TranslationParams } from "@/i18n/types";
import type { DangoId, PlaybackSkillSegment } from "@/types/game";

export function formatSkillBannerPayload(
  actorId: DangoId,
  actionId: SkillBannerActionId,
  detailParams?: TranslationParams
): Pick<BroadcastBannerPayload, "headline" | "detail" | "variant"> {
  const skillNameKey = resolveSkillNameKey(actorId, actionId);
  return {
    variant: "skill",
    headline: text("banner.skill.headline", {
      actor: characterParam(actorId),
      skill: lexiconParam(skillNameKey),
    }),
    detail: text(resolveSkillBannerDetailKey(actionId), detailParams),
  };
}

export function skillBannerFromPlaybackSegment(
  segment: PlaybackSkillSegment
): Pick<BroadcastBannerPayload, "headline" | "detail" | "variant"> {
  const actionId = resolveSkillBannerActionId(
    segment.actorId,
    segment.message,
    segment.skillBannerActionId
  );
  return formatSkillBannerPayload(
    segment.actorId,
    actionId,
    segment.message?.params
  );
}

export function buildSkillPlaybackSegment(
  actorId: DangoId,
  skillBannerActionId: SkillBannerActionId | undefined,
  message?: LocalizedText
): PlaybackSkillSegment {
  return {
    kind: "skill",
    actorId,
    skillBannerActionId:
      skillBannerActionId ??
      (message ? inferSkillBannerActionId(message) : undefined),
    message,
  };
}
