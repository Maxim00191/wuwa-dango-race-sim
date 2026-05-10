import type { CharacterDefinition } from "@/types/game";
import type { PlaybackSegment } from "@/types/game";

export function formatTurnOrderArrowLine(
  segments: PlaybackSegment[],
  characterById: Record<string, CharacterDefinition>
): string {
  const labels = segments.map((segment) => {
    if (segment.kind === "idle" || segment.kind === "hops") {
      return characterById[segment.actorId]?.displayName ?? segment.actorId;
    }
    if (segment.kind === "teleport") {
      return characterById.abby?.displayName ?? "Abby";
    }
    if (segment.kind === "slide") {
      return "Bonus slide";
    }
    return "";
  });
  return labels.filter(Boolean).join(" → ");
}
