import {
  FINISH_LINE_CELL_INDEX,
  LAP_DISTANCE_IN_CLOCKWISE_STEPS,
} from "@/constants/board";
import { clockwiseDistanceAhead } from "@/services/circular";
import type { CellIndex } from "@/types/game";

/** Clockwise steps from a grid cell back to the finish marker (one crossing). */
export function winDistanceFromStartCellToFinish(
  startCellIndex: CellIndex
): number {
  return clockwiseDistanceAhead(startCellIndex, FINISH_LINE_CELL_INDEX);
}

/** Full-lap win threshold when racers begin on or ahead of the finish marker. */
export function fullLapWinDistanceInClockwiseSteps(): number {
  return LAP_DISTANCE_IN_CLOCKWISE_STEPS;
}

/** Course midpoint along the full 32-step lap (independent of sprint win distance). */
export function fullLapMidpointDistanceInClockwiseSteps(): number {
  return LAP_DISTANCE_IN_CLOCKWISE_STEPS / 2;
}
