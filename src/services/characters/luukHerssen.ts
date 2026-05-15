import { rollInclusive } from "@/services/characters/dice";
import type {
  CellEffectSlideModifierContext,
  CharacterDefinition,
  DiceRollContext,
  DiceRollResult,
  GameState,
  MovementModifier,
} from "@/types/game";

const PROPULSION_DEVICE_EFFECT_ID = "propulsionDevice";
const HINDRANCE_DEVICE_EFFECT_ID = "hindranceDevice";

function luukCellEffectSlideModifiers(
  _state: GameState,
  context: CellEffectSlideModifierContext
): MovementModifier[] | undefined {
  if (context.effectId === PROPULSION_DEVICE_EFFECT_ID) {
    return [{ sourceId: "luukHerssen", delta: 3 }];
  }
  if (context.effectId === HINDRANCE_DEVICE_EFFECT_ID) {
    return [{ sourceId: "luukHerssen", delta: 1 }];
  }
  return undefined;
}

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
  skillHooks: {
    cellEffectSlideModifiers: luukCellEffectSlideModifiers,
  },
};
