import type {
  CharacterDefinition,
  DiceRollContext,
  DiceRollResult,
  GameState,
} from "@/types/game";

const MORNYE_DICE_SEQUENCE = [3, 2, 1] as const;

function rollMornyeSequentialDice(
  state: GameState,
  context: DiceRollContext
): DiceRollResult {
  const entity = state.entities[context.rollerId];
  if (!entity) {
    return { diceValue: MORNYE_DICE_SEQUENCE[0]! };
  }
  const ordinal = entity.sequentialDiceOrdinal ?? 0;
  const diceValue =
    MORNYE_DICE_SEQUENCE[ordinal % MORNYE_DICE_SEQUENCE.length]!;
  const nextOrdinal = (ordinal + 1) % MORNYE_DICE_SEQUENCE.length;
  return {
    diceValue,
    entityPatches: {
      [context.rollerId]: { sequentialDiceOrdinal: nextOrdinal },
    },
  };
}

export const mornyeCharacter: CharacterDefinition = {
  id: "mornye",
  displayName: "Mornye",
  role: "basic",
  diceRoll: rollMornyeSequentialDice,
  travelDirection: "clockwise",
  activateAfterTurnIndex: 0,
  skillHooks: {},
};
