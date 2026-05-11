import { characterParam, text } from "@/i18n";
import { rollInclusive } from "@/services/characters/dice";
import { orderedBasicRacerIdsForLeaderboard } from "@/services/racerRanking";
import type {
  CharacterDefinition,
  DiceRollContext,
  DiceRollResult,
  GameState,
  MovementEvaluationContext,
  MovementEvaluationResult,
  PostMovementHookContext,
  SkillHookResolution,
} from "@/types/game";

function rollCartethyiaDice(
  state: GameState,
  context: DiceRollContext
): DiceRollResult {
  void state;
  void context;
  return { diceValue: rollInclusive(1, 3) };
}

function resolveCartethyiaComebackMovement(
  state: GameState,
  context: MovementEvaluationContext
): MovementEvaluationResult {
  if (!state.entities[context.rollerId]?.skillState.comebackActive) {
    return { diceValue: context.diceValue };
  }
  if (Math.random() >= 0.6) {
    return { diceValue: context.diceValue };
  }
  return {
    diceValue: context.diceValue + 2,
    skillNarrative: text("simulation.skills.cartethyiaComebackBoost", {
      actor: characterParam("cartethyia"),
    }),
  };
}

function resolveCartethyiaComebackUnlock(
  state: GameState,
  context: PostMovementHookContext
): SkillHookResolution {
  const entity = state.entities[context.rollerId];
  if (!entity || entity.skillState.comebackActive) {
    return { state };
  }
  const rankedBasicIds = orderedBasicRacerIdsForLeaderboard(state);
  if (rankedBasicIds[rankedBasicIds.length - 1] !== context.rollerId) {
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
            comebackActive: true,
          },
        },
      },
    },
    skillNarrative: text("simulation.skills.cartethyiaComebackAwaken", {
      actor: characterParam("cartethyia"),
    }),
  };
}

export const cartethyiaCharacter: CharacterDefinition = {
  id: "cartethyia",
  displayName: "Cartethyia",
  role: "basic",
  attribute: "Aero",
  diceRoll: rollCartethyiaDice,
  travelDirection: "clockwise",
  activateAfterTurnIndex: 0,
  skillHooks: {
    resolveMovement: resolveCartethyiaComebackMovement,
    afterMovementResolution: resolveCartethyiaComebackUnlock,
  },
};
