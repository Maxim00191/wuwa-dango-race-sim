import { LAP_DISTANCE_IN_CLOCKWISE_STEPS } from "@/constants/board";
import { ABBY_ID, BASIC_DANGO_IDS } from "@/constants/ids";
import { CHARACTER_BY_ID } from "@/services/characters";
import { addClockwise, addCounterClockwise } from "@/services/circular";
import { resolveCellEffectIfPresent } from "@/services/cellEffects";
import {
  applyRaceDisplacementDeltaForMembers,
  cloneCellMap,
  findCellIndexForEntity,
  getBottomEntityId,
  mergeWithAbbyBottomRule,
} from "@/services/stateCells";
import type {
  GameAction,
  GameLogEntry,
  GameState,
  SkillHookContext,
} from "@/types/game";

function shuffleOrderStableCopy(ids: string[]): string[] {
  const copy = [...ids];
  for (let index = copy.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temporary = copy[index];
    copy[index] = copy[swapIndex]!;
    copy[swapIndex] = temporary!;
  }
  return copy;
}

function createInitialEntities(): GameState["entities"] {
  const record: GameState["entities"] = {};
  for (const id of BASIC_DANGO_IDS) {
    record[id] = { id, raceDisplacement: 0 };
  }
  record[ABBY_ID] = { id: ABBY_ID, raceDisplacement: 0 };
  return record;
}

function createStartingCells(): Map<number, string[]> {
  const initialStackBottomToTop = [
    ABBY_ID,
    ...BASIC_DANGO_IDS,
  ];
  return new Map([[1, initialStackBottomToTop]]);
}

export function createInitialGameState(): GameState {
  return {
    phase: "idle",
    turnIndex: 0,
    cells: createStartingCells(),
    entityOrder: [...BASIC_DANGO_IDS, ABBY_ID],
    entities: createInitialEntities(),
    winnerId: null,
    abbyPendingTeleportToStart: false,
    lastRollById: {},
    log: [],
  };
}

function appendLog(state: GameState, entry: GameLogEntry): GameState {
  return { ...state, log: [...state.log, entry] };
}

function relocateStackBetweenCells(
  state: GameState,
  fromCellIndex: number,
  toCellIndex: number,
  stackBottomToTop: string[],
  clockwiseDisplacementDelta: number
): GameState {
  const nextCells = cloneCellMap(state.cells);
  const atSource = nextCells.get(fromCellIndex);
  if (!atSource || atSource.join("|") !== stackBottomToTop.join("|")) {
    return state;
  }
  nextCells.delete(fromCellIndex);
  const existingAtDestination = nextCells.get(toCellIndex) ?? [];
  nextCells.set(
    toCellIndex,
    mergeWithAbbyBottomRule(existingAtDestination, stackBottomToTop)
  );
  let nextState: GameState = { ...state, cells: nextCells };
  nextState = applyRaceDisplacementDeltaForMembers(
    nextState,
    stackBottomToTop,
    clockwiseDisplacementDelta
  );
  return nextState;
}

function pickWinnerBasicDangoId(state: GameState): string | null {
  let bestId: string | null = null;
  let bestDisplacement = -Infinity;
  for (const [, stackBottomToTop] of state.cells.entries()) {
    const topId = stackBottomToTop[stackBottomToTop.length - 1]!;
    if (topId === ABBY_ID) {
      continue;
    }
    const displacement = state.entities[topId]!.raceDisplacement;
    if (displacement < LAP_DISTANCE_IN_CLOCKWISE_STEPS) {
      continue;
    }
    if (displacement > bestDisplacement) {
      bestDisplacement = displacement;
      bestId = topId;
    }
  }
  return bestId;
}

function evaluateAbbyResetScheduling(state: GameState): GameState {
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
  const abbyDisplacement = state.entities[ABBY_ID]!.raceDisplacement;
  const behindEveryBasic = BASIC_DANGO_IDS.every(
    (id) => state.entities[id]!.raceDisplacement > abbyDisplacement
  );
  if (!behindEveryBasic) {
    return state;
  }
  const nextState = appendLog(state, {
    kind: "abbyResetScheduled",
    message:
      "Abby is alone on a cell and behind every racer; next turn Abby returns to the start.",
  });
  return { ...nextState, abbyPendingTeleportToStart: true };
}

function teleportAbbyToStartLine(state: GameState): GameState {
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
  const destinationCellIndex = 1;
  const existingAtDestination = nextCells.get(destinationCellIndex) ?? [];
  nextCells.set(
    destinationCellIndex,
    mergeWithAbbyBottomRule(existingAtDestination, [ABBY_ID])
  );
  const nextEntities = {
    ...state.entities,
    [ABBY_ID]: { ...state.entities[ABBY_ID]!, raceDisplacement: 0 },
  };
  let nextState: GameState = {
    ...state,
    cells: nextCells,
    entities: nextEntities,
    abbyPendingTeleportToStart: false,
  };
  nextState = appendLog(nextState, {
    kind: "abbyTeleport",
    message: "Abby was sent back to the start line.",
  });
  return nextState;
}

function applySkillHookAfterDice(
  state: GameState,
  context: SkillHookContext
): GameState {
  const character = CHARACTER_BY_ID[context.rollerId];
  if (!character) {
    return state;
  }
  const handler = character.skillHooks.afterDiceRoll;
  if (!handler) {
    return state;
  }
  return handler(state, context);
}

function applySkillHookAfterMovement(
  state: GameState,
  context: SkillHookContext
): GameState {
  const character = CHARACTER_BY_ID[context.rollerId];
  if (!character) {
    return state;
  }
  const handler = character.skillHooks.afterMovement;
  if (!handler) {
    return state;
  }
  return handler(state, context);
}

function resolveTurnForEntity(
  state: GameState,
  actingEntityId: string,
  boardEffectByCellIndex: Map<number, string | null>
): GameState {
  const character = CHARACTER_BY_ID[actingEntityId];
  if (!character) {
    return state;
  }
  const shouldStandbyBoss =
    character.role === "boss" &&
    state.turnIndex <= character.activateAfterTurnIndex;
  if (shouldStandbyBoss) {
    return appendLog(state, {
      kind: "standby",
      message: `${character.displayName} is still on standby.`,
    });
  }
  const diceValue = character.diceRoll({
    turnIndex: state.turnIndex,
    rollerId: actingEntityId,
  });
  let nextState: GameState = {
    ...state,
    lastRollById: { ...state.lastRollById, [actingEntityId]: diceValue },
  };
  nextState = appendLog(nextState, {
    kind: "roll",
    message: `${character.displayName} rolled ${diceValue}.`,
  });
  const diceContext: SkillHookContext = {
    turnIndex: state.turnIndex,
    rollerId: actingEntityId,
    diceValue,
    cellIndex:
      findCellIndexForEntity(nextState.cells, actingEntityId) ?? 1,
  };
  nextState = applySkillHookAfterDice(nextState, diceContext);
  const activeCellIndex = findCellIndexForEntity(nextState.cells, actingEntityId);
  if (activeCellIndex === null) {
    return nextState;
  }
  const activeStack = nextState.cells.get(activeCellIndex)!;
  const bottomId = getBottomEntityId(activeStack);
  if (bottomId !== actingEntityId) {
    return appendLog(nextState, {
      kind: "skipNotBottom",
      message: `${character.displayName} is not at the bottom of a stack and cannot pull the stack.`,
    });
  }
  const destinationCellIndex =
    character.travelDirection === "clockwise"
      ? addClockwise(activeCellIndex, diceValue)
      : addCounterClockwise(activeCellIndex, diceValue);
  const clockwiseDisplacementDelta =
    character.travelDirection === "clockwise"
      ? diceValue
      : -diceValue;
  nextState = relocateStackBetweenCells(
    nextState,
    activeCellIndex,
    destinationCellIndex,
    activeStack,
    clockwiseDisplacementDelta
  );
  nextState = appendLog(nextState, {
    kind: "move",
    message: `${character.displayName} moved ${diceValue} steps ${character.travelDirection}.`,
  });
  const destinationStackCellIndex = findCellIndexForEntity(
    nextState.cells,
    actingEntityId
  );
  if (destinationStackCellIndex === null) {
    return nextState;
  }
  const destinationStack =
    nextState.cells.get(destinationStackCellIndex) ?? [];
  const movementContext: SkillHookContext = {
    turnIndex: state.turnIndex,
    rollerId: actingEntityId,
    diceValue,
    cellIndex: destinationStackCellIndex,
  };
  nextState = applySkillHookAfterMovement(nextState, movementContext);
  const refreshedStack =
    nextState.cells.get(destinationStackCellIndex) ?? destinationStack;
  let afterEffectState = resolveCellEffectIfPresent(
    nextState,
    boardEffectByCellIndex,
    {
      turnIndex: state.turnIndex,
      moverId: actingEntityId,
      destinationCellIndex: destinationStackCellIndex,
      stackBottomToTop: refreshedStack,
      moverTravelDirection: character.travelDirection,
    }
  );
  const postEffectCellIndex = findCellIndexForEntity(
    afterEffectState.cells,
    actingEntityId
  );
  if (
    postEffectCellIndex !== null &&
    postEffectCellIndex !== destinationStackCellIndex
  ) {
    afterEffectState = appendLog(afterEffectState, {
      kind: "cellEffect",
      message: "A special cell shifted the stack farther along the track.",
    });
  } else if (boardEffectByCellIndex.get(destinationStackCellIndex)) {
    afterEffectState = appendLog(afterEffectState, {
      kind: "cellEffect",
      message: "A special cell reacted to the stack.",
    });
  }
  const winnerId = pickWinnerBasicDangoId(afterEffectState);
  if (winnerId) {
    const winnerDisplay = CHARACTER_BY_ID[winnerId]?.displayName ?? winnerId;
    const finished = appendLog(afterEffectState, {
      kind: "win",
      message: `${winnerDisplay} finished a lap and won the scramble.`,
    });
    return {
      ...finished,
      phase: "finished",
      winnerId,
    };
  }
  return afterEffectState;
}

function runSingleTurnCore(
  state: GameState,
  boardEffectByCellIndex: Map<number, string | null>
): GameState {
  let nextState = state;
  if (nextState.abbyPendingTeleportToStart) {
    nextState = teleportAbbyToStartLine(nextState);
  }
  nextState = {
    ...nextState,
    turnIndex: nextState.turnIndex + 1,
  };
  nextState = appendLog(nextState, {
    kind: "turnHeader",
    message: `Turn ${nextState.turnIndex} begins.`,
  });
  const orderedActors = shuffleOrderStableCopy(nextState.entityOrder);
  for (const actorId of orderedActors) {
    nextState = resolveTurnForEntity(
      nextState,
      actorId,
      boardEffectByCellIndex
    );
    if (nextState.phase === "finished") {
      return nextState;
    }
  }
  nextState = evaluateAbbyResetScheduling(nextState);
  return nextState;
}

export function reduceGameState(
  state: GameState,
  action: GameAction,
  boardEffectByCellIndex: Map<number, string | null>
): GameState {
  if (action.type === "INITIALIZE") {
    return createInitialGameState();
  }
  if (action.type === "RESET") {
    return createInitialGameState();
  }
  if (action.type === "START") {
    if (state.phase !== "idle") {
      return state;
    }
    const seeded = {
      ...state,
      phase: "running" as const,
      entityOrder: shuffleOrderStableCopy(state.entityOrder),
      log: [],
    };
    return seeded;
  }
  if (action.type === "RUN_FULL_TURN") {
    if (state.phase !== "running") {
      return state;
    }
    if (state.winnerId) {
      return state;
    }
    return runSingleTurnCore(state, boardEffectByCellIndex);
  }
  return state;
}
