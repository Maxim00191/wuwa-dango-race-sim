import { ABBY_ID } from "@/constants/ids";
import { skillTrigger } from "@/broadcast/skillTrigger";
import { characterParam, text } from "@/i18n";
import { rollInclusive } from "@/services/characters/dice";
import {
  clockwiseDistanceAhead,
  leaderboardClockwiseCourseProgress,
} from "@/services/circular";
import { hasPassedCourseMidpoint } from "@/services/midpoint";
import { orderedBasicRacerIdsForLeaderboard } from "@/services/racerRanking";
import {
  applyStackTeleportCellsOnly,
  findCellIndexForEntity,
  mergeWithAbbyBottomRule,
} from "@/services/stateCells";
import type {
  CharacterDefinition,
  DangoId,
  DiceRollContext,
  DiceRollResult,
  GameState,
  PostMovementHookContext,
  SkillHookResolution,
} from "@/types/game";

function rollAemeathDice(
  state: GameState,
  context: DiceRollContext
): DiceRollResult {
  void state;
  void context;
  return { diceValue: rollInclusive(1, 3) };
}

function isActorInLeadingCluster(state: GameState, actorId: DangoId): boolean {
  const rankedBasicIds = orderedBasicRacerIdsForLeaderboard(state);
  const leaderId = rankedBasicIds[0];
  if (!leaderId) {
    return true;
  }
  const leaderDisplacement =
    state.entities[leaderId]?.raceDisplacement ?? Number.NEGATIVE_INFINITY;
  const actorDisplacement =
    state.entities[actorId]?.raceDisplacement ?? Number.NEGATIVE_INFINITY;
  return actorDisplacement >= leaderDisplacement;
}

function isTargetStrictlyAheadOnCourse(
  actorCellIndex: number,
  targetCellIndex: number,
  actorRaceDisplacement: number,
  targetRaceDisplacement: number
): boolean {
  if (actorCellIndex === targetCellIndex) {
    return false;
  }
  if (targetRaceDisplacement > actorRaceDisplacement) {
    return true;
  }
  if (targetRaceDisplacement < actorRaceDisplacement) {
    return false;
  }
  return (
    leaderboardClockwiseCourseProgress(targetCellIndex) >
    leaderboardClockwiseCourseProgress(actorCellIndex)
  );
}

function findNearestStrictlyAheadTeleportTarget(
  state: GameState,
  actorId: DangoId
): { destinationCellIndex: number; anchorRaceDisplacement: number } | null {
  const actor = state.entities[actorId];
  if (!actor) {
    return null;
  }
  if (isActorInLeadingCluster(state, actorId)) {
    return null;
  }
  const rankedBasicIds = orderedBasicRacerIdsForLeaderboard(state);
  const actorRankIndex = rankedBasicIds.indexOf(actorId);
  if (actorRankIndex <= 0) {
    return null;
  }
  const aheadIds = rankedBasicIds.slice(0, actorRankIndex);
  const actorCellIndex = findCellIndexForEntity(state.cells, actorId);
  if (actorCellIndex === null) {
    return null;
  }
  let nearest:
    | {
        destinationCellIndex: number;
        anchorRaceDisplacement: number;
        clockwiseStepsAhead: number;
      }
    | null = null;
  for (const targetId of aheadIds) {
    if (targetId === ABBY_ID) {
      continue;
    }
    const target = state.entities[targetId];
    if (!target) {
      continue;
    }
    if (
      !isTargetStrictlyAheadOnCourse(
        actorCellIndex,
        target.cellIndex,
        actor.raceDisplacement,
        target.raceDisplacement
      )
    ) {
      continue;
    }
    const clockwiseStepsAhead = clockwiseDistanceAhead(
      actorCellIndex,
      target.cellIndex
    );
    if (clockwiseStepsAhead <= 0) {
      continue;
    }
    if (!nearest || clockwiseStepsAhead < nearest.clockwiseStepsAhead) {
      nearest = {
        destinationCellIndex: target.cellIndex,
        anchorRaceDisplacement: target.raceDisplacement,
        clockwiseStepsAhead,
      };
    }
  }
  if (!nearest) {
    return null;
  }
  return {
    destinationCellIndex: nearest.destinationCellIndex,
    anchorRaceDisplacement: nearest.anchorRaceDisplacement,
  };
}

function resolveAemeathMidpointLeap(
  state: GameState,
  context: PostMovementHookContext
): SkillHookResolution {
  if (context.rollerId !== context.actingEntityId) {
    return { state };
  }
  const entity = state.entities[context.rollerId];
  if (!entity || entity.skillState.hasUsedMidpointLeap) {
    return { state };
  }
  if (!hasPassedCourseMidpoint(context)) {
    return { state };
  }
  const teleportTarget = findNearestStrictlyAheadTeleportTarget(
    state,
    context.rollerId
  );
  if (!teleportTarget) {
    return { state };
  }
  const originCellIndex = findCellIndexForEntity(state.cells, context.rollerId);
  if (originCellIndex === null) {
    return { state };
  }
  const destinationCellIndex = teleportTarget.destinationCellIndex;
  const destinationStack = state.cells.get(destinationCellIndex) ?? [];
  const nextDestinationStack = mergeWithAbbyBottomRule(destinationStack, [
    context.rollerId,
  ]);
  const nextCells = applyStackTeleportCellsOnly(
    state.cells,
    [{ entityId: context.rollerId, fromCellIndex: originCellIndex }],
    destinationCellIndex,
    nextDestinationStack
  );
  const stateWithLeapSpent: GameState = {
    ...state,
    cells: nextCells,
    entities: {
      ...state.entities,
      [context.rollerId]: {
        ...entity,
        cellIndex: destinationCellIndex,
        raceDisplacement: teleportTarget.anchorRaceDisplacement,
        skillState: {
          ...entity.skillState,
          hasUsedMidpointLeap: true,
        },
      },
    },
  };
  return {
    state: stateWithLeapSpent,
    segments: [
      {
        kind: "stackTeleport",
        actorId: context.rollerId,
        moves: [{ entityId: context.rollerId, fromCell: originCellIndex }],
        toCell: destinationCellIndex,
        stackBottomToTop: nextDestinationStack,
      },
    ],
    ...skillTrigger(
      "aemeath.leap",
      text("simulation.skills.aemeathLeap", {
        actor: characterParam("aemeath"),
      })
    ),
  };
}

export const aemeathCharacter: CharacterDefinition = {
  id: "aemeath",
  displayName: "Aemeath",
  role: "basic",
  attribute: "Fusion",
  diceRoll: rollAemeathDice,
  travelDirection: "clockwise",
  activateAfterTurnIndex: 0,
  skillHooks: {
    afterMovement: resolveAemeathMidpointLeap,
  },
};
