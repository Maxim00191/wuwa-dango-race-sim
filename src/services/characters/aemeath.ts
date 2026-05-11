import { ABBY_ID } from "@/constants/ids";
import { characterParam, text } from "@/i18n";
import { rollInclusive } from "@/services/characters/dice";
import {
  findCellIndexForEntity,
  teleportEntitySliceCellsOnly,
} from "@/services/stateCells";
import type {
  CharacterDefinition,
  DiceRollContext,
  DiceRollResult,
  DangoId,
  GameState,
  MovementStepHookContext,
  MovementStepHookResult,
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

function findLeadingNonAbbyAheadOfAemeath(
  context: MovementStepHookContext
): DangoId | null {
  const aemeathRankIndex = context.rankedRacerIds.indexOf(context.rollerId);
  if (aemeathRankIndex <= 0) {
    return null;
  }
  return (
    context.rankedRacerIds
      .slice(0, aemeathRankIndex)
      .find((id) => id !== ABBY_ID) ?? null
  );
}

function resolveAemeathMidpointLeap(
  state: GameState,
  context: MovementStepHookContext
): MovementStepHookResult {
  const entity = state.entities[context.rollerId];
  if (
    !entity ||
    entity.hasUsedMidpointLeap ||
    context.toCellIndex !== MIDPOINT_CELL_INDEX
  ) {
    return { state };
  }
  const originCellIndex = findCellIndexForEntity(state.cells, context.rollerId);
  if (originCellIndex === null) {
    return { state };
  }
  const leadingNonAbbyId = findLeadingNonAbbyAheadOfAemeath(context);
  if (leadingNonAbbyId === null) {
    return { state };
  }
  const destinationCellIndex = findCellIndexForEntity(state.cells, leadingNonAbbyId);
  if (destinationCellIndex === null) {
    return { state };
  }
  const leadingEntity = state.entities[leadingNonAbbyId];
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
        raceDisplacement: leadingEntity?.raceDisplacement ?? entity.raceDisplacement,
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
    afterMovementStep: resolveAemeathMidpointLeap,
  },
};
