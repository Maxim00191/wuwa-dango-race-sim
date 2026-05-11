import { ABBY_ID } from "@/constants/ids";
import {
  addClockwise,
  addCounterClockwise,
  normalizeCellIndex,
} from "@/services/circular";
import {
  applyMovementDeltaForMembers,
  cloneCellMap,
  moveWholeStackCellsOnly,
} from "@/services/stateCells";
import type {
  CellEffectApplication,
  CellEffectDefinition,
  CellEffectTriggerContext,
  GameState,
  ResolvedCellEffect,
} from "@/types/game";

export const CELL_EFFECT_IDS = {
  propulsionDevice: "propulsionDevice",
  hindranceDevice: "hindranceDevice",
  timeRift: "timeRift",
} as const;

export const CELL_EFFECT_LOG_KEY_BY_ID: Record<string, string> = {
  [CELL_EFFECT_IDS.propulsionDevice]: "simulation.log.cellPropulsion",
  [CELL_EFFECT_IDS.hindranceDevice]: "simulation.log.cellHindrance",
  [CELL_EFFECT_IDS.timeRift]: "simulation.log.cellRift",
};

function moveTriggeredStack(
  state: GameState,
  stackBottomToTop: string[],
  fromCellIndex: number,
  destinationCellIndex: number,
  clockwiseDisplacementDelta: number,
  direction: "clockwise" | "counterClockwise"
): CellEffectApplication {
  const nextCells = moveWholeStackCellsOnly(
    state.cells,
    fromCellIndex,
    stackBottomToTop,
    destinationCellIndex
  );
  if (nextCells === state.cells) {
    return { state };
  }
  let nextState: GameState = { ...state, cells: nextCells };
  nextState = applyMovementDeltaForMembers(
    nextState,
    stackBottomToTop,
    clockwiseDisplacementDelta,
    destinationCellIndex
  );
  return {
    state: nextState,
    shift: {
      travelingIds: stackBottomToTop,
      fromCell: fromCellIndex,
      toCell: destinationCellIndex,
      direction,
    },
  };
}

const propulsionDeviceEffect: CellEffectDefinition = {
  id: CELL_EFFECT_IDS.propulsionDevice,
  apply: (state, context) => {
    return moveTriggeredStack(
      state,
      context.stackBottomToTop,
      context.destinationCellIndex,
      addClockwise(context.destinationCellIndex, 1),
      1,
      "clockwise"
    );
  },
};

const hindranceDeviceEffect: CellEffectDefinition = {
  id: CELL_EFFECT_IDS.hindranceDevice,
  apply: (state, context) => {
    return moveTriggeredStack(
      state,
      context.stackBottomToTop,
      context.destinationCellIndex,
      addCounterClockwise(context.destinationCellIndex, 1),
      -1,
      "counterClockwise"
    );
  },
};

function shuffleStackBottomToTop(stackBottomToTop: string[]): string[] {
  const shuffledRacers = stackBottomToTop.filter((id) => id !== ABBY_ID);
  for (let index = shuffledRacers.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temporary = shuffledRacers[index];
    shuffledRacers[index] = shuffledRacers[swapIndex]!;
    shuffledRacers[swapIndex] = temporary!;
  }
  if (stackBottomToTop.includes(ABBY_ID)) {
    return [ABBY_ID, ...shuffledRacers];
  }
  return shuffledRacers;
}

const timeRiftEffect: CellEffectDefinition = {
  id: CELL_EFFECT_IDS.timeRift,
  apply: (state, context) => {
    const nextCells = cloneCellMap(state.cells);
    const cellIndex = context.destinationCellIndex;
    const previous = nextCells.get(cellIndex);
    if (!previous) {
      return { state };
    }
    nextCells.set(cellIndex, shuffleStackBottomToTop(previous));
    return { state: { ...state, cells: nextCells } };
  },
};

export const CELL_EFFECT_REGISTRY: Record<string, CellEffectDefinition> = {
  [propulsionDeviceEffect.id]: propulsionDeviceEffect,
  [hindranceDeviceEffect.id]: hindranceDeviceEffect,
  [timeRiftEffect.id]: timeRiftEffect,
};

export function resolveCellEffectIfPresent(
  state: GameState,
  boardEffectByCellIndex: Map<number, string | null>,
  context: CellEffectTriggerContext
): ResolvedCellEffect | null {
  const effectId = boardEffectByCellIndex.get(
    normalizeCellIndex(context.destinationCellIndex)
  );
  if (!effectId) {
    return null;
  }
  const definition = CELL_EFFECT_REGISTRY[effectId];
  if (!definition) {
    return null;
  }
  return {
    effectId: definition.id,
    ...definition.apply(state, context),
  };
}
