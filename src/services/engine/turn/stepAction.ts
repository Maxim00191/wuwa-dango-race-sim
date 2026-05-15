import type { EngineExecutionContext } from "@/services/engine/core/executionContext";
import { evaluateAbbyResetScheduling } from "@/services/engine/victory/abby";
import {
  buildTurnQueueAttachment,
  createTurnPlaybackPlan,
} from "@/services/engine/lifecycle/pendingAndPlayback";
import { openNextTurnWithDicePlans } from "@/services/engine/lifecycle/turnOpening";
import { resolveTurnForEntity } from "@/services/engine/turn/resolveEntity";
import { captureHeadlessSkillActivations } from "@/services/engine/headless/telemetry";
import type { DangoId, GameState, PlaybackSegment } from "@/types/game";

export function applyStepAction(
  state: GameState,
  executionContext: EngineExecutionContext
): GameState {
  if (state.phase !== "running" || state.winnerId) {
    return state;
  }

  let activeGameState = state;
  let pendingTurn = state.pendingTurn;
  const openingSegments: PlaybackSegment[] = [];
  let showTurnIntro = false;
  let turnOrderForBanner: DangoId[] | undefined;

  if (!pendingTurn) {
    const openedTurn = openNextTurnWithDicePlans(activeGameState, executionContext);
    activeGameState = openedTurn.state;
    pendingTurn = openedTurn.pendingTurn;
    openingSegments.push(...openedTurn.openingSegments);
    showTurnIntro = true;
    turnOrderForBanner = [...pendingTurn.orderedActorIds];
    const playbackStamp = state.playbackStamp + 1;
    return {
      ...activeGameState,
      pendingTurn,
      playbackStamp,
      lastTurnPlayback: createTurnPlaybackPlan(state, {
        turnIndex: activeGameState.turnIndex,
        segments: openingSegments,
        playbackStamp,
        showTurnIntroBanner: true,
        turnOrderActorIds: turnOrderForBanner,
        turnQueue: buildTurnQueueAttachment(pendingTurn, 0),
      }),
    };
  }

  const actorId = pendingTurn.orderedActorIds[pendingTurn.nextActorIndex];
  if (actorId === undefined) {
    return state;
  }

  const resolvedTurn = resolveTurnForEntity(
    activeGameState,
    actorId,
    executionContext,
    pendingTurn.plansByActorId[actorId],
    pendingTurn.allInitialRollsById,
    pendingTurn.allResolvedRollsById
  );
  activeGameState = resolvedTurn.state;
  const segments = [...openingSegments, ...resolvedTurn.segments];
  const nextActorIndex = pendingTurn.nextActorIndex + 1;
  const playbackStamp = state.playbackStamp + 1;
  const queueAttachment = buildTurnQueueAttachment(pendingTurn, nextActorIndex);

  if (activeGameState.phase === "finished") {
    return {
      ...activeGameState,
      pendingTurn: null,
      playbackStamp,
      lastTurnPlayback: createTurnPlaybackPlan(state, {
        turnIndex: activeGameState.turnIndex,
        segments,
        playbackStamp,
        showTurnIntroBanner: showTurnIntro,
        turnOrderActorIds: turnOrderForBanner,
        turnQueue: queueAttachment,
      }),
    };
  }

  if (nextActorIndex >= pendingTurn.orderedActorIds.length) {
    const preRoundEndState = activeGameState;
    const roundEnded = executionContext.bus.publish("round:end", {
      state: activeGameState,
      orderedActorIds: pendingTurn.orderedActorIds,
      closingSegments: [],
    });
    activeGameState = roundEnded.state;
    if (executionContext.telemetry) {
      captureHeadlessSkillActivations(
        preRoundEndState,
        activeGameState,
        executionContext.telemetry,
        activeGameState.turnIndex
      );
    }
    segments.push(...roundEnded.closingSegments);
    const finalizedGameState = evaluateAbbyResetScheduling({
      ...activeGameState,
      pendingTurn: null,
    });
    return {
      ...finalizedGameState,
      pendingTurn: null,
      playbackStamp,
      lastTurnPlayback: createTurnPlaybackPlan(state, {
        turnIndex: finalizedGameState.turnIndex,
        segments,
        playbackStamp,
        showTurnIntroBanner: showTurnIntro,
        turnOrderActorIds: turnOrderForBanner,
        turnQueue: queueAttachment,
      }),
    };
  }

  return {
    ...activeGameState,
    pendingTurn: {
      ...pendingTurn,
      nextActorIndex,
      openingBannerConsumed: pendingTurn.openingBannerConsumed || showTurnIntro,
    },
    playbackStamp,
    lastTurnPlayback: createTurnPlaybackPlan(state, {
      turnIndex: activeGameState.turnIndex,
      segments,
      playbackStamp,
      showTurnIntroBanner: showTurnIntro,
      turnOrderActorIds: turnOrderForBanner,
      turnQueue: queueAttachment,
    }),
  };
}
