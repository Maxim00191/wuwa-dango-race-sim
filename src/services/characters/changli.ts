import { skillTrigger } from "@/broadcast/skillTrigger";
import { characterParam, text } from "@/i18n";
import { rollStandardBasicDice } from "@/services/characters/basic";
import { findCellIndexForEntity } from "@/services/stateCells";
import type {
  CharacterDefinition,
  GameState,
  RoundEndHookContext,
  RoundEndHookResolution,
} from "@/types/game";

const CHANGLI_ACT_LAST_CHANCE = 0.65;

function resolveChangliActLastNextRound(
  state: GameState,
  context: RoundEndHookContext
): RoundEndHookResolution {
  const entity = state.entities[context.actorId];
  const cellIndex = findCellIndexForEntity(state.cells, context.actorId);
  if (!entity || cellIndex === null) {
    return { state };
  }
  const stack = state.cells.get(cellIndex);
  if (!stack) {
    return { state };
  }
  const actorIndex = stack.indexOf(context.actorId);
  if (
    actorIndex <= 0 ||
    actorIndex !== stack.length - 1 ||
    entity.skillState.actLastNextRound
  ) {
    return { state };
  }
  if (Math.random() >= CHANGLI_ACT_LAST_CHANCE) {
    return { state };
  }
  const actLastNextRoundOrder = state.actLastNextRoundOrderCounter + 1;
  return {
    state: {
      ...state,
      actLastNextRoundOrderCounter: actLastNextRoundOrder,
      entities: {
        ...state.entities,
        [context.actorId]: {
          ...entity,
          skillState: {
            ...entity.skillState,
            actLastNextRound: true,
            actLastNextRoundOrder,
          },
        },
      },
    },
    ...skillTrigger(
      "changli.actLastNextRound",
      text("simulation.skills.changliActLastNextRound", {
        actor: characterParam("changli"),
      })
    ),
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
    atRoundEnd: resolveChangliActLastNextRound,
  },
};
