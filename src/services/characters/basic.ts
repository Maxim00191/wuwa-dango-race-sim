import { rollInclusive } from "@/services/characters/dice";
import type {
  CharacterDefinition,
  DiceRollContext,
  DiceRollResult,
  GameState,
} from "@/types/game";

const PLAIN_BASIC_DANGO_IDS = [
  "bot1",
  "bot2",
  "bot3",
  "bot4",
  "bot5",
  "bot6",
] as const;

function rollPlainBasicDice(
  state: GameState,
  context: DiceRollContext
): DiceRollResult {
  void state;
  void context;
  return { diceValue: rollInclusive(1, 3) };
}

function toDisplayName(rawId: string): string {
  return rawId.charAt(0).toUpperCase() + rawId.slice(1);
}

function createPlainBasicDango(rawId: string): CharacterDefinition {
  return {
    id: rawId,
    displayName: toDisplayName(rawId),
    role: "basic",
    diceRoll: rollPlainBasicDice,
    travelDirection: "clockwise",
    activateAfterTurnIndex: 0,
    skillHooks: {},
  };
}

export const plainBasicDangoCharacters: CharacterDefinition[] =
  PLAIN_BASIC_DANGO_IDS.map(createPlainBasicDango);
