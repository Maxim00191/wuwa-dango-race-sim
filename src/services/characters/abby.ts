import { ABBY_ID } from "@/constants/ids";
import { rollInclusive } from "@/services/characters/dice";
import type {
  CharacterDefinition,
  DiceRollContext,
  DiceRollResult,
  GameState,
} from "@/types/game";

function rollAbbyBossDice(
  state: GameState,
  context: DiceRollContext
): DiceRollResult {
  void state;
  void context;
  return { diceValue: rollInclusive(1, 6) };
}

export const abbyCharacter: CharacterDefinition = {
  id: ABBY_ID,
  displayName: "Abby",
  role: "boss",
  attribute: null,
  diceRoll: rollAbbyBossDice,
  travelDirection: "counterClockwise",
  activateAfterTurnIndex: 2,
  skillHooks: {},
};
