import { characterParam, text } from "@/i18n";
import { rollStandardBasicDice } from "@/services/characters/basic";
import type {
  CharacterDefinition,
  GameState,
  SkillHookContext,
  SkillHookResolution,
} from "@/types/game";

const CHANGLI_ACT_LAST_CHANCE = 0.65;

function resolveChangliActLastNextRound(
  state: GameState,
  context: SkillHookContext
): SkillHookResolution {
  const entity = state.entities[context.rollerId];
  const stack = state.cells.get(context.cellIndex);
  if (!entity || !stack) {
    return { state };
  }
  const actorIndex = stack.indexOf(context.rollerId);
  if (actorIndex <= 0 || entity.skillState.actLastNextRound) {
    return { state };
  }
  if (Math.random() >= CHANGLI_ACT_LAST_CHANCE) {
    return { state };
  }
  return {
    state: {
      ...state,
      entities: {
        ...state.entities,
        [context.rollerId]: {
          ...entity,
          skillState: {
            ...entity.skillState,
            actLastNextRound: true,
          },
        },
      },
    },
    skillNarrative: text("simulation.skills.changliActLastNextRound", {
      actor: characterParam("changli"),
    }),
  };
}

export const changliCharacter: CharacterDefinition = {
  id: "changli",
  displayName: "Changli",
  role: "basic",
  attribute: "Fusion",
  diceRoll: rollStandardBasicDice,
  travelDirection: "clockwise",
  activateAfterTurnIndex: 0,
  skillHooks: {
    afterTurn: resolveChangliActLastNextRound,
  },
};
