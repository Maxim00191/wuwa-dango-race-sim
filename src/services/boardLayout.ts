import type { BoardCellDefinition } from "@/types/game";
import { DEFAULT_MAP_CONFIG } from "@/constants/defaultMap";
import { CELL_EFFECT_IDS } from "@/services/cellEffects";

export type BoardCellEffectVisual = {
  fill: string;
  stroke: string;
  symbol: string;
};

export const BOARD_CELL_EFFECT_VISUALS: Record<string, BoardCellEffectVisual> = {
  [CELL_EFFECT_IDS.propulsionDevice]: {
    fill: "#dcfce7",
    stroke: "#16a34a",
    symbol: "+",
  },
  [CELL_EFFECT_IDS.hindranceDevice]: {
    fill: "#fee2e2",
    stroke: "#dc2626",
    symbol: "-",
  },
  [CELL_EFFECT_IDS.timeRift]: {
    fill: "#f3e8ff",
    stroke: "#a855f7",
    symbol: "R",
  },
};

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

export function ellipseTangentUnitAtAngle(
  radiusX: number,
  radiusY: number,
  angleRadians: number
): { x: number; y: number } {
  const vx = -radiusX * Math.sin(angleRadians);
  const vy = radiusY * Math.cos(angleRadians);
  const length = Math.hypot(vx, vy);
  if (length === 0) {
    return { x: 0, y: 1 };
  }
  return { x: vx / length, y: vy / length };
}

export type BoardDeviceTileMapConfig = {
  readonly tileCount: number;
  readonly propulsionDeviceTiles: readonly number[];
  readonly hindranceDeviceTiles: readonly number[];
  readonly timeRiftTiles: readonly number[];
};

export function buildEffectByCellIndexFromDeviceTiles(
  config: BoardDeviceTileMapConfig
): Record<number, string> {
  const effectByCellIndex: Record<number, string> = {};
  for (const tile of config.propulsionDeviceTiles) {
    effectByCellIndex[tile] = CELL_EFFECT_IDS.propulsionDevice;
  }
  for (const tile of config.hindranceDeviceTiles) {
    effectByCellIndex[tile] = CELL_EFFECT_IDS.hindranceDevice;
  }
  for (const tile of config.timeRiftTiles) {
    effectByCellIndex[tile] = CELL_EFFECT_IDS.timeRift;
  }
  return effectByCellIndex;
}

export function buildBoardDescriptorWithCellEffects(
  cellCount: number,
  effectByCellIndex: Readonly<Record<number, string>>
): BoardCellDefinition[] {
  return Array.from({ length: cellCount }, (_, index) => {
    const cellIndex = index + 1;
    return {
      index: cellIndex,
      effectId: effectByCellIndex[cellIndex] ?? null,
    };
  });
}

export function buildLinearBoardDescriptor(): BoardCellDefinition[] {
  return buildBoardDescriptorWithCellEffects(
    DEFAULT_MAP_CONFIG.tileCount,
    buildEffectByCellIndexFromDeviceTiles(DEFAULT_MAP_CONFIG)
  );
}

export function buildEffectLookup(
  descriptor: BoardCellDefinition[]
): Map<number, string | null> {
  return new Map(descriptor.map((item) => [item.index, item.effectId]));
}

export function getBoardCellEffectVisual(
  effectId: string | null | undefined
): BoardCellEffectVisual | null {
  if (!effectId) {
    return null;
  }
  return BOARD_CELL_EFFECT_VISUALS[effectId] ?? null;
}
