import { skillTrigger } from "@/broadcast/skillTrigger";
import { characterParam, text } from "@/i18n";
import { rollStandardBasicDice } from "@/services/characters/basic";
import { LOCKED_ZERO_MOVEMENT_PLAN_PATCH } from "@/services/engine/movement/lockedZeroMovement";
import type {
  CharacterDefinition,
  GameState,
  SkillHookContext,
  SkillHookResolution,
} from "@/types/game";

const AUGUSTA_GOVERNOR_AUTHORITY_COOLDOWN_ENGINE_CYCLES = 2;

function resolveAugustaGovernorAuthority(
  state: GameState,
  context: SkillHookContext
): SkillHookResolution {
  const actorId = context.rollerId;
  const entity = state.entities[actorId];
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
    stack[stack.length - 1] !== actorId
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
        [actorId]: {
          ...entity,
          skillState: {
            ...entity.skillState,
            actLastNextRound: true,
            actLastNextRoundOrder,
            augustaGovernorAuthorityNextEligibleTurnIndex:
              state.turnIndex + cooldownTurns + 1,
          },
        },
      },
    },
    turnRollPlanPatch: LOCKED_ZERO_MOVEMENT_PLAN_PATCH,
    ...skillTrigger(
      "augusta.governorAuthority",
      text("simulation.skills.augustaGovernorAuthority", {
        actor: characterParam(actorId),
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
    beforeTurn: resolveAugustaGovernorAuthority,
  },
};
