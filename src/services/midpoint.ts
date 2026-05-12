import { LAP_DISTANCE_IN_CLOCKWISE_STEPS } from "@/constants/board";
import type { PostMovementHookContext } from "@/types/game";

export const MIDPOINT_DISTANCE = LAP_DISTANCE_IN_CLOCKWISE_STEPS / 2;

export function hasCrossedMidpoint(
  context: Pick<
    PostMovementHookContext,
    "startRaceDisplacement" | "endRaceDisplacement"
  >
): boolean {
  return (
    context.startRaceDisplacement < MIDPOINT_DISTANCE &&
    context.endRaceDisplacement >= MIDPOINT_DISTANCE
  );
}
