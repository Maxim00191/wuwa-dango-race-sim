import { ABBY_ID } from "@/constants/ids";
import { clockwiseProgressFromFinishLine } from "@/services/circular";
import { findCellIndexForEntity } from "@/services/stateCells";
import type { DangoId, GameState } from "@/types/game";

export function compareRacersByRank(a: DangoId, b: DangoId, state: GameState): number {
  const displacementA = state.entities[a]?.raceDisplacement ?? -Infinity;
  const displacementB = state.entities[b]?.raceDisplacement ?? -Infinity;
  if (displacementA !== displacementB) {
    return displacementB - displacementA;
  }
  const cellA = findCellIndexForEntity(state.cells, a);
  const cellB = findCellIndexForEntity(state.cells, b);
  if (
    cellA !== null &&
    cellB !== null &&
    cellA === cellB
  ) {
    const stack = state.cells.get(cellA)!;
    return stack.indexOf(b) - stack.indexOf(a);
  }
  const progressA = cellA !== null ? clockwiseProgressFromFinishLine(cellA) : -1;
  const progressB = cellB !== null ? clockwiseProgressFromFinishLine(cellB) : -1;
  return progressB - progressA;
}

export function orderedRacerIdsForLeaderboard(state: GameState): DangoId[] {
  const participants = [...state.activeBasicIds, ABBY_ID];
  return participants.sort((left, right) =>
    compareRacersByRank(left, right, state)
  );
}

export function orderedBasicRacerIdsForLeaderboard(state: GameState): DangoId[] {
  return [...state.activeBasicIds].sort((left, right) =>
    compareRacersByRank(left, right, state)
  );
}
