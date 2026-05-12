import type { DangoId, PlaybackSegment } from "@/types/game";

export function formatTurnOrderFromActorIds(
  orderedActorIds: DangoId[],
  getCharacterName: (id: DangoId) => string
): string {
  return orderedActorIds.map((id) => getCharacterName(id)).join(" → ");
}

export function formatTurnOrderArrowLine(
  segments: PlaybackSegment[],
  getCharacterName: (id: DangoId) => string,
  bonusSlideLabel: string
): string {
  const labels = segments.map((segment) => {
    if (segment.kind === "idle" || segment.kind === "hops") {
      return getCharacterName(segment.actorId);
    }
    if (segment.kind === "teleport") {
      return getCharacterName("abby");
    }
    if (segment.kind === "stackTeleport") {
      return getCharacterName(segment.actorId);
    }
    if (segment.kind === "slide") {
      return bonusSlideLabel;
    }
    return "";
  });
  return labels.filter(Boolean).join(" → ");
}
