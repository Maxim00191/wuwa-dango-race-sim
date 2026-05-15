import type { EngineExecutionContext } from "@/services/engine/core/executionContext";
import { evaluateAbbyResetScheduling } from "@/services/engine/victory/abby";
import { openNextTurnWithDicePlans } from "@/services/engine/lifecycle/turnOpening";
import { resolveTurnForEntity } from "@/services/engine/turn/resolveEntity";
import { captureHeadlessSkillActivations } from "@/services/engine/headless/telemetry";
import { cloneCellMap, cloneEntityMap } from "@/services/stateCells";
import type { GameState } from "@/types/game";

export function applyInstantFullTurn(
  state: GameState,
  executionContext: EngineExecutionContext
): GameState {
  if (state.phase !== "running" || state.winnerId) {
    return state;
  }

  let activeGameState = state;

  if (!activeGameState.pendingTurn) {
    const openedTurn = openNextTurnWithDicePlans(activeGameState, executionContext);
    activeGameState = {
      ...openedTurn.state,
      pendingTurn: openedTurn.pendingTurn,
    };
  }

  while (
    activeGameState.pendingTurn &&
    activeGameState.phase === "running" &&
    !activeGameState.winnerId
  ) {
    const pendingTurn = activeGameState.pendingTurn;
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
    const nextActorIndex = pendingTurn.nextActorIndex + 1;

    if (activeGameState.phase === "finished") {
      return {
        ...activeGameState,
        pendingTurn: null,
        lastTurnPlayback: null,
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
      activeGameState = evaluateAbbyResetScheduling({
        ...activeGameState,
        pendingTurn: null,
      });
      return {
        ...activeGameState,
        pendingTurn: null,
        lastTurnPlayback: null,
      };
    }

    activeGameState = {
      ...activeGameState,
      pendingTurn: {
        ...pendingTurn,
        nextActorIndex,
        openingBannerConsumed: true,
      },
    };
  }

  return activeGameState;
}

export function applyInstantSimulateGame(
  state: GameState,
  executionContext: EngineExecutionContext
): GameState {
  if (state.phase !== "running" || state.winnerId) {
    return state;
  }
  let activeGameState = state;
  while (activeGameState.phase === "running" && !activeGameState.winnerId) {
    activeGameState = applyInstantFullTurn(activeGameState, executionContext);
  }
  if (!activeGameState.lastTurnPlayback) {
    return activeGameState;
  }
  return {
    ...activeGameState,
    lastTurnPlayback: {
      ...activeGameState.lastTurnPlayback,
      presentationMode: "settled",
      settledCells: cloneCellMap(activeGameState.cells),
      settledEntities: cloneEntityMap(activeGameState.entities),
    },
  };
}
