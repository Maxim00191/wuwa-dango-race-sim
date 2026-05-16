import { LAP_DISTANCE_IN_CLOCKWISE_STEPS } from "@/constants/board";
import type {
  DangoId,
  EntityRuntimeState,
  GameState,
  PendingTurnResolution,
  PlaybackSegment,
  TurnPlaybackPlan,
  TurnRollPlan,
} from "@/types/game";
import type {
  BoardEffectAssignmentJson,
  MatchGameFrameJson,
  ReplayFrameVisualEvents,
} from "@/types/replay";

function cloneTurnRollPlan(plan: TurnRollPlan): TurnRollPlan {
  return {
    ...plan,
    movementModifiers: plan.movementModifiers
      ? plan.movementModifiers.map((modifier) => ({ ...modifier }))
      : undefined,
    entityPatches: plan.entityPatches
      ? (Object.fromEntries(
          Object.entries(plan.entityPatches).map(([key, value]) => [
            key,
            value
              ? {
                  ...value,
                  skillState: value.skillState
                    ? { ...value.skillState }
                    : value.skillState,
                }
              : value,
          ])
        ) as TurnRollPlan["entityPatches"])
      : undefined,
  };
}

function clonePendingTurn(
  pending: PendingTurnResolution | null
): PendingTurnResolution | null {
  if (!pending) {
    return null;
  }
  const plansByActorId: PendingTurnResolution["plansByActorId"] = {};
  for (const [actorId, plan] of Object.entries(pending.plansByActorId)) {
    plansByActorId[actorId] = plan ? cloneTurnRollPlan(plan) : undefined;
  }
  return {
    orderedActorIds: [...pending.orderedActorIds],
    plansByActorId,
    allInitialRollsById: { ...pending.allInitialRollsById },
    allResolvedRollsById: { ...pending.allResolvedRollsById },
    nextActorIndex: pending.nextActorIndex,
    openingBannerConsumed: pending.openingBannerConsumed,
  };
}

function clonePlaybackSegment(segment: PlaybackSegment): PlaybackSegment {
  if (segment.kind === "idle") {
    return { ...segment };
  }
  if (segment.kind === "roll") {
    return { ...segment };
  }
  if (segment.kind === "skill") {
    return {
      ...segment,
      message: segment.message ? { ...segment.message } : undefined,
    };
  }
  if (segment.kind === "hops") {
    return {
      ...segment,
      travelingIds: [...segment.travelingIds],
      cellsPath: [...segment.cellsPath],
    };
  }
  if (segment.kind === "teleport") {
    return { ...segment, entityIds: [...segment.entityIds] };
  }
  if (segment.kind === "stackPromote") {
    return { ...segment, entityIds: [...segment.entityIds] };
  }
  if (segment.kind === "stackTeleport") {
    return {
      ...segment,
      moves: segment.moves.map((move) => ({ ...move })),
      stackBottomToTop: [...segment.stackBottomToTop],
    };
  }
  if (segment.kind === "cellEffect") {
    return { ...segment, message: { ...segment.message } };
  }
  if (segment.kind === "victory") {
    return { ...segment };
  }
  return { ...segment, travelingIds: [...segment.travelingIds] };
}

function serializeVisualEvents(
  playback: TurnPlaybackPlan | null
): ReplayFrameVisualEvents | null {
  if (!playback) {
    return null;
  }
  return {
    turnIndex: playback.turnIndex,
    segments: playback.segments.map(clonePlaybackSegment),
    showTurnIntroBanner: playback.showTurnIntroBanner,
    turnOrderActorIds: playback.turnOrderActorIds
      ? [...playback.turnOrderActorIds]
      : undefined,
  };
}

export function serializeBoardEffectAssignments(
  boardEffectByCellIndex: Map<number, string | null>
): BoardEffectAssignmentJson[] {
  return [...boardEffectByCellIndex.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([cellIndex, effectId]) => ({ cellIndex, effectId }));
}

function physicalFrameFingerprint(frame: MatchGameFrameJson): string {
  const entityCells: Record<string, number> = {};
  for (const [entityId, runtime] of Object.entries(frame.entities)) {
    entityCells[entityId] = runtime.cellIndex;
  }
  return JSON.stringify({
    phase: frame.phase,
    winnerId: frame.winnerId,
    abbyPendingTeleportToStart: frame.abbyPendingTeleportToStart,
    cells: frame.cells,
    entityCells,
  });
}

export function engineFramesPhysicallyEqual(
  left: MatchGameFrameJson,
  right: MatchGameFrameJson
): boolean {
  return physicalFrameFingerprint(left) === physicalFrameFingerprint(right);
}

function pendingTurnKeyframeKey(
  pending: PendingTurnResolution | null
): string {
  if (!pending) {
    return "null";
  }
  return `${pending.nextActorIndex}:${pending.openingBannerConsumed}`;
}

export function commitEngineFrameToBuffer(
  frames: readonly MatchGameFrameJson[],
  frame: MatchGameFrameJson
): MatchGameFrameJson[] {
  if (frames.length === 0) {
    return [frame];
  }
  const previous = frames[frames.length - 1]!;
  if (
    frame.turnIndex === previous.turnIndex &&
    pendingTurnKeyframeKey(frame.pendingTurn) ===
      pendingTurnKeyframeKey(previous.pendingTurn) &&
    engineFramesPhysicallyEqual(previous, frame)
  ) {
    const merged = [...frames];
    merged[merged.length - 1] = frame;
    return merged;
  }
  return [...frames, frame];
}

export function serializeEngineFrame(state: GameState): MatchGameFrameJson {
  const cells: Record<string, DangoId[]> = {};
  const sortedEntries = [...state.cells.entries()].sort(
    (left, right) => left[0] - right[0]
  );
  for (const [cellIndex, stack] of sortedEntries) {
    cells[String(cellIndex)] = [...stack];
  }
  const entities: Record<string, EntityRuntimeState> = {};
  for (const [entityId, runtime] of Object.entries(state.entities)) {
    entities[entityId] = {
      ...runtime,
      skillState: { ...runtime.skillState },
    };
  }
  return {
    phase: state.phase,
    mode: state.mode,
    label: state.label,
    shortLabel: state.shortLabel,
    turnIndex: state.turnIndex,
    entityOrder: [...state.entityOrder],
    preserveEntityOrderOnFirstTurn: state.preserveEntityOrderOnFirstTurn,
    activeBasicsShareStartingCell: state.activeBasicsShareStartingCell,
    raceWinDistanceInClockwiseSteps: state.raceWinDistanceInClockwiseSteps,
    activeBasicIds: [...state.activeBasicIds],
    winnerId: state.winnerId,
    abbyPendingTeleportToStart: state.abbyPendingTeleportToStart,
    lastRollById: { ...state.lastRollById },
    actLastNextRoundOrderCounter: state.actLastNextRoundOrderCounter,
    entities,
    cells,
    pendingTurn: clonePendingTurn(state.pendingTurn),
    visualEvents: serializeVisualEvents(state.lastTurnPlayback),
  };
}

export function materializeGameStateFromFrame(
  frame: MatchGameFrameJson
): GameState {
  const cells = new Map<number, DangoId[]>();
  for (const [key, stack] of Object.entries(frame.cells)) {
    cells.set(Number(key), [...stack]);
  }
  const entities: GameState["entities"] = {};
  for (const [entityId, runtime] of Object.entries(frame.entities)) {
    entities[entityId] = {
      ...runtime,
      skillState: { ...runtime.skillState },
    };
  }
  return {
    phase: frame.phase,
    mode: frame.mode,
    label: frame.label,
    shortLabel: frame.shortLabel,
    turnIndex: frame.turnIndex,
    cells,
    entityOrder: [...frame.entityOrder],
    preserveEntityOrderOnFirstTurn:
      frame.preserveEntityOrderOnFirstTurn ?? false,
    activeBasicsShareStartingCell:
      frame.activeBasicsShareStartingCell ??
      frame.preserveEntityOrderOnFirstTurn ??
      false,
    raceWinDistanceInClockwiseSteps:
      frame.raceWinDistanceInClockwiseSteps ??
      LAP_DISTANCE_IN_CLOCKWISE_STEPS,
    entities,
    activeBasicIds: [...frame.activeBasicIds],
    winnerId: frame.winnerId,
    abbyPendingTeleportToStart: frame.abbyPendingTeleportToStart,
    lastRollById: { ...frame.lastRollById },
    log: [],
    lastTurnPlayback: null,
    pendingTurn: clonePendingTurn(frame.pendingTurn),
    actLastNextRoundOrderCounter: frame.actLastNextRoundOrderCounter,
    playbackStamp: 0,
  };
}
