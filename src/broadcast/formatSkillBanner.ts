import type { BroadcastBannerPayload } from "@/components/BroadcastBanner";
import {
  inferSkillBannerActionId,
  resolveSkillBannerActionId,
  resolveSkillBannerDetailKey,
  resolveSkillNameKey,
  type SkillBannerActionId,
} from "@/broadcast/skillBannerLexicon";
import { characterParam, lexiconParam, text } from "@/i18n";
import type {
  CharacterParam,
  LocalizedText,
  LocalizedParam,
  TranslationParams,
} from "@/i18n/types";
import type { DangoId, PlaybackSkillSegment } from "@/types/game";

const MARKED_DANGO_PARAM_KEYS: Partial<
  Record<SkillBannerActionId, readonly string[]>
> = {
  "sigrika.markSingle": ["target"],
  "sigrika.markDouble": ["firstTarget", "secondTarget"],
};

function isCharacterParam(param: LocalizedParam | undefined): param is CharacterParam {
  return (
    param !== undefined &&
    typeof param === "object" &&
    (param as CharacterParam).type === "character"
  );
}

function markedDangoIdsForSkillBanner(
  actionId: SkillBannerActionId,
  narrativeParams?: TranslationParams
): readonly DangoId[] {
  const paramKeys = MARKED_DANGO_PARAM_KEYS[actionId];
  if (!paramKeys || !narrativeParams) {
    return [];
  }
  return paramKeys
    .map((key) => narrativeParams[key])
    .filter(isCharacterParam)
    .map((param) => param.id as DangoId);
}

function bannerDetailParamsFromMarkedDango(
  markedDangoIds: readonly DangoId[]
): TranslationParams | undefined {
  if (markedDangoIds.length === 0) {
    return undefined;
  }
  return Object.fromEntries(
    markedDangoIds.map((id, index) => [
      `markedDango${index + 1}`,
      characterParam(id),
    ])
  );
}

export function formatSkillBannerPayload(
  actorId: DangoId,
  actionId: SkillBannerActionId,
  narrativeParams?: TranslationParams
): Pick<
  BroadcastBannerPayload,
  "headline" | "detail" | "variant" | "markedDangoIds"
> {
  const skillNameKey = resolveSkillNameKey(actorId, actionId);
  const markedDangoIds = markedDangoIdsForSkillBanner(actionId, narrativeParams);
  const bannerDetailParams = bannerDetailParamsFromMarkedDango(markedDangoIds);
  return {
    variant: "skill",
    headline: text("banner.skill.headline", {
      actor: characterParam(actorId),
      skill: lexiconParam(skillNameKey),
    }),
    detail: text(
      resolveSkillBannerDetailKey(actionId),
      bannerDetailParams ?? narrativeParams
    ),
    ...(markedDangoIds.length > 0 ? { markedDangoIds } : {}),
  };
}

export function skillBannerFromPlaybackSegment(
  segment: PlaybackSkillSegment
): Pick<
  BroadcastBannerPayload,
  "headline" | "detail" | "variant" | "markedDangoIds"
> {
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
