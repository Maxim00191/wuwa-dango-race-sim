import { ABBY_ID } from "@/constants/ids";
import { characterParam, text } from "@/i18n";
import { rollInclusive } from "@/services/characters/dice";
import { MIDPOINT_DISTANCE } from "@/services/midpoint";
import {
  applyStackTeleportCellsOnly,
  findCellIndexForEntity,
  mergeWithAbbyBottomRule,
} from "@/services/stateCells";
import type {
  CharacterDefinition,
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

function findNearestAheadTeleportTarget(
  state: GameState,
  rollerId: string,
  forwardFromRaceDisplacement: number
): { destinationCellIndex: number; anchorRaceDisplacement: number } | null {
  if (!state.entities[rollerId]) {
    return null;
  }
  let nearest:
    | { destinationCellIndex: number; anchorRaceDisplacement: number; distance: number }
    | null = null;
  for (const [targetId, target] of Object.entries(state.entities)) {
    if (targetId === rollerId || targetId === ABBY_ID) {
      continue;
    }
    const distance = target.raceDisplacement - forwardFromRaceDisplacement;
    if (distance <= 0) {
      continue;
    }
    if (!nearest || distance < nearest.distance) {
      nearest = {
        destinationCellIndex: target.cellIndex,
        anchorRaceDisplacement: target.raceDisplacement,
        distance,
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
  const endDisplacement = context.endRaceDisplacement;
  const passedCourseMidpoint = endDisplacement >= MIDPOINT_DISTANCE;
  const teleportTarget = passedCourseMidpoint
    ? findNearestAheadTeleportTarget(state, context.rollerId, endDisplacement)
    : null;
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
    skillNarrative: text("simulation.skills.aemeathLeap", {
      actor: characterParam("aemeath"),
    }),
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
