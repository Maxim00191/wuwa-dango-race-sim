import { CELL_COUNT } from "@/constants/board";

export const DEFAULT_MAP_CONFIG = {
  tileCount: CELL_COUNT,
  propulsionDeviceTiles: [4, 12, 17, 24],
  hindranceDeviceTiles: [11, 29],
  timeRiftTiles: [7, 21],
} as const;
