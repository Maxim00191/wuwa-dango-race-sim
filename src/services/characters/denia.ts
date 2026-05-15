import { skillTrigger } from "@/broadcast/skillTrigger";
import { characterParam, text } from "@/i18n";
import { rollInclusive } from "@/services/characters/dice";
import type {
  CharacterDefinition,
  DiceRollContext,
  DiceRollResult,
  GameState,
} from "@/types/game";

function rollDeniaDice(
  state: GameState,
  context: DiceRollContext
): DiceRollResult {
  const previousRoll = state.entities[context.rollerId]?.skillState.previousRoll;
  const initialDiceValue = rollInclusive(1, 3);
  const matchedPreviousRoll = previousRoll === initialDiceValue;
  return {
    diceValue: matchedPreviousRoll ? initialDiceValue + 2 : initialDiceValue,
    initialDiceValue,
    entityPatches: {
      [context.rollerId]: {
        skillState: { previousRoll: initialDiceValue },
      },
    },
    ...(matchedPreviousRoll
      ? skillTrigger(
          "denia.repeat",
          text("simulation.skills.deniaRepeat", {
            actor: characterParam("denia"),
          })
        )
      : {}),
  };
}

export const deniaCharacter: CharacterDefinition = {
  id: "denia",
  displayName: "Denia",
  role: "basic",
  attribute: "Fusion",
  diceRoll: rollDeniaDice,
  travelDirection: "clockwise",
  activateAfterTurnIndex: 0,
  skillHooks: {},
};
