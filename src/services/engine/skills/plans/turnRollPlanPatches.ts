import type { DangoId, TurnRollPlan } from "@/types/game";

export function mergeMovementModifiers(
  existing: TurnRollPlan["movementModifiers"],
  incoming: TurnRollPlan["movementModifiers"]
): TurnRollPlan["movementModifiers"] {
  if (!existing?.length) {
    return incoming ? [...incoming] : undefined;
  }
  if (!incoming?.length) {
    return [...existing];
  }
  return [...existing, ...incoming];
}

export function applyTurnRollPlanPatches(
  plansByActorId: Record<DangoId, TurnRollPlan | undefined>,
  patches: Partial<Record<DangoId, Partial<TurnRollPlan>>> | undefined
): Record<DangoId, TurnRollPlan | undefined> {
  if (!patches) {
    return plansByActorId;
  }
  let nextPlans = plansByActorId;
  for (const [actorId, patch] of Object.entries(patches)) {
    if (!patch) {
      continue;
    }
    const previousPlan = nextPlans[actorId];
    if (!previousPlan) {
      continue;
    }
    nextPlans = {
      ...nextPlans,
      [actorId]: {
        ...previousPlan,
        ...patch,
        movementModifiers: mergeMovementModifiers(
          previousPlan.movementModifiers,
          patch.movementModifiers
        ),
      },
    };
  }
  return nextPlans;
}
