import { ABBY_ID } from "@/constants/ids";
import type { GameState } from "@/types/game";

export function cloneCellMap(
  cells: Map<number, string[]>
): Map<number, string[]> {
  return new Map(
    [...cells.entries()].map(([key, value]) => [key, [...value]])
  );
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
