import { LAP_DISTANCE_IN_CLOCKWISE_STEPS } from "@/constants/board";
import {
  ABBY_ID,
  ACTIVE_BASIC_DANGO_COUNT,
  SELECTABLE_BASIC_DANGO_IDS,
} from "@/constants/ids";
import { CHARACTER_BY_ID } from "@/services/characters";
import {
  addClockwise,
  addCounterClockwise,
  buildStepLandingCells,
  clockwiseProgressFromFinishLine,
} from "@/services/circular";
import { resolveCellEffectIfPresent } from "@/services/cellEffects";
import {
  applyRaceDisplacementDeltaForMembers,
  cloneCellMap,
  findCellIndexForEntity,
  mergeWithAbbyBottomRule,
  relocateActorLedPortionCellsOnly,
} from "@/services/stateCells";
import type {
  DangoId,
  EntityRuntimeState,
  GameAction,
  GameLogEntry,
  GameState,
  PlaybackSegment,
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

const SELECTABLE_BASIC_ID_SET = new Set<string>(SELECTABLE_BASIC_DANGO_IDS);

export function isValidBasicSelection(ids: DangoId[]): boolean {
  if (ids.length !== ACTIVE_BASIC_DANGO_COUNT) {
    return false;
  }
  const unique = new Set(ids);
  if (unique.size !== ids.length) {
    return false;
  }
  return ids.every((id) => SELECTABLE_BASIC_ID_SET.has(id));
}

function createRunningSessionFromSelection(
  selectedBasicIds: DangoId[]
): GameState {
  const entities: GameState["entities"] = {};
  for (const id of selectedBasicIds) {
    entities[id] = { id, raceDisplacement: 0 };
  }
  entities[ABBY_ID] = { id: ABBY_ID, raceDisplacement: 0 };
  const cells = new Map<number, DangoId[]>([
    [1, [ABBY_ID, ...selectedBasicIds]],
  ]);
  return {
    phase: "running",
    turnIndex: 0,
    cells,
    entityOrder: shuffleOrderStableCopy([...selectedBasicIds, ABBY_ID]),
    entities,
    activeBasicIds: [...selectedBasicIds],
    winnerId: null,
    abbyPendingTeleportToStart: false,
    lastRollById: {},
    log: [],
    lastTurnPlayback: null,
  };
}

export function createInitialGameState(): GameState {
  return {
    phase: "idle",
    turnIndex: 0,
    cells: new Map(),
    entityOrder: [],
    entities: {},
    activeBasicIds: [],
    winnerId: null,
    abbyPendingTeleportToStart: false,
    lastRollById: {},
    log: [],
    lastTurnPlayback: null,
  };
}

function appendLog(state: GameState, entry: GameLogEntry): GameState {
  return { ...state, log: [...state.log, entry] };
}

function applyEntityRuntimePatches(
  entities: GameState["entities"],
  patches: Partial<Record<DangoId, Partial<EntityRuntimeState>>> | undefined
): GameState["entities"] {
  if (!patches) {
    return entities;
  }
  let nextEntities = entities;
  for (const [entityId, patch] of Object.entries(patches)) {
    if (!patch) {
      continue;
    }
    const previous = nextEntities[entityId];
    if (!previous) {
      continue;
    }
    nextEntities = {
      ...nextEntities,
      [entityId]: { ...previous, ...patch },
    };
  }
  return nextEntities;
}

function relocateActorLedPortionBetweenCells(
  state: GameState,
  fromCellIndex: number,
  toCellIndex: number,
  fullStackBottomToTop: string[],
  actorIndexInStack: number,
  clockwiseDisplacementDelta: number
): GameState {
  const movingBottomToTop = fullStackBottomToTop.slice(actorIndexInStack);
  if (movingBottomToTop.length === 0) {
    return state;
  }
  const nextCells = relocateActorLedPortionCellsOnly(
    state.cells,
    fromCellIndex,
    toCellIndex,
    fullStackBottomToTop,
    actorIndexInStack
  );
  if (nextCells === state.cells) {
    return state;
  }
  let nextState: GameState = { ...state, cells: nextCells };
  nextState = applyRaceDisplacementDeltaForMembers(
    nextState,
    movingBottomToTop,
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
    const basicClockwiseProgress =
      clockwiseProgressFromFinishLine(basicCellIndex);
    if (basicClockwiseProgress < minimumBasicClockwiseProgress) {
      minimumBasicClockwiseProgress = basicClockwiseProgress;
    }
  }
  const abbyIsCompletelyBehindClockwisePack =
    abbyClockwiseProgress < minimumBasicClockwiseProgress;
  if (!abbyIsCompletelyBehindClockwisePack) {
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
): { state: GameState; segments: PlaybackSegment[] } {
  const segments: PlaybackSegment[] = [];
  const character = CHARACTER_BY_ID[actingEntityId];
  if (!character) {
    return { state, segments };
  }
  const shouldStandbyBoss =
    character.role === "boss" &&
    state.turnIndex <= character.activateAfterTurnIndex;
  if (shouldStandbyBoss) {
    return {
      state: appendLog(state, {
        kind: "standby",
        message: `${character.displayName} is still on standby.`,
      }),
      segments: [
        {
          kind: "idle",
          actorId: actingEntityId,
          reason: "standby",
        },
      ],
    };
  }
  const diceRollContext = {
    turnIndex: state.turnIndex,
    rollerId: actingEntityId,
  };
  const diceOutcome = character.diceRoll(state, diceRollContext);
  const diceValue = diceOutcome.diceValue;
  let nextState: GameState = {
    ...state,
    lastRollById: { ...state.lastRollById, [actingEntityId]: diceValue },
    entities: applyEntityRuntimePatches(state.entities, diceOutcome.entityPatches),
  };
  nextState = appendLog(nextState, {
    kind: "roll",
    message: `${character.displayName} rolled ${diceValue}.`,
  });
  if (diceOutcome.skillNarrative) {
    nextState = appendLog(nextState, {
      kind: "skillTrigger",
      message: diceOutcome.skillNarrative,
    });
  }
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
    return { state: nextState, segments };
  }
  const activeStack = nextState.cells.get(activeCellIndex)!;
  const actorIndexInStack = activeStack.indexOf(actingEntityId);
  if (actorIndexInStack === -1) {
    return {
      state: appendLog(nextState, {
        kind: "skipNotBottom",
        message: `${character.displayName} could not be placed on the track.`,
      }),
      segments: [
        {
          kind: "idle",
          actorId: actingEntityId,
          reason: "skipNotBottom",
        },
      ],
    };
  }
  const destinationCellIndex =
    character.travelDirection === "clockwise"
      ? addClockwise(activeCellIndex, diceValue)
      : addCounterClockwise(activeCellIndex, diceValue);
  const clockwiseDisplacementDelta =
    character.travelDirection === "clockwise"
      ? diceValue
      : -diceValue;
  if (diceValue > 0) {
    segments.push({
      kind: "hops",
      actorId: actingEntityId,
      travelingIds: activeStack.slice(actorIndexInStack),
      direction: character.travelDirection,
      cellsPath: buildStepLandingCells(
        activeCellIndex,
        diceValue,
        character.travelDirection
      ),
    });
  }
  nextState = relocateActorLedPortionBetweenCells(
    nextState,
    activeCellIndex,
    destinationCellIndex,
    activeStack,
    actorIndexInStack,
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
    return { state: nextState, segments };
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
    segments.push({
      kind: "slide",
      travelingIds: [...refreshedStack],
      direction: character.travelDirection,
      fromCell: destinationStackCellIndex,
      toCell: postEffectCellIndex,
    });
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
      state: {
        ...finished,
        phase: "finished",
        winnerId,
      },
      segments,
    };
  }
  return { state: afterEffectState, segments };
}

function runSingleTurnCore(
  state: GameState,
  boardEffectByCellIndex: Map<number, string | null>
): GameState {
  const playbackSegments: PlaybackSegment[] = [];
  let nextState = state;
  if (nextState.abbyPendingTeleportToStart) {
    const abbyOriginCellIndex = findCellIndexForEntity(nextState.cells, ABBY_ID);
    if (abbyOriginCellIndex !== null) {
      playbackSegments.push({
        kind: "teleport",
        entityIds: [ABBY_ID],
        fromCell: abbyOriginCellIndex,
        toCell: 1,
      });
    }
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
    const resolved = resolveTurnForEntity(
      nextState,
      actorId,
      boardEffectByCellIndex
    );
    nextState = resolved.state;
    playbackSegments.push(...resolved.segments);
    if (nextState.phase === "finished") {
      return {
        ...nextState,
        lastTurnPlayback: {
          turnIndex: nextState.turnIndex,
          segments: playbackSegments,
        },
      };
    }
  }
  nextState = evaluateAbbyResetScheduling(nextState);
  return {
    ...nextState,
    lastTurnPlayback: {
      turnIndex: nextState.turnIndex,
      segments: playbackSegments,
    },
  };
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
    if (!isValidBasicSelection(action.selectedBasicIds)) {
      return state;
    }
    return createRunningSessionFromSelection(action.selectedBasicIds);
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
