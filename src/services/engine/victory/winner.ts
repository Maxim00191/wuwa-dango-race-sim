import { ABBY_ID } from "@/constants/ids";
import type { GameState } from "@/types/game";
import { hasReachedWinningDistance } from "@/services/engine/victory/distance";

export function pickWinnerBasicDangoId(state: GameState): string | null {
  let bestId: string | null = null;
  let bestDisplacement = -Infinity;
  for (const [, stackBottomToTop] of state.cells.entries()) {
    const topId = stackBottomToTop[stackBottomToTop.length - 1]!;
    if (topId === ABBY_ID) {
      continue;
    }
    const entity = state.entities[topId];
    if (!hasReachedWinningDistance(entity)) {
      continue;
    }
    const displacement = entity.raceDisplacement;
    if (displacement > bestDisplacement) {
      bestDisplacement = displacement;
      bestId = topId;
    }
  }
  return bestId;
}
