import { cloneCellMap, cloneEntityMap } from "@/services/stateCells";
import type { EngineExecutionContext } from "@/services/engine/core/executionContext";
import { createInitialGameState } from "@/services/engine/sessionIdle";
import { createRunningSessionFromSetup } from "@/services/engine/session";
import { isValidBasicSelection } from "@/services/engine/selection";
import { applyStepAction } from "@/services/engine/turn/stepAction";
import { applyInstantFullTurn, applyInstantSimulateGame } from "@/services/engine/turn/instantAction";
import type { GameAction, GameState } from "@/types/game";

export function reduceGameState(
  state: GameState,
  action: GameAction,
  executionContext: EngineExecutionContext
): GameState {
  if (action.type === "HYDRATE_ENGINE_STATE") {
    const snapshot = action.snapshot;
    return {
      ...snapshot,
      cells: cloneCellMap(snapshot.cells),
      entities: cloneEntityMap(snapshot.entities),
      pendingTurn: snapshot.pendingTurn
        ? structuredClone(snapshot.pendingTurn)
        : null,
      log: [],
      lastTurnPlayback: null,
      playbackStamp: 0,
    };
  }
  if (action.type === "INITIALIZE") {
    return createInitialGameState();
  }
  if (action.type === "RESET") {
    return createInitialGameState();
  }
  if (action.type === "START") {
    if (state.phase === "running") {
      return state;
    }
    if (!isValidBasicSelection(action.setup.selectedBasicIds)) {
      return state;
    }
    return createRunningSessionFromSetup(action.setup);
  }
  if (action.type === "STEP_ACTION") {
    if (state.phase !== "running") {
      return state;
    }
    if (state.winnerId) {
      return state;
    }
    return applyStepAction(state, executionContext);
  }
  if (action.type === "INSTANT_FULL_TURN") {
    if (state.phase !== "running") {
      return state;
    }
    if (state.winnerId) {
      return state;
    }
    return applyInstantFullTurn(state, executionContext);
  }
  if (action.type === "INSTANT_SIMULATE_GAME") {
    if (state.phase !== "running") {
      return state;
    }
    if (state.winnerId) {
      return state;
    }
    return applyInstantSimulateGame(state, executionContext);
  }
  return state;
}
