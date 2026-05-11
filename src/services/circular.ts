import { CELL_COUNT, FINISH_LINE_CELL_INDEX } from "@/constants/board";
import type { TravelDirection } from "@/types/game";

export function normalizeCellIndex(raw: number): number {
  const zeroBased = (raw - 1 + CELL_COUNT * 1000) % CELL_COUNT;
  return zeroBased + 1;
}

export function addClockwise(fromCellIndex: number, steps: number): number {
  return normalizeCellIndex(fromCellIndex + steps);
}

export function addCounterClockwise(fromCellIndex: number, steps: number): number {
  return normalizeCellIndex(fromCellIndex - steps);
}

export function clockwiseDistanceAhead(
  fromCellIndex: number,
  toCellIndex: number
): number {
  const from = normalizeCellIndex(fromCellIndex) - 1;
  const to = normalizeCellIndex(toCellIndex) - 1;
  return (to - from + CELL_COUNT) % CELL_COUNT;
}

export function clockwiseDistanceBetweenInclusive(
  fromCellIndex: number,
  toCellIndex: number
): number {
  return clockwiseDistanceAhead(fromCellIndex, toCellIndex);
}

export function clockwiseProgressFromFinishLine(cellIndex: number): number {
  return clockwiseDistanceBetweenInclusive(
    FINISH_LINE_CELL_INDEX,
    cellIndex
  );
}

export function buildStepLandingCells(
  fromCellIndex: number,
  steps: number,
  direction: TravelDirection
): number[] {
  const landings: number[] = [];
  for (let ordinal = 1; ordinal <= steps; ordinal++) {
    landings.push(
      direction === "clockwise"
        ? addClockwise(fromCellIndex, ordinal)
        : addCounterClockwise(fromCellIndex, ordinal)
    );
  }
  return landings;
}
