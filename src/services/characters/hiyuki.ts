import { skillTrigger } from "@/broadcast/skillTrigger";
import { ABBY_ID } from "@/constants/ids";
import { characterParam, text } from "@/i18n";
import { rollInclusive } from "@/services/characters/dice";
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

function rollHiyukiDice(
  state: GameState,
  context: DiceRollContext
): DiceRollResult {
  void state;
  void context;
  return { diceValue: rollInclusive(1, 3) };
}

function resolveHiyukiBondedMovement(
  state: GameState,
  context: MovementEvaluationContext
): MovementEvaluationResult {
  if (!state.entities[context.rollerId]?.skillState.hasMetAbby) {
    return { diceValue: context.diceValue };
  }
  return {
    diceValue: context.diceValue + 1,
    stepsExemptFromMovementModifiers: 1,
    ...skillTrigger(
      "hiyuki.bondedAdvance",
      text("simulation.skills.hiyukiBondedAdvance", {
        actor: characterParam("hiyuki"),
      })
    ),
  };
}

function resolveHiyukiMeetingAbby(
  state: GameState,
  context: PostMovementHookContext
): SkillHookResolution {
  const hiyukiState = state.entities[context.rollerId];
  const abbyState = state.entities[ABBY_ID];
  if (
    !hiyukiState ||
    !abbyState ||
    hiyukiState.skillState.hasMetAbby ||
    hiyukiState.cellIndex !== abbyState.cellIndex
  ) {
    return { state };
  }
  return {
    state: {
      ...state,
      entities: {
        ...state.entities,
        [context.rollerId]: {
          ...hiyukiState,
          skillState: {
            ...hiyukiState.skillState,
            hasMetAbby: true,
          },
        },
      },
    },
    ...skillTrigger(
      "hiyuki.metAbby",
      text("simulation.skills.hiyukiMetAbby", {
        actor: characterParam("hiyuki"),
        boss: characterParam(ABBY_ID),
      })
    ),
  };
}

export const hiyukiCharacter: CharacterDefinition = {
  id: "hiyuki",
  displayName: "Hiyuki",
  role: "basic",
  attribute: "Glacio",
  diceRoll: rollHiyukiDice,
  travelDirection: "clockwise",
  activateAfterTurnIndex: 0,
  skillHooks: {
    resolveMovement: resolveHiyukiBondedMovement,
    afterMovementResolution: resolveHiyukiMeetingAbby,
  },
};
