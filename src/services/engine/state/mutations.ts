import { buildSkillPlaybackSegment } from "@/broadcast/formatSkillBanner";
import type { SkillBannerActionId } from "@/broadcast/skillBannerLexicon";
import { resolveSkillBannerActionId } from "@/broadcast/skillBannerLexicon";
import type { LocalizedText } from "@/i18n";
import type {
  DangoId,
  EntityRuntimeState,
  GameLogEntry,
  GameState,
  PlaybackSegment,
} from "@/types/game";

export function appendLog(state: GameState, entry: GameLogEntry): GameState {
  return { ...state, log: [...state.log, entry] };
}

export function recordSkillTrigger(
  state: GameState,
  segments: PlaybackSegment[],
  actorId: DangoId,
  narrative: LocalizedText,
  skillBannerActionId?: SkillBannerActionId
): GameState {
  segments.push(
    buildSkillPlaybackSegment(
      actorId,
      resolveSkillBannerActionId(actorId, narrative, skillBannerActionId),
      narrative
    )
  );
  return appendLog(state, {
    kind: "skillTrigger",
    message: narrative,
  });
}

export function applyEntityRuntimePatches(
  entities: GameState["entities"],
  patches: Partial<Record<DangoId, Partial<EntityRuntimeState>>> | undefined
): GameState["entities"] {
  if (!patches) {
    return entities;
  }
  let nextEntities = entities;
  for (const [entityId, patch] of Object.entries(patches)) {
    if (!patch) {
      continue;
    }
    const previous = nextEntities[entityId];
    if (!previous) {
      continue;
    }
    const nextSkillState = patch.skillState
      ? {
          ...previous.skillState,
          ...patch.skillState,
        }
      : previous.skillState;
    nextEntities = {
      ...nextEntities,
      [entityId]: {
        ...previous,
        ...patch,
        skillState: nextSkillState,
      },
    };
  }
  return nextEntities;
}
