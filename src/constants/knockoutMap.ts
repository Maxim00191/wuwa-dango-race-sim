import { CELL_COUNT } from "@/constants/board";

export const KNOCKOUT_MAP_CONFIG = {
  tileCount: CELL_COUNT,
  propulsionDeviceTiles: [5, 11, 21],
  hindranceDeviceTiles: [17, 27, 31],
  timeRiftTiles: [7, 15, 24],
} as const;
