import { rollInclusive } from "@/services/characters/dice";
import { characterParam, text } from "@/i18n";
import type {
  CharacterDefinition,
  DiceRollContext,
  DiceRollResult,
  GameState,
  MovementEvaluationContext,
  MovementEvaluationResult,
} from "@/types/game";

function rollChisaDice(
  state: GameState,
  context: DiceRollContext
): DiceRollResult {
  void state;
  void context;
  return { diceValue: rollInclusive(1, 3) };
}

function resolveChisaUnderdogMovement(
  state: GameState,
  context: MovementEvaluationContext
): MovementEvaluationResult {
  void state;
  if (context.allInitialRolls.length === 0) {
    return { diceValue: context.diceValue };
  }
  const lowestInitialRoll = Math.min(...context.allInitialRolls);
  if (context.initialDiceValue !== lowestInitialRoll) {
    return { diceValue: context.diceValue };
  }
  return {
    diceValue: context.diceValue + 2,
    skillNarrative: text("simulation.skills.chisaUnderdog", {
      actor: characterParam("chisa"),
    }),
  };
}

export const chisaCharacter: CharacterDefinition = {
  id: "chisa",
  displayName: "Chisa",
  role: "basic",
  attribute: "Havoc",
  diceRoll: rollChisaDice,
  travelDirection: "clockwise",
  activateAfterTurnIndex: 0,
  skillHooks: {
    resolveMovement: resolveChisaUnderdogMovement,
  },
};
