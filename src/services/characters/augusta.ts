import { characterParam, text } from "@/i18n";
import { rollStandardBasicDice } from "@/services/characters/basic";
import type {
  CharacterDefinition,
  GameState,
  RoundStartHookContext,
  RoundStartHookResolution,
} from "@/types/game";

function resolveAugustaGovernorAuthority(
  state: GameState,
  context: RoundStartHookContext
): RoundStartHookResolution {
  const entity = state.entities[context.actorId];
  if (entity?.skillState.augustaServingDelayedTurn) {
    return { state };
  }
  const stack = state.cells.get(context.cellIndex);
  if (
    !entity ||
    !stack ||
    stack.length < 2 ||
    stack[stack.length - 1] !== context.actorId
  ) {
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
            skipTurnThisRound: true,
          },
        },
      },
    },
    skillNarrative: text("simulation.skills.augustaGovernorAuthority", {
      actor: characterParam(context.actorId),
    }),
  };
}

export const augustaCharacter: CharacterDefinition = {
  id: "augusta",
  displayName: "Augusta",
  role: "basic",
  attribute: "Electro",
  diceRoll: rollStandardBasicDice,
  travelDirection: "clockwise",
  activateAfterTurnIndex: 0,
  skillHooks: {
    atRoundStart: resolveAugustaGovernorAuthority,
  },
};
