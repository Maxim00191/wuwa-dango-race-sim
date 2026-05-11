import type { DangoId, GameState, TurnQueueAttachment } from "@/types/game";

export type TurnQueuePresentationState = "active" | "resolved";

export type TurnQueuePresentation = {
  orderedActorIds: DangoId[];
  initialDiceByActorId: Record<DangoId, number | undefined>;
  activeRacerIndex: number;
  state: TurnQueuePresentationState;
};

function buildTurnQueuePresentation(
  attachment: TurnQueueAttachment,
  activeRacerIndex: number,
  state: TurnQueuePresentationState
): TurnQueuePresentation {
  return {
    orderedActorIds: [...attachment.orderedActorIds],
    initialDiceByActorId: { ...attachment.initialDiceByActorId },
    activeRacerIndex,
    state,
  };
}

export function pickLiveTurnQueuePresentation(
  gameState: GameState,
  isAnimating: boolean
): TurnQueuePresentation | null {
  if (gameState.phase !== "running") {
    return null;
  }

  if (isAnimating && gameState.lastTurnPlayback?.turnQueue) {
    const attachment = gameState.lastTurnPlayback.turnQueue;
    return buildTurnQueuePresentation(
      attachment,
      Math.max(0, attachment.nextActorIndexAfterPlayback - 1),
      "active"
    );
  }

  if (!gameState.pendingTurn) {
    return null;
  }

  const initialDiceByActorId: Record<DangoId, number | undefined> = {};
  for (const actorId of gameState.pendingTurn.orderedActorIds) {
    initialDiceByActorId[actorId] =
      gameState.pendingTurn.plansByActorId[actorId]?.initialDiceValue;
  }

  return {
    orderedActorIds: [...gameState.pendingTurn.orderedActorIds],
    initialDiceByActorId,
    activeRacerIndex: gameState.pendingTurn.nextActorIndex,
    state: "active",
  };
}

export function pickResolvedTurnQueuePresentation(
  gameState: GameState
): TurnQueuePresentation | null {
  const attachment = gameState.lastTurnPlayback?.turnQueue;
  if (!attachment) {
    return null;
  }

  return buildTurnQueuePresentation(
    attachment,
    attachment.orderedActorIds.length,
    "resolved"
  );
}
