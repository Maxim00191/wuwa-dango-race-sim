import { useEffect, useMemo, useState } from "react";
import {
  pickLiveTurnQueuePresentation,
  pickResolvedTurnQueuePresentation,
  type TurnQueuePresentation,
} from "@/services/turnQueuePresentation";
import type { GameState } from "@/types/game";

function areOrderedActorIdsEqual(
  left: TurnQueuePresentation["orderedActorIds"],
  right: TurnQueuePresentation["orderedActorIds"]
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((actorId, index) => actorId === right[index]);
}

function areDiceMapsEqual(
  actorIds: TurnQueuePresentation["orderedActorIds"],
  left: TurnQueuePresentation["initialDiceByActorId"],
  right: TurnQueuePresentation["initialDiceByActorId"]
): boolean {
  return actorIds.every((actorId) => left[actorId] === right[actorId]);
}

function areTurnQueuePresentationsEqual(
  left: TurnQueuePresentation | null,
  right: TurnQueuePresentation | null
): boolean {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return (
    left.state === right.state &&
    left.activeRacerIndex === right.activeRacerIndex &&
    areOrderedActorIdsEqual(left.orderedActorIds, right.orderedActorIds) &&
    areDiceMapsEqual(
      left.orderedActorIds,
      left.initialDiceByActorId,
      right.initialDiceByActorId
    )
  );
}

export function usePersistentTurnQueuePresentation(
  gameState: GameState,
  isAnimating: boolean
): TurnQueuePresentation | null {
  const livePresentation = useMemo(
    () => pickLiveTurnQueuePresentation(gameState, isAnimating),
    [gameState, isAnimating]
  );
  const resolvedPresentation = useMemo(
    () => pickResolvedTurnQueuePresentation(gameState),
    [gameState]
  );
  const [bufferedPresentation, setBufferedPresentation] =
    useState<TurnQueuePresentation | null>(null);

  useEffect(() => {
    if (gameState.phase === "idle") {
      setBufferedPresentation(null);
      return;
    }

    const nextStablePresentation = livePresentation ?? resolvedPresentation;
    if (!nextStablePresentation) {
      return;
    }

    setBufferedPresentation((currentPresentation) =>
      areTurnQueuePresentationsEqual(
        currentPresentation,
        nextStablePresentation
      )
        ? currentPresentation
        : nextStablePresentation
    );
  }, [gameState.phase, livePresentation, resolvedPresentation]);

  if (gameState.phase === "idle") {
    return null;
  }

  return livePresentation ?? resolvedPresentation ?? bufferedPresentation;
}
