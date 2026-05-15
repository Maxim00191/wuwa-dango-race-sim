import { skillTrigger } from "@/broadcast/skillTrigger";
import { characterParam, text } from "@/i18n";
import { rollStandardBasicDice } from "@/services/characters/basic";
import type {
  CharacterDefinition,
  GameState,
  RoundStartHookContext,
  RoundStartHookResolution,
} from "@/types/game";

const AUGUSTA_GOVERNOR_AUTHORITY_COOLDOWN_ENGINE_CYCLES = 2;

function resolveAugustaGovernorAuthority(
  state: GameState,
  context: RoundStartHookContext
): RoundStartHookResolution {
  const entity = state.entities[context.actorId];
  if (entity?.skillState.augustaServingDelayedTurn) {
    return { state };
  }
  const nextEligible =
    entity?.skillState.augustaGovernorAuthorityNextEligibleTurnIndex;
  if (
    nextEligible !== undefined &&
    state.turnIndex < nextEligible
  ) {
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
  const cooldownTurns = AUGUSTA_GOVERNOR_AUTHORITY_COOLDOWN_ENGINE_CYCLES;
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
            augustaGovernorAuthorityZeroMovePending: true,
            augustaGovernorAuthorityNextEligibleTurnIndex:
              state.turnIndex + cooldownTurns + 1,
          },
        },
      },
    },
    ...skillTrigger(
      "augusta.governorAuthority",
      text("simulation.skills.augustaGovernorAuthority", {
        actor: characterParam(context.actorId),
      })
    ),
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
