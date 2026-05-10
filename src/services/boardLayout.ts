import type { BoardCellDefinition } from "@/types/game";
import { CELL_COUNT } from "@/constants/board";

export function angleForCellIndex(
  cellIndex: number,
  cellCount: number
): number {
  return (cellIndex / cellCount) * Math.PI * 2 - Math.PI / 2;
}

export function ellipsePointFromAngle(
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  angleRadians: number
): { x: number; y: number } {
  return {
    x: centerX + radiusX * Math.cos(angleRadians),
    y: centerY + radiusY * Math.sin(angleRadians),
  };
}

export function ellipseOutwardUnitAtAngle(
  radiusX: number,
  radiusY: number,
  angleRadians: number
): { x: number; y: number } {
  const vx = radiusX * Math.cos(angleRadians);
  const vy = radiusY * Math.sin(angleRadians);
  const length = Math.hypot(vx, vy);
  if (length === 0) {
    return { x: 1, y: 0 };
  }
  return { x: vx / length, y: vy / length };
}

export function buildLinearBoardDescriptor(): BoardCellDefinition[] {
  return Array.from({ length: CELL_COUNT }, (_, index) => {
    const cellIndex = index + 1;
    let effectId: string | null = null;
    if (cellIndex === 8) {
      effectId = "forwardCellStepIfTopOfStack";
    }
    if (cellIndex === 16) {
      effectId = "shuffleStackOrderOnCell";
    }
    if (cellIndex === 24) {
      effectId = "forwardCellStepIfTopOfStack";
    }
    return { index: cellIndex, effectId };
  });
}

export function buildEffectLookup(
  descriptor: BoardCellDefinition[]
): Map<number, string | null> {
  return new Map(descriptor.map((item) => [item.index, item.effectId]));
}
