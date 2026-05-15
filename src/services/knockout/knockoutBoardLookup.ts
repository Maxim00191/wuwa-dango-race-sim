import { KNOCKOUT_MAP_CONFIG } from "@/constants/knockoutMap";
import {
  buildBoardDescriptorWithCellEffects,
  buildEffectByCellIndexFromDeviceTiles,
  buildEffectLookup,
} from "@/services/boardLayout";

export const KNOCKOUT_BOARD_CELL_EFFECT_LOOKUP = buildEffectLookup(
  buildBoardDescriptorWithCellEffects(
    KNOCKOUT_MAP_CONFIG.tileCount,
    buildEffectByCellIndexFromDeviceTiles(KNOCKOUT_MAP_CONFIG)
  )
);
