import { fullLapMidpointDistanceInClockwiseSteps } from "@/services/raceDistance";
import type { PostMovementHookContext } from "@/types/game";

export function courseMidpointDistance(): number {
  return fullLapMidpointDistanceInClockwiseSteps();
}

export function hasCrossedMidpoint(
  context: Pick<
    PostMovementHookContext,
    "startRaceDisplacement" | "endRaceDisplacement"
  >,
  midpointDistance: number
): boolean {
  return (
    context.startRaceDisplacement < midpointDistance &&
    context.endRaceDisplacement >= midpointDistance
  );
}
