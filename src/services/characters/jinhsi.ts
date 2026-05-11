import { characterParam, text } from "@/i18n";
import { rollStandardBasicDice } from "@/services/characters/basic";
import { teleportEntitySliceCellsOnly } from "@/services/stateCells";
import type {
  CharacterDefinition,
  GameState,
  SkillHookContext,
  SkillHookResolution,
} from "@/types/game";

const JINHSI_STACK_ASCEND_CHANCE = 0.4;

function resolveJinhsiStackAscend(
  state: GameState,
  context: SkillHookContext
): SkillHookResolution {
  const stack = state.cells.get(context.cellIndex);
  if (!stack) {
    return { state };
  }
  const actorIndex = stack.indexOf(context.rollerId);
  if (actorIndex === -1 || actorIndex >= stack.length - 1) {
    return { state };
  }
  if (Math.random() >= JINHSI_STACK_ASCEND_CHANCE) {
    return { state };
  }
  return {
    state: {
      ...state,
      cells: teleportEntitySliceCellsOnly(
        state.cells,
        context.cellIndex,
        context.cellIndex,
        [context.rollerId]
      ),
    },
    segments: [
      {
        kind: "teleport",
        entityIds: [context.rollerId],
        fromCell: context.cellIndex,
        toCell: context.cellIndex,
      },
    ],
    skillNarrative: text("simulation.skills.jinhsiStackAscend", {
      actor: characterParam("jinhsi"),
    }),
  };
}

export const jinhsiCharacter: CharacterDefinition = {
  id: "jinhsi",
  displayName: "Jinhsi",
  role: "basic",
  attribute: "Spectro",
  diceRoll: rollStandardBasicDice,
  travelDirection: "clockwise",
  activateAfterTurnIndex: 0,
  skillHooks: {
    beforeTurn: resolveJinhsiStackAscend,
  },
};
