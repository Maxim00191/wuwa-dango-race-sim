import { ABBY_ID } from "@/constants/ids";
import {
  addClockwise,
  addCounterClockwise,
  normalizeCellIndex,
} from "@/services/circular";
import {
  applyRaceDisplacementDeltaForMembers,
  cloneCellMap,
  mergeWithAbbyBottomRule,
} from "@/services/stateCells";
import type {
  CellEffectDefinition,
  CellEffectTriggerContext,
  GameState,
} from "@/types/game";

function insertStackAtCell(
  nextCells: Map<number, string[]>,
  cellIndex: number,
  stackBottomToTop: string[]
): void {
  const existing = nextCells.get(cellIndex) ?? [];
  nextCells.set(cellIndex, mergeWithAbbyBottomRule(existing, stackBottomToTop));
}

function moveWholeStackByCells(
  state: GameState,
  originCellIndex: number,
  stackBottomToTop: string[],
  destinationCellIndex: number,
  clockwiseDeltaForDisplacement: number
): GameState {
  const nextCells = cloneCellMap(state.cells);
  const atOrigin = nextCells.get(originCellIndex);
  if (!atOrigin || atOrigin.join("|") !== stackBottomToTop.join("|")) {
    return state;
  }
  nextCells.delete(originCellIndex);
  insertStackAtCell(nextCells, destinationCellIndex, stackBottomToTop);
  let nextState: GameState = { ...state, cells: nextCells };
  nextState = applyRaceDisplacementDeltaForMembers(
    nextState,
    stackBottomToTop,
    clockwiseDeltaForDisplacement
  );
  return nextState;
}

const forwardCellStepEffect: CellEffectDefinition = {
  id: "forwardCellStepIfTopOfStack",
  apply: (state, context) => {
    const topId =
      context.stackBottomToTop[context.stackBottomToTop.length - 1];
    if (topId !== context.moverId) {
      return state;
    }
    const originCellIndex = context.destinationCellIndex;
    const stack = [...context.stackBottomToTop];
    const forwardClockwise =
      context.moverTravelDirection === "clockwise"
        ? 1
        : -1;
    const nextCellIndex =
      forwardClockwise === 1
        ? addClockwise(originCellIndex, 1)
        : addCounterClockwise(originCellIndex, 1);
    if (nextCellIndex === originCellIndex) {
      return state;
    }
    return moveWholeStackByCells(
      state,
      originCellIndex,
      stack,
      nextCellIndex,
      forwardClockwise
    );
  },
};

function shuffleStackBottomToTop(stackBottomToTop: string[]): string[] {
  const copy = [...stackBottomToTop];
  for (let index = copy.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temporary = copy[index];
    copy[index] = copy[swapIndex]!;
    copy[swapIndex] = temporary!;
  }
  if (copy.includes(ABBY_ID)) {
    return [ABBY_ID, ...copy.filter((id) => id !== ABBY_ID)];
  }
  return copy;
}

const shuffleStackEffect: CellEffectDefinition = {
  id: "shuffleStackOrderOnCell",
  apply: (state, context) => {
    const nextCells = cloneCellMap(state.cells);
    const cellIndex = context.destinationCellIndex;
    const previous = nextCells.get(cellIndex);
    if (!previous) {
      return state;
    }
    nextCells.set(cellIndex, shuffleStackBottomToTop(previous));
    return { ...state, cells: nextCells };
  },
};

export const CELL_EFFECT_REGISTRY: Record<string, CellEffectDefinition> = {
  [forwardCellStepEffect.id]: forwardCellStepEffect,
  [shuffleStackEffect.id]: shuffleStackEffect,
};

export function resolveCellEffectIfPresent(
  state: GameState,
  boardEffectByCellIndex: Map<number, string | null>,
  context: CellEffectTriggerContext
): GameState {
  const effectId = boardEffectByCellIndex.get(
    normalizeCellIndex(context.destinationCellIndex)
  );
  if (!effectId) {
    return state;
  }
  const definition = CELL_EFFECT_REGISTRY[effectId];
  if (!definition) {
    return state;
  }
  return definition.apply(state, context);
}
