import { ABBY_ID, BASIC_DANGO_IDS } from "@/constants/ids";
import type { CharacterDefinition, DiceRollContext } from "@/types/game";

function rollInclusive(min: number, max: number): number {
  const span = max - min + 1;
  return min + Math.floor(Math.random() * span);
}

function rollBasicDice(context: DiceRollContext): number {
  void context;
  return rollInclusive(1, 3);
}

function rollBossDice(context: DiceRollContext): number {
  void context;
  return rollInclusive(1, 6);
}

const basicCharacters: CharacterDefinition[] = BASIC_DANGO_IDS.map((id) => ({
  id,
  displayName: id.charAt(0).toUpperCase() + id.slice(1),
  role: "basic",
  diceRoll: rollBasicDice,
  travelDirection: "clockwise",
  activateAfterTurnIndex: 0,
  skillHooks: {},
}));

const abbyCharacter: CharacterDefinition = {
  id: ABBY_ID,
  displayName: "Abby",
  role: "boss",
  diceRoll: rollBossDice,
  travelDirection: "counterClockwise",
  activateAfterTurnIndex: 2,
  skillHooks: {},
};

export const CHARACTER_LIST: CharacterDefinition[] = [
  ...basicCharacters,
  abbyCharacter,
];

export const CHARACTER_BY_ID: Record<string, CharacterDefinition> =
  CHARACTER_LIST.reduce<Record<string, CharacterDefinition>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
