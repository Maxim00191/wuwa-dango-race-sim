import { rollInclusive } from "@/services/characters/dice";
import type {
  BasicCharacterDefinition,
  DiceRollContext,
  DiceRollResult,
  GameState,
} from "@/types/game";

export function rollStandardBasicDice(
  state: GameState,
  context: DiceRollContext
): DiceRollResult {
  void state;
  void context;
  return { diceValue: rollInclusive(1, 3) };
}

export function createPlainBasicCharacter(
  definition: Pick<BasicCharacterDefinition, "id" | "displayName" | "attribute">
): BasicCharacterDefinition {
  return {
    ...definition,
    role: "basic",
    diceRoll: rollStandardBasicDice,
    travelDirection: "clockwise",
    activateAfterTurnIndex: 0,
    skillHooks: {},
  };
}
