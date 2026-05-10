import { rollInclusive } from "@/services/characters/dice";
import type {
  CharacterDefinition,
  DiceRollContext,
  DiceRollResult,
  GameState,
} from "@/types/game";

function rollShorekeeperRestrictedDice(
  state: GameState,
  context: DiceRollContext
): DiceRollResult {
  void state;
  void context;
  return { diceValue: rollInclusive(2, 3) };
}

export const shorekeeperCharacter: CharacterDefinition = {
  id: "shorekeeper",
  displayName: "Shorekeeper",
  role: "basic",
  diceRoll: rollShorekeeperRestrictedDice,
  travelDirection: "clockwise",
  activateAfterTurnIndex: 0,
  skillHooks: {},
};
