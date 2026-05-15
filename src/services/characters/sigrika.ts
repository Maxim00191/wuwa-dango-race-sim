import { skillTrigger } from "@/broadcast/skillTrigger";
import { characterParam, text } from "@/i18n";
import { rollInclusive } from "@/services/characters/dice";
import type {
  CharacterDefinition,
  DiceRollContext,
  DiceRollResult,
  GameState,
  TurnRollPreparationContext,
  TurnRollPreparationResolution,
} from "@/types/game";

function rollSigrikaDice(
  state: GameState,
  context: DiceRollContext
): DiceRollResult {
  void state;
  void context;
  return { diceValue: rollInclusive(1, 3) };
}

function applySigrikaPressure(
  state: GameState,
  context: TurnRollPreparationContext
): TurnRollPreparationResolution {
  const rankIndex = context.rankedBasicIds.indexOf(context.actorId);
  if (rankIndex <= 0) {
    return { state };
  }
  const targets = context.rankedBasicIds
    .slice(Math.max(0, rankIndex - 2), rankIndex)
    .reverse()
    .filter((targetId) => context.plansByActorId[targetId]);
  if (targets.length === 0) {
    return { state };
  }
  const planPatches = Object.fromEntries(
    targets.map((targetId) => [
      targetId,
      {
        movementModifiers: [
          {
            sourceId: context.actorId,
            delta: -1,
            minimumSteps: 1,
          },
        ],
      },
    ])
  );
  if (targets.length === 1) {
    return {
      state,
      planPatches,
      ...skillTrigger(
        "sigrika.markSingle",
        text("simulation.skills.sigrikaMarkSingle", {
          actor: characterParam("sigrika"),
          target: characterParam(targets[0]!),
        })
      ),
    };
  }
  return {
    state,
    planPatches,
    ...skillTrigger(
      "sigrika.markDouble",
      text("simulation.skills.sigrikaMarkDouble", {
        actor: characterParam("sigrika"),
        firstTarget: characterParam(targets[0]!),
        secondTarget: characterParam(targets[1]!),
      })
    ),
  };
}

export const sigrikaCharacter: CharacterDefinition = {
  id: "sigrika",
  displayName: "Sigrika",
  role: "basic",
  attribute: "Aero",
  diceRoll: rollSigrikaDice,
  travelDirection: "clockwise",
  activateAfterTurnIndex: 0,
  skillHooks: {
    afterTurnRolls: applySigrikaPressure,
  },
};
