import {
  buildEffectLookup,
  buildLinearBoardDescriptor,
} from "@/services/boardLayout";

export const BOARD_CELL_EFFECT_LOOKUP = buildEffectLookup(
  buildLinearBoardDescriptor()
);
