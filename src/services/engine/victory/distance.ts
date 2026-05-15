import { LAP_DISTANCE_IN_CLOCKWISE_STEPS } from "@/constants/board";
import type { EntityRuntimeState } from "@/types/game";

export function hasReachedWinningDistance(entity: EntityRuntimeState | undefined): boolean {
  return (entity?.raceDisplacement ?? Number.NEGATIVE_INFINITY) >=
    LAP_DISTANCE_IN_CLOCKWISE_STEPS;
}
