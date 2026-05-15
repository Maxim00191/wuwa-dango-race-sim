import { characterParam, text } from "@/i18n";
import { appendLog } from "@/services/engine/state/mutations";
import { pickWinnerBasicDangoId } from "@/services/engine/victory/winner";
import type { DangoId, GameState, PlaybackSegment } from "@/types/game";

export function finalizeWinningTurn(
  state: GameState,
  winnerId: DangoId,
  segments: PlaybackSegment[]
): { state: GameState; segments: PlaybackSegment[] } {
  const finished = appendLog(state, {
    kind: "win",
    message: text("simulation.log.win", {
      winner: characterParam(winnerId),
    }),
  });
  return {
    state: {
      ...finished,
      phase: "finished",
      winnerId,
    },
    segments: [...segments, { kind: "victory", winnerId }],
  };
}

export function finalizeTurnIfWinnerResolved(
  state: GameState,
  segments: PlaybackSegment[]
): { state: GameState; segments: PlaybackSegment[] } {
  if (state.phase === "finished" && state.winnerId) {
    return { state, segments };
  }
  const winnerId = pickWinnerBasicDangoId(state);
  if (!winnerId) {
    return { state, segments };
  }
  return finalizeWinningTurn(state, winnerId, segments);
}

export function clearCompletedDelayedTurnState(
  state: GameState,
  actorId: DangoId
): GameState {
  const actor = state.entities[actorId];
  if (!actor?.skillState.augustaServingDelayedTurn) {
    return state;
  }
  return {
    ...state,
    entities: {
      ...state.entities,
      [actorId]: {
        ...actor,
        skillState: {
          ...actor.skillState,
          augustaServingDelayedTurn: false,
        },
      },
    },
  };
}

export function finalizeActorTurnResolution(
  state: GameState,
  actorId: DangoId,
  segments: PlaybackSegment[]
): { state: GameState; segments: PlaybackSegment[] } {
  return finalizeTurnIfWinnerResolved(
    clearCompletedDelayedTurnState(state, actorId),
    segments
  );
}
