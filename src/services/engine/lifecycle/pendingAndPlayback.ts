import { cloneCellMap, cloneEntityMap } from "@/services/stateCells";
import type {
  DangoId,
  GameState,
  PendingTurnResolution,
  PlaybackSegment,
  TurnPlaybackPlan,
  TurnQueueAttachment,
  TurnRollPlan,
} from "@/types/game";

export function buildPendingTurnResolution(
  orderedActors: DangoId[],
  plansByActorId: Record<DangoId, TurnRollPlan | undefined>,
  allInitialRollsById: Record<DangoId, number | undefined>,
  allResolvedRollsById: Record<DangoId, number | undefined>
): PendingTurnResolution {
  return {
    orderedActorIds: orderedActors,
    plansByActorId,
    allInitialRollsById,
    allResolvedRollsById,
    nextActorIndex: 0,
    openingBannerConsumed: false,
  };
}

export function buildTurnQueueAttachment(
  pending: PendingTurnResolution,
  nextActorIndexAfterPlayback: number
): TurnQueueAttachment {
  const initialDiceByActorId: Record<DangoId, number | undefined> = {};
  for (const actorId of pending.orderedActorIds) {
    initialDiceByActorId[actorId] =
      pending.plansByActorId[actorId]?.initialDiceValue;
  }
  return {
    orderedActorIds: [...pending.orderedActorIds],
    initialDiceByActorId,
    nextActorIndexAfterPlayback,
  };
}

export function createTurnPlaybackPlan(
  sourceState: GameState,
  options: {
    turnIndex: number;
    segments: PlaybackSegment[];
    playbackStamp: number;
    showTurnIntroBanner: boolean;
    turnOrderActorIds?: DangoId[];
    turnQueue?: TurnQueueAttachment;
    presentationMode?: TurnPlaybackPlan["presentationMode"];
  }
): TurnPlaybackPlan {
  return {
    turnIndex: options.turnIndex,
    segments: options.segments,
    playbackStamp: options.playbackStamp,
    sourceCells: cloneCellMap(sourceState.cells),
    sourceEntities: cloneEntityMap(sourceState.entities),
    presentationMode: options.presentationMode ?? "animated",
    showTurnIntroBanner: options.showTurnIntroBanner,
    turnOrderActorIds: options.turnOrderActorIds,
    turnQueue: options.turnQueue,
  };
}
