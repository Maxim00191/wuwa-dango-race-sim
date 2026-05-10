import { useCallback, useMemo, useReducer, useState } from "react";
import {
  ACTIVE_BASIC_DANGO_COUNT,
  createDefaultPendingBasicIds,
} from "@/constants/ids";
import {
  buildEffectLookup,
  buildLinearBoardDescriptor,
} from "@/services/boardLayout";
import {
  createInitialGameState,
  isValidBasicSelection,
  reduceGameState,
} from "@/services/gameEngine";
import type { DangoId, GameAction, GameState } from "@/types/game";

const BOARD_EFFECT_BY_CELL_INDEX = buildEffectLookup(
  buildLinearBoardDescriptor()
);

function gameReducer(state: GameState, action: GameAction): GameState {
  return reduceGameState(state, action, BOARD_EFFECT_BY_CELL_INDEX);
}

export function useGame() {
  const initialState = useMemo(() => createInitialGameState(), []);
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [pendingBasicIds, setPendingBasicIds] = useState<DangoId[]>(() =>
    createDefaultPendingBasicIds() as DangoId[]
  );

  const togglePendingBasicId = useCallback((id: DangoId) => {
    setPendingBasicIds((previous) => {
      if (previous.includes(id)) {
        return previous.filter((existing) => existing !== id);
      }
      if (previous.length >= ACTIVE_BASIC_DANGO_COUNT) {
        return previous;
      }
      return [...previous, id];
    });
  }, []);

  const start = useCallback(() => {
    if (!isValidBasicSelection(pendingBasicIds)) {
      return;
    }
    dispatch({ type: "START", selectedBasicIds: pendingBasicIds });
  }, [pendingBasicIds]);

  const runFullTurn = useCallback(() => {
    dispatch({ type: "RUN_FULL_TURN" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
    setPendingBasicIds(createDefaultPendingBasicIds() as DangoId[]);
  }, []);

  return {
    state,
    pendingBasicIds,
    togglePendingBasicId,
    start,
    runFullTurn,
    reset,
    boardEffects: BOARD_EFFECT_BY_CELL_INDEX,
  };
}
