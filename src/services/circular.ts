import { CELL_COUNT, FINISH_LINE_CELL_INDEX } from "@/constants/board";

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

export function clockwiseDistanceBetweenInclusive(
  fromCellIndex: number,
  toCellIndex: number
): number {
  const from = fromCellIndex - 1;
  const to = toCellIndex - 1;
  return (to - from + CELL_COUNT) % CELL_COUNT;
}

export function clockwiseProgressFromFinishLine(cellIndex: number): number {
  return clockwiseDistanceBetweenInclusive(
    FINISH_LINE_CELL_INDEX,
    cellIndex
  );
}
