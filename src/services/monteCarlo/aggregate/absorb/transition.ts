import { createPlacementIndexByBasicId } from "@/services/monteCarlo/aggregate/placement";
import type { DangoId } from "@/types/game";
import type {
  MonteCarloAggregateSnapshot,
  PlacementCountMatrix,
} from "@/types/monteCarlo";

export function absorbTransitionCounts(
  aggregate: MonteCarloAggregateSnapshot,
  transitionCountsByBasicId: Record<string, PlacementCountMatrix>,
  startingPlacementByBasicId: Record<string, number>,
  finalPlacements: DangoId[]
): void {
  const finalPlacementIndexByBasicId = createPlacementIndexByBasicId(
    finalPlacements
  );
  for (const basicId of aggregate.selectedBasicIds) {
    const startPlacementIndex = startingPlacementByBasicId[basicId];
    const finalPlacementIndex = finalPlacementIndexByBasicId[basicId];
    const transitionCounts = transitionCountsByBasicId[basicId];
    if (
      !transitionCounts ||
      startPlacementIndex === undefined ||
      finalPlacementIndex === undefined
    ) {
      continue;
    }
    const row = transitionCounts[startPlacementIndex];
    if (!row || finalPlacementIndex >= row.length) {
      continue;
    }
    row[finalPlacementIndex] += 1;
  }
}
