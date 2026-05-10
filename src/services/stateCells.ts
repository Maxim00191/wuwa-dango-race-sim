import { ABBY_ID } from "@/constants/ids";
import type { GameState } from "@/types/game";

export function cloneCellMap(
  cells: Map<number, string[]>
): Map<number, string[]> {
  return new Map(
    [...cells.entries()].map(([key, value]) => [key, [...value]])
  );
}

export function relocateActorLedPortionCellsOnly(
  cells: Map<number, string[]>,
  fromCellIndex: number,
  toCellIndex: number,
  fullStackBottomToTop: string[],
  actorIndexInStack: number
): Map<number, string[]> {
  const remainderBottomToTop = fullStackBottomToTop.slice(0, actorIndexInStack);
  const movingBottomToTop = fullStackBottomToTop.slice(actorIndexInStack);
  if (movingBottomToTop.length === 0) {
    return cells;
  }
  const nextCells = cloneCellMap(cells);
  const atSource = nextCells.get(fromCellIndex);
  if (!atSource || atSource.join("|") !== fullStackBottomToTop.join("|")) {
    return cells;
  }
  if (remainderBottomToTop.length === 0) {
    nextCells.delete(fromCellIndex);
  } else {
    nextCells.set(fromCellIndex, remainderBottomToTop);
  }
  const existingAtDestination = nextCells.get(toCellIndex) ?? [];
  nextCells.set(
    toCellIndex,
    mergeWithAbbyBottomRule(existingAtDestination, movingBottomToTop)
  );
  return nextCells;
}

export function moveWholeStackCellsOnly(
  cells: Map<number, string[]>,
  originCellIndex: number,
  stackBottomToTop: string[],
  destinationCellIndex: number
): Map<number, string[]> {
  const nextCells = cloneCellMap(cells);
  const atOrigin = nextCells.get(originCellIndex);
  if (!atOrigin || atOrigin.join("|") !== stackBottomToTop.join("|")) {
    return cells;
  }
  nextCells.delete(originCellIndex);
  const existing = nextCells.get(destinationCellIndex) ?? [];
  nextCells.set(
    destinationCellIndex,
    mergeWithAbbyBottomRule(existing, stackBottomToTop)
  );
  return nextCells;
}

export function teleportEntitySliceCellsOnly(
  cells: Map<number, string[]>,
  fromCellIndex: number,
  toCellIndex: number,
  entityIdsToRemoveFromOrigin: string[]
): Map<number, string[]> {
  const stack = cells.get(fromCellIndex);
  if (!stack) {
    return cells;
  }
  const incoming = entityIdsToRemoveFromOrigin.filter((id) =>
    stack.includes(id)
  );
  if (incoming.length === 0) {
    return cells;
  }
  const nextCells = cloneCellMap(cells);
  const remaining = stack.filter((id) => !entityIdsToRemoveFromOrigin.includes(id));
  if (remaining.length === 0) {
    nextCells.delete(fromCellIndex);
  } else {
    nextCells.set(fromCellIndex, remaining);
  }
  const existingAtDestination = nextCells.get(toCellIndex) ?? [];
  nextCells.set(
    toCellIndex,
    mergeWithAbbyBottomRule(existingAtDestination, incoming)
  );
  return nextCells;
}

export function mergeWithAbbyBottomRule(
  existingBottomToTop: string[],
  incomingBottomToTop: string[]
): string[] {
  const combined = [...existingBottomToTop, ...incomingBottomToTop];
  if (!combined.includes(ABBY_ID)) {
    return combined;
  }
  return [ABBY_ID, ...combined.filter((id) => id !== ABBY_ID)];
}

export function findCellIndexForEntity(
  cells: Map<number, string[]>,
  entityId: string
): number | null {
  for (const [cellIndex, stackBottomToTop] of cells.entries()) {
    if (stackBottomToTop.includes(entityId)) {
      return cellIndex;
    }
  }
  return null;
}

export function getBottomEntityId(stackBottomToTop: string[]): string {
  return stackBottomToTop[0]!;
}

export function applyRaceDisplacementDeltaForMembers(
  state: GameState,
  memberIds: string[],
  clockwiseDelta: number
): GameState {
  const nextEntities = { ...state.entities };
  for (const id of memberIds) {
    const previous = nextEntities[id]!;
    nextEntities[id] = {
      ...previous,
      raceDisplacement: previous.raceDisplacement + clockwiseDelta,
    };
  }
  return { ...state, entities: nextEntities };
}
