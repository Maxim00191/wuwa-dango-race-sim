import { ABBY_ID } from "@/constants/ids";
import { characterParam, text } from "@/i18n";
import { rollInclusive } from "@/services/characters/dice";
import { clockwiseDistanceAhead } from "@/services/circular";
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

const MIDPOINT_CELL_INDEX = 16;

function rollAemeathDice(
  state: GameState,
  context: DiceRollContext
): DiceRollResult {
  void state;
  void context;
  return { diceValue: rollInclusive(1, 3) };
}

function hasValidTeleportTarget(stackBottomToTop: string[]): boolean {
  return stackBottomToTop.some((id) => id !== ABBY_ID);
}

function findNearestValidTargetCell(
  state: GameState,
  fromCellIndex: number
): { cellIndex: number; distance: number } | null {
  let nearestTarget: { cellIndex: number; distance: number } | null = null;
  for (const [cellIndex, stackBottomToTop] of state.cells.entries()) {
    if (!hasValidTeleportTarget(stackBottomToTop)) {
      continue;
    }
    const distance = clockwiseDistanceAhead(fromCellIndex, cellIndex);
    if (distance === 0) {
      continue;
    }
    if (!nearestTarget || distance < nearestTarget.distance) {
      nearestTarget = { cellIndex, distance };
    }
  }
  return nearestTarget;
}

function resolveAemeathMidpointLeap(
  state: GameState,
  context: PostMovementHookContext
): SkillHookResolution {
  const entity = state.entities[context.rollerId];
  if (!entity || entity.hasUsedMidpointLeap) {
    return { state };
  }
  if (!context.landingCells.includes(MIDPOINT_CELL_INDEX)) {
    return { state };
  }
  const originCellIndex = findCellIndexForEntity(state.cells, context.rollerId);
  if (originCellIndex === null) {
    return { state };
  }
  const nearestTarget = findNearestValidTargetCell(state, originCellIndex);
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
        hasUsedMidpointLeap: true,
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
  diceRoll: rollAemeathDice,
  travelDirection: "clockwise",
  activateAfterTurnIndex: 0,
  skillHooks: {
    afterMovement: resolveAemeathMidpointLeap,
  },
};
