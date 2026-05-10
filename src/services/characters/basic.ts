import { rollInclusive } from "@/services/characters/dice";
import type {
  CharacterDefinition,
  DiceRollContext,
  DiceRollResult,
  GameState,
} from "@/types/game";

const PLAIN_BASIC_DANGO_IDS = ["bot1"] as const;

function rollPlainBasicDice(
  state: GameState,
  context: DiceRollContext
): DiceRollResult {
  void state;
  void context;
  return { diceValue: rollInclusive(1, 3) };
}

function createPlainBasicDango(rawId: string): CharacterDefinition {
  return {
    id: rawId,
    displayName: "default",
    role: "basic",
    diceRoll: rollPlainBasicDice,
    travelDirection: "clockwise",
    activateAfterTurnIndex: 0,
    skillHooks: {},
  };
}

export const plainBasicDangoCharacters: CharacterDefinition[] =
  PLAIN_BASIC_DANGO_IDS.map(createPlainBasicDango);
