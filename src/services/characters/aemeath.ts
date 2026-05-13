import { ABBY_ID } from "@/constants/ids";
import { characterParam, text } from "@/i18n";
import { rollInclusive } from "@/services/characters/dice";
import { hasCrossedMidpoint } from "@/services/midpoint";
import {
  findCellIndexForEntity,
  teleportEntitySliceCellsOnly,
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

function findNearestValidTargetCell(
  state: GameState,
  rollerId: string
): { cellIndex: number; distance: number } | null {
  const actor = state.entities[rollerId];
  if (!actor) {
    return null;
  }
  let nearestTarget: { cellIndex: number; distance: number } | null = null;
  for (const [targetId, target] of Object.entries(state.entities)) {
    if (targetId === rollerId || targetId === ABBY_ID) {
      continue;
    }
    const distance = target.raceDisplacement - actor.raceDisplacement;
    if (distance <= 0) {
      continue;
    }
    if (!nearestTarget || distance < nearestTarget.distance) {
      nearestTarget = { cellIndex: target.cellIndex, distance };
    }
  }
  return nearestTarget;
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
  if (!hasCrossedMidpoint(context)) {
    return { state };
  }
  const originCellIndex = findCellIndexForEntity(state.cells, context.rollerId);
  if (originCellIndex === null) {
    return { state };
  }
  const nearestTarget = findNearestValidTargetCell(state, context.rollerId);
  if (!nearestTarget) {
    return { state };
  }
  const destinationCellIndex = nearestTarget.cellIndex;
  const nextCells = teleportEntitySliceCellsOnly(
    state.cells,
    originCellIndex,
    destinationCellIndex,
    [context.rollerId]
  );
  const stateWithLeapSpent: GameState = {
    ...state,
    cells: nextCells,
    entities: {
      ...state.entities,
      [context.rollerId]: {
        ...entity,
        cellIndex: destinationCellIndex,
        raceDisplacement: entity.raceDisplacement + nearestTarget.distance,
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
        kind: "teleport",
        entityIds: [context.rollerId],
        fromCell: originCellIndex,
        toCell: destinationCellIndex,
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
