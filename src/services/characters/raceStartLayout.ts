import type { CellIndex, GameState } from "@/types/game";

export function allActiveBasicsShareCell(state: GameState): boolean {
  const { activeBasicIds, entities } = state;
  if (activeBasicIds.length === 0) {
    return false;
  }
  let shared: CellIndex | undefined;
  for (const id of activeBasicIds) {
    const cell = entities[id]?.cellIndex;
    if (cell === undefined) {
      return false;
    }
    if (shared === undefined) {
      shared = cell;
    } else if (cell !== shared) {
      return false;
    }
  }
  return true;
}
