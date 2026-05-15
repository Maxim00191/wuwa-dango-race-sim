import {
  applyCellIndexForMembers,
  applyMovementDeltaForMembers,
  relocateActorLedPortionCellsOnly,
} from "@/services/stateCells";
import type { GameState } from "@/types/game";

export function relocateActorLedPortionBetweenCells(
  state: GameState,
  fromCellIndex: number,
  toCellIndex: number,
  fullStackBottomToTop: string[],
  actorIndexInStack: number,
  clockwiseDisplacementDelta: number
): GameState {
  const movingBottomToTop = fullStackBottomToTop.slice(actorIndexInStack);
  if (movingBottomToTop.length === 0) {
    return state;
  }
  const nextCells = relocateActorLedPortionCellsOnly(
    state.cells,
    fromCellIndex,
    toCellIndex,
    fullStackBottomToTop,
    actorIndexInStack
  );
  if (nextCells === state.cells) {
    return state;
  }
  let nextState: GameState = { ...state, cells: nextCells };
  nextState = applyMovementDeltaForMembers(
    nextState,
    movingBottomToTop,
    clockwiseDisplacementDelta,
    toCellIndex
  );
  nextState = applyCellIndexForMembers(
    nextState,
    nextCells.get(toCellIndex) ?? [],
    toCellIndex
  );
  return nextState;
}
