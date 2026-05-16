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

export function peakRaceDisplacementForTurn(
  context: Pick<
    PostMovementHookContext,
    | "startRaceDisplacement"
    | "endRaceDisplacement"
    | "diceValue"
    | "travelDirection"
  >
): number {
  const forwardSteps =
    context.travelDirection === "clockwise" ? context.diceValue : 0;
  return Math.max(
    context.endRaceDisplacement,
    context.startRaceDisplacement + forwardSteps
  );
}

export function hasPassedCourseMidpoint(
  context: Pick<
    PostMovementHookContext,
    | "startRaceDisplacement"
    | "endRaceDisplacement"
    | "diceValue"
    | "travelDirection"
  >,
  midpointDistance: number = courseMidpointDistance()
): boolean {
  return peakRaceDisplacementForTurn(context) >= midpointDistance;
}
