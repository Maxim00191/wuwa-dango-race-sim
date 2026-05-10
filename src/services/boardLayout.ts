import type { BoardCellDefinition } from "@/types/game";
import { CELL_COUNT } from "@/constants/board";

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
