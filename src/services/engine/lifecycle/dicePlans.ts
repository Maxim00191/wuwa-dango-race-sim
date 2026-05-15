import { CHARACTER_BY_ID } from "@/services/characters";
import type { DangoId, GameState, TurnRollPlan } from "@/types/game";

export function createTurnRollPlans(
  state: GameState,
  orderedActors: DangoId[]
): {
  plansByActorId: Record<DangoId, TurnRollPlan | undefined>;
  allInitialRollsById: Record<DangoId, number | undefined>;
  allResolvedRollsById: Record<DangoId, number | undefined>;
} {
  const plansByActorId: Record<DangoId, TurnRollPlan | undefined> = {};
  const allInitialRollsById: Record<DangoId, number | undefined> = {};
  const allResolvedRollsById: Record<DangoId, number | undefined> = {};
  for (const actorId of orderedActors) {
    const character = CHARACTER_BY_ID[actorId];
    if (!character) {
      continue;
    }
    const shouldStandbyBoss =
      character.role === "boss" &&
      state.turnIndex <= character.activateAfterTurnIndex;
    if (shouldStandbyBoss) {
      continue;
    }
    const diceOutcome = character.diceRoll(state, {
      turnIndex: state.turnIndex,
      rollerId: actorId,
    });
    const initialDiceValue = diceOutcome.initialDiceValue ?? diceOutcome.diceValue;
    plansByActorId[actorId] = {
      actorId,
      diceValue: diceOutcome.diceValue,
      initialDiceValue,
      locksMovementSteps: diceOutcome.locksMovementSteps,
      stepsExemptFromMovementModifiers:
        diceOutcome.stepsExemptFromMovementModifiers,
      entityPatches: diceOutcome.entityPatches,
      skillNarrative: diceOutcome.skillNarrative,
      skillBannerActionId: diceOutcome.skillBannerActionId,
    };
    allInitialRollsById[actorId] = initialDiceValue;
    allResolvedRollsById[actorId] = diceOutcome.diceValue;
  }
  return { plansByActorId, allInitialRollsById, allResolvedRollsById };
}
