import { rollInclusive } from "@/services/characters/dice";
import type {
  CharacterDefinition,
  DiceRollContext,
  DiceRollResult,
  GameState,
} from "@/types/game";

function rollLuukHerssenDice(
  state: GameState,
  context: DiceRollContext
): DiceRollResult {
  void state;
  void context;
  return { diceValue: rollInclusive(1, 3) };
}

export const luukHerssenCharacter: CharacterDefinition = {
  id: "luukHerssen",
  displayName: "Luuk Herssen",
  role: "basic",
  attribute: "Spectro",
  diceRoll: rollLuukHerssenDice,
  travelDirection: "clockwise",
  activateAfterTurnIndex: 0,
  skillHooks: {},
};
