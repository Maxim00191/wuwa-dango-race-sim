import type { EntityRuntimeState } from "@/types/game";

export function hasReachedWinningDistance(
  entity: EntityRuntimeState | undefined,
  winDistanceInClockwiseSteps: number
): boolean {
  return (
    (entity?.raceDisplacement ?? Number.NEGATIVE_INFINITY) >=
    winDistanceInClockwiseSteps
  );
}
