import { FINISH_LINE_CELL_INDEX } from "@/constants/board";
import { ABBY_ID } from "@/constants/ids";
import { CHARACTER_BY_ID } from "@/services/characters";
import { characterParam, text } from "@/i18n";
import {
  clockwiseProgressFromFinishLine,
  isClockwiseTrackCellIndex,
} from "@/services/circular";
import { appendLog } from "@/services/engine/state/mutations";
import {
  applyCellIndexForMembers,
  cloneCellMap,
  findCellIndexForEntity,
  mergeWithAbbyBottomRule,
} from "@/services/stateCells";
import type { GameState } from "@/types/game";

export function evaluateAbbyResetScheduling(state: GameState): GameState {
  const bossCharacter = CHARACTER_BY_ID[ABBY_ID];
  if (
    bossCharacter &&
    state.turnIndex <= bossCharacter.activateAfterTurnIndex
  ) {
    return state;
  }
  const abbyCellIndex = findCellIndexForEntity(state.cells, ABBY_ID);
  if (abbyCellIndex === null) {
    return state;
  }
  const stack = state.cells.get(abbyCellIndex)!;
  const aloneWithAbby =
    stack.length === 1 && stack[0] === ABBY_ID;
  if (!aloneWithAbby) {
    return state;
  }
  const abbyClockwiseProgress =
    clockwiseProgressFromFinishLine(abbyCellIndex);
  let minimumBasicClockwiseProgress = Infinity;
  for (const basicId of state.activeBasicIds) {
    const basicCellIndex = findCellIndexForEntity(state.cells, basicId);
    if (basicCellIndex === null) {
      return state;
    }
    if (!isClockwiseTrackCellIndex(basicCellIndex)) {
      continue;
    }
    const basicClockwiseProgress =
      clockwiseProgressFromFinishLine(basicCellIndex);
    if (basicClockwiseProgress < minimumBasicClockwiseProgress) {
      minimumBasicClockwiseProgress = basicClockwiseProgress;
    }
  }
  if (minimumBasicClockwiseProgress === Infinity) {
    return state;
  }
  const abbyIsCompletelyBehindClockwisePack =
    abbyClockwiseProgress < minimumBasicClockwiseProgress;
  if (!abbyIsCompletelyBehindClockwisePack) {
    return state;
  }
  const nextState = appendLog(state, {
    kind: "abbyResetScheduled",
    message: text("simulation.log.abbyResetScheduled", {
      actor: characterParam(ABBY_ID),
    }),
  });
  return { ...nextState, abbyPendingTeleportToStart: true };
}

export function teleportAbbyToStartLine(state: GameState): GameState {
  const originCellIndex = findCellIndexForEntity(state.cells, ABBY_ID);
  if (originCellIndex === null) {
    return state;
  }
  const stack = state.cells.get(originCellIndex)!;
  const stackWithoutAbby = stack.filter((id) => id !== ABBY_ID);
  const nextCells = cloneCellMap(state.cells);
  if (stackWithoutAbby.length === 0) {
    nextCells.delete(originCellIndex);
  } else {
    nextCells.set(originCellIndex, stackWithoutAbby);
  }
  const destinationCellIndex = FINISH_LINE_CELL_INDEX;
  const existingAtDestination = nextCells.get(destinationCellIndex) ?? [];
  nextCells.set(
    destinationCellIndex,
    mergeWithAbbyBottomRule(existingAtDestination, [ABBY_ID])
  );
  const nextEntities = {
    ...state.entities,
    [ABBY_ID]: {
      ...state.entities[ABBY_ID]!,
      cellIndex: destinationCellIndex,
      raceDisplacement: 0,
    },
  };
  let nextState: GameState = {
    ...state,
    cells: nextCells,
    entities: nextEntities,
    abbyPendingTeleportToStart: false,
  };
  nextState = applyCellIndexForMembers(
    nextState,
    nextCells.get(destinationCellIndex) ?? [],
    destinationCellIndex
  );
  nextState = appendLog(nextState, {
    kind: "abbyTeleport",
    message: text("simulation.log.abbyTeleport", {
      actor: characterParam(ABBY_ID),
    }),
  });
  return nextState;
}
