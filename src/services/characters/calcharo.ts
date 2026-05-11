import { characterParam, text } from "@/i18n";
import { rollStandardBasicDice } from "@/services/characters/basic";
import { orderedBasicRacerIdsForLeaderboard } from "@/services/racerRanking";
import type {
  CharacterDefinition,
  GameState,
  MovementEvaluationContext,
  MovementEvaluationResult,
} from "@/types/game";

function resolveCalcharoLastPlaceBoost(
  state: GameState,
  context: MovementEvaluationContext
): MovementEvaluationResult {
  const rankedBasicIds = orderedBasicRacerIdsForLeaderboard(state);
  if (rankedBasicIds[rankedBasicIds.length - 1] !== context.rollerId) {
    return { diceValue: context.diceValue };
  }
  return {
    diceValue: context.diceValue + 3,
    skillNarrative: text("simulation.skills.calcharoLastPlaceBoost", {
      actor: characterParam("calcharo"),
    }),
  };
}

export const calcharoCharacter: CharacterDefinition = {
  id: "calcharo",
  displayName: "Calcharo",
  role: "basic",
  attribute: "Electro",
  diceRoll: rollStandardBasicDice,
  travelDirection: "clockwise",
  activateAfterTurnIndex: 0,
  skillHooks: {
    resolveMovement: resolveCalcharoLastPlaceBoost,
  },
};
