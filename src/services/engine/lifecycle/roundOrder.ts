import type { DangoId, GameState } from "@/types/game";
import { shuffleOrderStableCopy } from "@/services/engine/core/random";

export function buildRoundActorOrder(state: GameState): {
  state: GameState;
  orderedActors: DangoId[];
} {
  let nextState = state;
  const randomizedActors = shuffleOrderStableCopy(nextState.entityOrder);
  const randomizedActorIndexById = new Map(
    randomizedActors.map((actorId, index) => [actorId, index])
  );
  const leadingActorIds = randomizedActors.filter(
    (actorId) => !nextState.entities[actorId]?.skillState.actLastNextRound
  );
  const roundTailActorIds = randomizedActors
    .filter((actorId) => nextState.entities[actorId]?.skillState.actLastNextRound)
    .sort((leftActorId, rightActorId) => {
      const leftOrder =
        nextState.entities[leftActorId]?.skillState.actLastNextRoundOrder ??
        Number.MAX_SAFE_INTEGER;
      const rightOrder =
        nextState.entities[rightActorId]?.skillState.actLastNextRoundOrder ??
        Number.MAX_SAFE_INTEGER;
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }
      return (
        (randomizedActorIndexById.get(leftActorId) ?? Number.MAX_SAFE_INTEGER) -
        (randomizedActorIndexById.get(rightActorId) ?? Number.MAX_SAFE_INTEGER)
      );
    });
  const orderedActors = [...leadingActorIds, ...roundTailActorIds];
  if (roundTailActorIds.length === 0) {
    return { state: nextState, orderedActors };
  }
  let nextEntities = nextState.entities;
  for (const actorId of roundTailActorIds) {
    const actor = nextEntities[actorId];
    if (!actor?.skillState.actLastNextRound) {
      continue;
    }
    nextEntities = {
      ...nextEntities,
      [actorId]: {
        ...actor,
        skillState: {
          ...actor.skillState,
          actLastNextRound: false,
          actLastNextRoundOrder: undefined,
          augustaServingDelayedTurn:
            actorId === "augusta" ? true : actor.skillState.augustaServingDelayedTurn,
        },
      },
    };
  }
  nextState = {
    ...nextState,
    entities: nextEntities,
  };
  return { state: nextState, orderedActors };
}
