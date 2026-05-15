import { skillTrigger } from "@/broadcast/skillTrigger";
import { rollInclusive } from "@/services/characters/dice";
import { characterParam, text } from "@/i18n";
import type {
  CharacterDefinition,
  DiceRollContext,
  DiceRollResult,
  GameState,
} from "@/types/game";

const CARLOTTA_DOUBLE_CHANCE = 0.28;

function rollCarlottaLuckyDoubleDice(
  state: GameState,
  context: DiceRollContext
): DiceRollResult {
  void state;
  void context;
  const baseFace = rollInclusive(1, 3);
  const isLuckyDouble = Math.random() < CARLOTTA_DOUBLE_CHANCE;
  const diceValue = isLuckyDouble ? baseFace * 2 : baseFace;
  return {
    diceValue,
    initialDiceValue: baseFace,
    ...(isLuckyDouble
      ? skillTrigger(
          "carlotta.double",
          text("simulation.skills.carlottaDouble", {
            actor: characterParam("carlotta"),
            value: diceValue,
          })
        )
      : {}),
  };
}

export const carlottaCharacter: CharacterDefinition = {
  id: "carlotta",
  displayName: "Carlotta",
  role: "basic",
  attribute: "Glacio",
  diceRoll: rollCarlottaLuckyDoubleDice,
  travelDirection: "clockwise",
  activateAfterTurnIndex: 0,
  skillHooks: {},
};
