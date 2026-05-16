import type { SerializedBoardEffects } from "@/services/monteCarlo/contracts/workerMessages";

export function serializeBoardEffects(
  boardEffectByCellIndex: Map<number, string | null>
): SerializedBoardEffects {
  return Array.from(boardEffectByCellIndex.entries());
}
