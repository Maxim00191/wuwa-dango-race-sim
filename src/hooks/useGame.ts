import { useCallback, useMemo, useReducer } from "react";
import {
  buildEffectLookup,
  buildLinearBoardDescriptor,
} from "@/services/boardLayout";
import { createInitialGameState, reduceGameState } from "@/services/gameEngine";
import type { GameAction, GameState } from "@/types/game";

const BOARD_EFFECT_BY_CELL_INDEX = buildEffectLookup(
  buildLinearBoardDescriptor()
);

function gameReducer(state: GameState, action: GameAction): GameState {
  return reduceGameState(state, action, BOARD_EFFECT_BY_CELL_INDEX);
}

export function useGame() {
  const initialState = useMemo(() => createInitialGameState(), []);
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const start = useCallback(() => {
    dispatch({ type: "START" });
  }, []);

  const runFullTurn = useCallback(() => {
    dispatch({ type: "RUN_FULL_TURN" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    state,
    start,
    runFullTurn,
    reset,
    boardEffects: BOARD_EFFECT_BY_CELL_INDEX,
  };
}
