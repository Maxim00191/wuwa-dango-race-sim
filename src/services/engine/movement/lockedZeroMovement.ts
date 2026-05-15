import type { DiceRollResult, TurnRollPlan } from "@/types/game";

export const LOCKED_ZERO_MOVEMENT_PLAN_PATCH = {
  diceValue: 0,
  locksMovementSteps: true,
} as const satisfies Partial<TurnRollPlan>;

export function applyLockedZeroMovementPlan<T extends TurnRollPlan>(plan: T): T {
  return { ...plan, ...LOCKED_ZERO_MOVEMENT_PLAN_PATCH };
}

export function lockedZeroMovementDiceRoll(
  fields: Omit<DiceRollResult, "diceValue" | "locksMovementSteps">
): DiceRollResult {
  return { ...fields, ...LOCKED_ZERO_MOVEMENT_PLAN_PATCH };
}
