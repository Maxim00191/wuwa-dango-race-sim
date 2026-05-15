import { skillTrigger } from "@/broadcast/skillTrigger";
import { rollInclusive } from "@/services/characters/dice";
import { characterParam, text } from "@/i18n";
import type {
  CharacterDefinition,
  DiceRollContext,
  DiceRollResult,
  GameState,
} from "@/types/game";

const LYNAE_DOUBLE_CHANCE = 0.6;
const LYNAE_STUCK_CHANCE = 0.2;

function rollLynaeUnstableDice(
  state: GameState,
  context: DiceRollContext
): DiceRollResult {
  void state;
  void context;
  const initialDiceValue = rollInclusive(1, 3);
  const unstableRoll = Math.random();
  if (unstableRoll < LYNAE_DOUBLE_CHANCE) {
    return {
      diceValue: initialDiceValue * 2,
      initialDiceValue,
      ...skillTrigger(
        "lynae.double",
        text("simulation.skills.lynaeDouble", {
          actor: characterParam("lynae"),
          value: initialDiceValue * 2,
        })
      ),
    };
  }
  if (unstableRoll < LYNAE_DOUBLE_CHANCE + LYNAE_STUCK_CHANCE) {
    return {
      diceValue: 0,
      initialDiceValue,
      ...skillTrigger(
        "lynae.stuck",
        text("simulation.skills.lynaeStuck", {
          actor: characterParam("lynae"),
        })
      ),
    };
  }
  return { diceValue: initialDiceValue, initialDiceValue };
}

export const lynaeCharacter: CharacterDefinition = {
  id: "lynae",
  displayName: "Lynae",
  role: "basic",
  attribute: "Spectro",
  diceRoll: rollLynaeUnstableDice,
  travelDirection: "clockwise",
  activateAfterTurnIndex: 0,
  skillHooks: {},
};
