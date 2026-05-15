import { applySkillHookAfterMovement } from "@/services/engine/skills/hooks/afterMovement";
import { recordSkillTrigger } from "@/services/engine/state/mutations";
import type {
  DangoId,
  GameState,
  PlaybackSegment,
  PostMovementHookContext,
  TravelDirection,
} from "@/types/game";

export function hasEntityMovementChanged(
  originState: GameState,
  currentState: GameState,
  entityId: DangoId
): boolean {
  const originEntity = originState.entities[entityId];
  const currentEntity = currentState.entities[entityId];
  if (!originEntity || !currentEntity) {
    return false;
  }
  return (
    originEntity.cellIndex !== currentEntity.cellIndex ||
    originEntity.raceDisplacement !== currentEntity.raceDisplacement
  );
}

export function buildPostMovementHookContext(
  originState: GameState,
  currentState: GameState,
  subjectId: DangoId,
  baseContext: {
    turnIndex: number;
    diceValue: number;
    travelDirection: TravelDirection;
    landingCells: number[];
    actingEntityId: DangoId;
  },
  requireMovement = true
): PostMovementHookContext | null {
  const originEntity = originState.entities[subjectId];
  const currentEntity = currentState.entities[subjectId];
  if (!originEntity || !currentEntity) {
    return null;
  }
  if (
    requireMovement &&
    !hasEntityMovementChanged(originState, currentState, subjectId)
  ) {
    return null;
  }
  return {
    turnIndex: baseContext.turnIndex,
    rollerId: subjectId,
    actingEntityId: baseContext.actingEntityId,
    diceValue: baseContext.diceValue,
    startCellIndex: originEntity.cellIndex,
    endCellIndex: currentEntity.cellIndex,
    travelDirection: baseContext.travelDirection,
    landingCells: baseContext.landingCells,
    startRaceDisplacement: originEntity.raceDisplacement,
    endRaceDisplacement: currentEntity.raceDisplacement,
  };
}

export function collectPostMovementSubjectIds(
  originState: GameState,
  currentState: GameState,
  actingEntityId: DangoId
): DangoId[] {
  const orderedSubjectIds: DangoId[] = [];
  const seen = new Set<DangoId>();
  const candidateIds = [
    actingEntityId,
    ...originState.entityOrder,
    ...Object.keys(originState.entities),
  ];
  for (const candidateId of candidateIds) {
    if (seen.has(candidateId)) {
      continue;
    }
    seen.add(candidateId);
    if (!hasEntityMovementChanged(originState, currentState, candidateId)) {
      continue;
    }
    orderedSubjectIds.push(candidateId);
  }
  return orderedSubjectIds;
}

export function applySkillHooksAfterAffectedMovement(
  state: GameState,
  movementStartState: GameState,
  actingEntityId: DangoId,
  baseContext: {
    turnIndex: number;
    diceValue: number;
    travelDirection: TravelDirection;
    landingCells: number[];
    actingEntityId: DangoId;
  }
): { state: GameState; segments: PlaybackSegment[] } {
  let nextState = state;
  const segments: PlaybackSegment[] = [];
  const subjectIds = collectPostMovementSubjectIds(
    movementStartState,
    state,
    actingEntityId
  );
  for (const subjectId of subjectIds) {
    const hookContext = buildPostMovementHookContext(
      movementStartState,
      state,
      subjectId,
      baseContext
    );
    if (!hookContext) {
      continue;
    }
    const skillOutcome = applySkillHookAfterMovement(nextState, hookContext);
    nextState = skillOutcome.state;
    segments.push(...skillOutcome.segments);
    if (!skillOutcome.skillNarrative) {
      continue;
    }
    nextState = recordSkillTrigger(
      nextState,
      segments,
      subjectId,
      skillOutcome.skillNarrative,
      skillOutcome.skillBannerActionId
    );
  }
  return { state: nextState, segments };
}
