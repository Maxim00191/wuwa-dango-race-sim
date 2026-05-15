import { skillTrigger } from "@/broadcast/skillTrigger";
import { characterParam, text } from "@/i18n";
import { rollStandardBasicDice } from "@/services/characters/basic";
import { findCellIndexForEntity } from "@/services/stateCells";
import type {
  CharacterDefinition,
  GameState,
  MovementEvaluationContext,
  MovementEvaluationResult,
} from "@/types/game";

function resolvePhrolovaElegantConspiracy(
  state: GameState,
  context: MovementEvaluationContext
): MovementEvaluationResult {
  const cellIndex = findCellIndexForEntity(state.cells, context.rollerId);
  const stack = cellIndex !== null ? state.cells.get(cellIndex) : undefined;
  const atStackBottom = Boolean(
    stack && stack.length > 1 && stack[0] === context.rollerId
  );
  if (!atStackBottom) {
    return { diceValue: context.diceValue };
  }
  return {
    diceValue: context.diceValue + 3,
    ...skillTrigger(
      "phrolova.bottomBoost",
      text("simulation.skills.phrolovaBottomBoost", {
        actor: characterParam("phrolova"),
      })
    ),
  };
}

export const phrolovaCharacter: CharacterDefinition = {
  id: "phrolova",
  displayName: "Phrolova",
  role: "basic",
  attribute: "Havoc",
  diceRoll: rollStandardBasicDice,
  travelDirection: "clockwise",
  activateAfterTurnIndex: 0,
  skillHooks: {
    resolveMovement: resolvePhrolovaElegantConspiracy,
  },
};
