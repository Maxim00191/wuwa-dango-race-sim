import { characterParam, text } from "@/i18n";
import { rollInclusive } from "@/services/characters/dice";
import type {
  CharacterDefinition,
  DiceRollContext,
  DiceRollResult,
  GameState,
  MovementEvaluationContext,
  MovementEvaluationResult,
} from "@/types/game";

function rollPhoebeDice(
  state: GameState,
  context: DiceRollContext
): DiceRollResult {
  void state;
  void context;
  return { diceValue: rollInclusive(1, 3) };
}

function resolvePhoebeLuckyMovement(
  state: GameState,
  context: MovementEvaluationContext
): MovementEvaluationResult {
  void state;
  if (Math.random() >= 0.5) {
    return { diceValue: context.diceValue };
  }
  return {
    diceValue: context.diceValue + 1,
    skillNarrative: text("simulation.skills.phoebeLucky", {
      actor: characterParam("phoebe"),
    }),
  };
}

export const phoebeCharacter: CharacterDefinition = {
  id: "phoebe",
  displayName: "Phoebe",
  role: "basic",
  attribute: "Spectro",
  diceRoll: rollPhoebeDice,
  travelDirection: "clockwise",
  activateAfterTurnIndex: 0,
  skillHooks: {
    resolveMovement: resolvePhoebeLuckyMovement,
  },
};
