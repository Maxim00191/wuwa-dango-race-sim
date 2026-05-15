import { skillTrigger } from "@/broadcast/skillTrigger";
import { characterParam, text } from "@/i18n";
import { rollStandardBasicDice } from "@/services/characters/basic";
import type {
  CharacterDefinition,
  GameState,
  MovementEvaluationContext,
  MovementEvaluationResult,
  RoundStartHookContext,
  RoundStartHookResolution,
} from "@/types/game";

function resolvePhrolovaElegantConspiracyAtRoundStart(
  state: GameState,
  context: RoundStartHookContext
): RoundStartHookResolution {
  const entity = state.entities[context.actorId];
  if (!entity) {
    return { state };
  }
  const stack = state.cells.get(context.cellIndex);
  const bottomBoostReady = Boolean(
    stack && stack.length > 1 && stack[0] === context.actorId
  );
  return {
    state: {
      ...state,
      entities: {
        ...state.entities,
        [context.actorId]: {
          ...entity,
          skillState: {
            ...entity.skillState,
            phrolovaBottomBoostReady: bottomBoostReady,
          },
        },
      },
    },
    ...(bottomBoostReady
      ? skillTrigger(
          "phrolova.bottomBoost",
          text("simulation.skills.phrolovaBottomBoost", {
            actor: characterParam("phrolova"),
          })
        )
      : {}),
  };
}

function resolvePhrolovaElegantConspiracy(
  state: GameState,
  context: MovementEvaluationContext
): MovementEvaluationResult {
  if (!state.entities[context.rollerId]?.skillState.phrolovaBottomBoostReady) {
    return { diceValue: context.diceValue };
  }
  return {
    diceValue: context.diceValue + 3,
    entityPatches: {
      [context.rollerId]: {
        skillState: {
          phrolovaBottomBoostReady: false,
        },
      },
    },
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
    atRoundStart: resolvePhrolovaElegantConspiracyAtRoundStart,
    resolveMovement: resolvePhrolovaElegantConspiracy,
  },
};
