import {
  FINISH_LINE_CELL_INDEX,
  LAP_DISTANCE_IN_CLOCKWISE_STEPS,
} from "@/constants/board";
import {
  ABBY_ID,
  ACTIVE_BASIC_DANGO_COUNT,
  SELECTABLE_BASIC_DANGO_IDS,
} from "@/constants/ids";
import { CHARACTER_BY_ID } from "@/services/characters";
import { characterParam, directionParam, text, type LocalizedText } from "@/i18n";
import {
  addClockwise,
  addCounterClockwise,
  clockwiseProgressFromFinishLine,
} from "@/services/circular";
import {
  CELL_EFFECT_LOG_KEY_BY_ID,
  resolveCellEffectIfPresent,
} from "@/services/cellEffects";
import { orderedRacerIdsForLeaderboard } from "@/services/racerRanking";
import {
  createNormalRaceSetup,
  createTournamentFinalRaceSetup,
  createTournamentPreliminaryRaceSetup,
  deriveBasicPlacementsFromRace,
} from "@/services/raceSetup";
import {
  applyCellIndexForMembers,
  applyMovementDeltaForMembers,
  cloneCellMap,
  cloneEntityMap,
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
  PendingTurnResolution,
  PlaybackSegment,
  RaceSetup,
  SkillHookContext,
  TurnPlaybackPlan,
  TravelDirection,
  TurnQueueAttachment,
  TurnRollPlan,
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

function createRunningSessionFromSetup(setup: RaceSetup): GameState {
  const entities: GameState["entities"] = {};
  for (const id of setup.selectedBasicIds) {
    entities[id] = {
      id,
      cellIndex: FINISH_LINE_CELL_INDEX,
      raceDisplacement: 0,
    };
  }
  entities[ABBY_ID] = {
    id: ABBY_ID,
    cellIndex: FINISH_LINE_CELL_INDEX,
    raceDisplacement: 0,
  };
  const cells = new Map<number, DangoId[]>();
  for (const { cellIndex, stackBottomToTop } of setup.startingStacks) {
    cells.set(cellIndex, [...stackBottomToTop]);
    for (const entityId of stackBottomToTop) {
      const runtime = entities[entityId];
      if (!runtime) {
        continue;
      }
      entities[entityId] = {
        ...runtime,
        cellIndex,
      };
    }
  }
  return {
    phase: "running",
    mode: setup.mode,
    label: setup.label,
    shortLabel: setup.shortLabel,
    turnIndex: 0,
    cells,
    entityOrder: shuffleOrderStableCopy([...setup.selectedBasicIds, ABBY_ID]),
    entities,
    activeBasicIds: [...setup.selectedBasicIds],
    winnerId: null,
    abbyPendingTeleportToStart: false,
    lastRollById: {},
    log: [],
    lastTurnPlayback: null,
    pendingTurn: null,
    playbackStamp: 0,
  };
}

export function createInitialGameState(): GameState {
  return {
    phase: "idle",
    mode: null,
    label: null,
    shortLabel: null,
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
    pendingTurn: null,
    playbackStamp: 0,
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
  nextState = applyMovementDeltaForMembers(
    nextState,
    movingBottomToTop,
    clockwiseDisplacementDelta,
    toCellIndex
  );
  nextState = applyCellIndexForMembers(
    nextState,
    nextCells.get(toCellIndex) ?? [],
    toCellIndex
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
    message: text("simulation.log.abbyResetScheduled", {
      actor: characterParam(ABBY_ID),
    }),
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

function resolveMovementDiceValue(
  state: GameState,
  plan: TurnRollPlan,
  allInitialRollsById: Record<DangoId, number | undefined>,
  allResolvedRollsById: Record<DangoId, number | undefined>
): {
  diceValue: number;
  entityPatches?: Partial<Record<DangoId, Partial<EntityRuntimeState>>>;
  skillNarrative?: LocalizedText;
} {
  const character = CHARACTER_BY_ID[plan.actorId];
  const handler = character?.skillHooks.resolveMovement;
  if (!handler) {
    return { diceValue: plan.diceValue };
  }
  const resolved = handler(state, {
    turnIndex: state.turnIndex,
    rollerId: plan.actorId,
    initialDiceValue: plan.initialDiceValue,
    diceValue: plan.diceValue,
    allInitialRolls: Object.values(allInitialRollsById).filter(
      (roll): roll is number => roll !== undefined
    ),
    allInitialRollsById,
    allResolvedRollsById,
  });
  const resolvedSteps =
    typeof resolved.diceValue === "number" && Number.isFinite(resolved.diceValue)
      ? resolved.diceValue
      : plan.diceValue;
  return { ...resolved, diceValue: resolvedSteps };
}

function applyMovementStepHooksForTravelGroup(
  state: GameState,
  baseContext: {
    turnIndex: number;
    diceValue: number;
    stepNumber: number;
    remainingSteps: number;
    fromCellIndex: number;
    toCellIndex: number;
    travelingIds: DangoId[];
    travelDirection: TravelDirection;
  }
): {
  state: GameState;
  segments: PlaybackSegment[];
  skillNarratives: LocalizedText[];
} {
  let nextState = state;
  const segments: PlaybackSegment[] = [];
  const skillNarratives: LocalizedText[] = [];
  for (const subjectId of baseContext.travelingIds) {
    const handler = CHARACTER_BY_ID[subjectId]?.skillHooks.afterMovementStep;
    if (!handler) {
      continue;
    }
    const result = handler(nextState, {
      ...baseContext,
      rollerId: subjectId,
      rankedRacerIds: orderedRacerIdsForLeaderboard(nextState),
    });
    nextState = result.state;
    segments.push(...(result.segments ?? []));
    if (result.skillNarrative) {
      skillNarratives.push(result.skillNarrative);
    }
  }
  return { state: nextState, segments, skillNarratives };
}

function pushHopSegment(
  segments: PlaybackSegment[],
  actorId: DangoId,
  travelingIds: DangoId[],
  direction: TravelDirection,
  toCellIndex: number
): void {
  const previous = segments[segments.length - 1];
  if (
    previous?.kind === "hops" &&
    previous.actorId === actorId &&
    previous.direction === direction &&
    previous.travelingIds.join("|") === travelingIds.join("|")
  ) {
    previous.cellsPath.push(toCellIndex);
    return;
  }
  segments.push({
    kind: "hops",
    actorId,
    travelingIds,
    direction,
    cellsPath: [toCellIndex],
  });
}

function executeStepwiseMovement(
  state: GameState,
  actingEntityId: DangoId,
  diceValue: number,
  travelDirection: TravelDirection
): { state: GameState; segments: PlaybackSegment[] } {
  const segments: PlaybackSegment[] = [];
  let nextState = state;
  if (diceValue === 0) {
    const restingCellIndex = findCellIndexForEntity(nextState.cells, actingEntityId);
    const restingStack =
      restingCellIndex === null ? [] : nextState.cells.get(restingCellIndex) ?? [];
    const actorIndexInStack = restingStack.indexOf(actingEntityId);
    segments.push({
      kind: "hops",
      actorId: actingEntityId,
      travelingIds:
        actorIndexInStack === -1 ? [actingEntityId] : restingStack.slice(actorIndexInStack),
      direction: travelDirection,
      cellsPath: [],
    });
    return { state: nextState, segments };
  }
  for (let stepNumber = 1; stepNumber <= diceValue; stepNumber++) {
    const fromCellIndex = findCellIndexForEntity(nextState.cells, actingEntityId);
    if (fromCellIndex === null) {
      return { state: nextState, segments };
    }
    const activeStack = nextState.cells.get(fromCellIndex)!;
    const actorIndexInStack = activeStack.indexOf(actingEntityId);
    if (actorIndexInStack === -1) {
      return { state: nextState, segments };
    }
    const travelingIds = activeStack.slice(actorIndexInStack);
    const toCellIndex =
      travelDirection === "clockwise"
        ? addClockwise(fromCellIndex, 1)
        : addCounterClockwise(fromCellIndex, 1);
    const clockwiseDisplacementDelta = travelDirection === "clockwise" ? 1 : -1;
    nextState = relocateActorLedPortionBetweenCells(
      nextState,
      fromCellIndex,
      toCellIndex,
      activeStack,
      actorIndexInStack,
      clockwiseDisplacementDelta
    );
    pushHopSegment(
      segments,
      actingEntityId,
      travelingIds,
      travelDirection,
      toCellIndex
    );
    const hookOutcome = applyMovementStepHooksForTravelGroup(nextState, {
      turnIndex: nextState.turnIndex,
      diceValue,
      stepNumber,
      remainingSteps: diceValue - stepNumber,
      fromCellIndex,
      toCellIndex,
      travelingIds,
      travelDirection,
    });
    nextState = hookOutcome.state;
    for (const narrative of hookOutcome.skillNarratives) {
      nextState = appendLog(nextState, {
        kind: "skillTrigger",
        message: narrative,
      });
    }
    segments.push(...hookOutcome.segments);
  }
  return { state: nextState, segments };
}

function createTurnRollPlans(
  state: GameState,
  orderedActors: DangoId[]
): {
  plansByActorId: Record<DangoId, TurnRollPlan | undefined>;
  allInitialRollsById: Record<DangoId, number | undefined>;
  allResolvedRollsById: Record<DangoId, number | undefined>;
} {
  const plansByActorId: Record<DangoId, TurnRollPlan | undefined> = {};
  const allInitialRollsById: Record<DangoId, number | undefined> = {};
  const allResolvedRollsById: Record<DangoId, number | undefined> = {};
  for (const actorId of orderedActors) {
    const character = CHARACTER_BY_ID[actorId];
    if (!character) {
      continue;
    }
    const shouldStandbyBoss =
      character.role === "boss" &&
      state.turnIndex <= character.activateAfterTurnIndex;
    if (shouldStandbyBoss) {
      continue;
    }
    const diceOutcome = character.diceRoll(state, {
      turnIndex: state.turnIndex,
      rollerId: actorId,
    });
    const initialDiceValue = diceOutcome.initialDiceValue ?? diceOutcome.diceValue;
    plansByActorId[actorId] = {
      actorId,
      diceValue: diceOutcome.diceValue,
      initialDiceValue,
      entityPatches: diceOutcome.entityPatches,
      skillNarrative: diceOutcome.skillNarrative,
    };
    allInitialRollsById[actorId] = initialDiceValue;
    allResolvedRollsById[actorId] = diceOutcome.diceValue;
  }
  return { plansByActorId, allInitialRollsById, allResolvedRollsById };
}

function resolveTurnForEntity(
  state: GameState,
  actingEntityId: string,
  boardEffectByCellIndex: Map<number, string | null>,
  plan: TurnRollPlan | undefined,
  allInitialRollsById: Record<DangoId, number | undefined>,
  allResolvedRollsById: Record<DangoId, number | undefined>
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
        message: text("simulation.log.standby", {
          actor: characterParam(actingEntityId),
        }),
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
  if (!plan) {
    return { state, segments };
  }
  const movementOutcome = resolveMovementDiceValue(
    state,
    plan,
    allInitialRollsById,
    allResolvedRollsById
  );
  const resolvedMovementStepCount = movementOutcome.diceValue;
  let nextState: GameState = {
    ...state,
    lastRollById: {
      ...state.lastRollById,
      [actingEntityId]: plan.initialDiceValue,
    },
    entities: applyEntityRuntimePatches(
      applyEntityRuntimePatches(state.entities, plan.entityPatches),
      movementOutcome.entityPatches
    ),
  };
  nextState = appendLog(nextState, {
    kind: "roll",
    message: text("simulation.log.roll", {
      actor: characterParam(actingEntityId),
      value: plan.initialDiceValue,
    }),
  });
  for (const narrative of [plan.skillNarrative, movementOutcome.skillNarrative]) {
    if (!narrative) {
      continue;
    }
    nextState = appendLog(nextState, {
      kind: "skillTrigger",
      message: narrative,
    });
  }
  const diceContext: SkillHookContext = {
    turnIndex: state.turnIndex,
    rollerId: actingEntityId,
    diceValue: resolvedMovementStepCount,
    cellIndex:
      findCellIndexForEntity(nextState.cells, actingEntityId) ??
        FINISH_LINE_CELL_INDEX,
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
        message: text("simulation.log.skipNotBottom", {
          actor: characterParam(actingEntityId),
        }),
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
  const movementResult = executeStepwiseMovement(
    nextState,
    actingEntityId,
    resolvedMovementStepCount,
    character.travelDirection
  );
  nextState = movementResult.state;
  segments.push(...movementResult.segments);
  nextState = appendLog(nextState, {
    kind: "move",
    message: text("simulation.log.move", {
      actor: characterParam(actingEntityId),
      steps: resolvedMovementStepCount,
      direction: directionParam(character.travelDirection),
    }),
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
    diceValue: resolvedMovementStepCount,
    cellIndex: destinationStackCellIndex,
  };
  nextState = applySkillHookAfterMovement(nextState, movementContext);
  const refreshedStack =
    nextState.cells.get(destinationStackCellIndex) ?? destinationStack;
  const shouldResolveCellEffect = resolvedMovementStepCount > 0;
  const effectOutcome = shouldResolveCellEffect
    ? resolveCellEffectIfPresent(nextState, boardEffectByCellIndex, {
        turnIndex: state.turnIndex,
        moverId: actingEntityId,
        destinationCellIndex: destinationStackCellIndex,
        stackBottomToTop: refreshedStack,
        moverTravelDirection: character.travelDirection,
      })
    : null;
  let afterEffectState = effectOutcome?.state ?? nextState;
  if (effectOutcome?.shift) {
    segments.push({
      kind: "slide",
      travelingIds: effectOutcome.shift.travelingIds,
      direction: effectOutcome.shift.direction,
      fromCell: effectOutcome.shift.fromCell,
      toCell: effectOutcome.shift.toCell,
    });
    afterEffectState = appendLog(afterEffectState, {
      kind: "cellEffect",
      message: text(CELL_EFFECT_LOG_KEY_BY_ID[effectOutcome.effectId]),
    });
  } else if (effectOutcome) {
    afterEffectState = appendLog(afterEffectState, {
      kind: "cellEffect",
      message: text(CELL_EFFECT_LOG_KEY_BY_ID[effectOutcome.effectId]),
    });
  }
  const winnerId = pickWinnerBasicDangoId(afterEffectState);
  if (winnerId) {
    const finished = appendLog(afterEffectState, {
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
      segments,
    };
  }
  return { state: afterEffectState, segments };
}

function buildPendingTurnResolution(
  orderedActors: DangoId[],
  plansByActorId: Record<DangoId, TurnRollPlan | undefined>,
  allInitialRollsById: Record<DangoId, number | undefined>,
  allResolvedRollsById: Record<DangoId, number | undefined>
): PendingTurnResolution {
  return {
    orderedActorIds: orderedActors,
    plansByActorId,
    allInitialRollsById,
    allResolvedRollsById,
    nextActorIndex: 0,
    openingBannerConsumed: false,
  };
}

function buildTurnQueueAttachment(
  pending: PendingTurnResolution,
  nextActorIndexAfterPlayback: number
): TurnQueueAttachment {
  const initialDiceByActorId: Record<DangoId, number | undefined> = {};
  for (const actorId of pending.orderedActorIds) {
    initialDiceByActorId[actorId] =
      pending.plansByActorId[actorId]?.initialDiceValue;
  }
  return {
    orderedActorIds: [...pending.orderedActorIds],
    initialDiceByActorId,
    nextActorIndexAfterPlayback,
  };
}

function createTurnPlaybackPlan(
  sourceState: GameState,
  options: {
    turnIndex: number;
    segments: PlaybackSegment[];
    playbackStamp: number;
    showTurnIntroBanner: boolean;
    turnOrderActorIds?: DangoId[];
    turnQueue?: TurnQueueAttachment;
    presentationMode?: TurnPlaybackPlan["presentationMode"];
  }
): TurnPlaybackPlan {
  return {
    turnIndex: options.turnIndex,
    segments: options.segments,
    playbackStamp: options.playbackStamp,
    sourceCells: cloneCellMap(sourceState.cells),
    sourceEntities: cloneEntityMap(sourceState.entities),
    sourceLogLength: sourceState.log.length,
    presentationMode: options.presentationMode ?? "animated",
    showTurnIntroBanner: options.showTurnIntroBanner,
    turnOrderActorIds: options.turnOrderActorIds,
    turnQueue: options.turnQueue,
  };
}

function openNextTurnWithDicePlans(state: GameState): {
  state: GameState;
  pendingTurn: PendingTurnResolution;
  openingSegments: PlaybackSegment[];
} {
  let nextState = state;
  const openingSegments: PlaybackSegment[] = [];
  if (nextState.abbyPendingTeleportToStart) {
    const abbyOriginCellIndex = findCellIndexForEntity(nextState.cells, ABBY_ID);
    if (abbyOriginCellIndex !== null) {
      openingSegments.push({
        kind: "teleport",
        entityIds: [ABBY_ID],
        fromCell: abbyOriginCellIndex,
        toCell: FINISH_LINE_CELL_INDEX,
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
    message: text("simulation.log.turnHeader", {
      turn: nextState.turnIndex,
    }),
  });
  const orderedActors = shuffleOrderStableCopy(nextState.entityOrder);
  const { plansByActorId, allInitialRollsById, allResolvedRollsById } =
    createTurnRollPlans(nextState, orderedActors);
  const pendingTurn = buildPendingTurnResolution(
    orderedActors,
    plansByActorId,
    allInitialRollsById,
    allResolvedRollsById
  );
  return { state: nextState, pendingTurn, openingSegments };
}

function applyStepAction(
  state: GameState,
  boardEffectByCellIndex: Map<number, string | null>
): GameState {
  if (state.phase !== "running" || state.winnerId) {
    return state;
  }

  let working = state;
  let pending = state.pendingTurn;
  const openingSegments: PlaybackSegment[] = [];
  let showTurnIntro = false;
  let turnOrderForBanner: DangoId[] | undefined;

  if (!pending) {
    const opened = openNextTurnWithDicePlans(working);
    working = opened.state;
    pending = opened.pendingTurn;
    openingSegments.push(...opened.openingSegments);
    showTurnIntro = true;
    turnOrderForBanner = [...pending.orderedActorIds];
  }

  const actorId = pending.orderedActorIds[pending.nextActorIndex];
  if (actorId === undefined) {
    return state;
  }

  const resolved = resolveTurnForEntity(
    working,
    actorId,
    boardEffectByCellIndex,
    pending.plansByActorId[actorId],
    pending.allInitialRollsById,
    pending.allResolvedRollsById
  );
  working = resolved.state;
  const segments = [...openingSegments, ...resolved.segments];
  const nextIndex = pending.nextActorIndex + 1;
  const playbackStamp = state.playbackStamp + 1;

  const queueAttachment = buildTurnQueueAttachment(pending, nextIndex);

  if (working.phase === "finished") {
    return {
      ...working,
      pendingTurn: null,
      playbackStamp,
      lastTurnPlayback: createTurnPlaybackPlan(state, {
        turnIndex: working.turnIndex,
        segments,
        playbackStamp,
        showTurnIntroBanner: showTurnIntro,
        turnOrderActorIds: turnOrderForBanner,
        turnQueue: queueAttachment,
      }),
    };
  }

  if (nextIndex >= pending.orderedActorIds.length) {
    const finalized = evaluateAbbyResetScheduling({
      ...working,
      pendingTurn: null,
    });
    return {
      ...finalized,
      pendingTurn: null,
      playbackStamp,
      lastTurnPlayback: createTurnPlaybackPlan(state, {
        turnIndex: finalized.turnIndex,
        segments,
        playbackStamp,
        showTurnIntroBanner: showTurnIntro,
        turnOrderActorIds: turnOrderForBanner,
        turnQueue: queueAttachment,
      }),
    };
  }

  return {
    ...working,
    pendingTurn: {
      ...pending,
      nextActorIndex: nextIndex,
      openingBannerConsumed: pending.openingBannerConsumed || showTurnIntro,
    },
    playbackStamp,
    lastTurnPlayback: createTurnPlaybackPlan(state, {
      turnIndex: working.turnIndex,
      segments,
      playbackStamp,
      showTurnIntroBanner: showTurnIntro,
      turnOrderActorIds: turnOrderForBanner,
      turnQueue: queueAttachment,
    }),
  };
}

function applyInstantFullTurn(
  state: GameState,
  boardEffectByCellIndex: Map<number, string | null>
): GameState {
  if (state.phase !== "running" || state.winnerId) {
    return state;
  }

  let working = state;

  if (!working.pendingTurn) {
    const opened = openNextTurnWithDicePlans(working);
    working = { ...opened.state, pendingTurn: opened.pendingTurn };
  }

  while (working.pendingTurn && working.phase === "running" && !working.winnerId) {
    const p = working.pendingTurn;
    const actorId = p.orderedActorIds[p.nextActorIndex];
    if (actorId === undefined) {
      return state;
    }
    const resolved = resolveTurnForEntity(
      working,
      actorId,
      boardEffectByCellIndex,
      p.plansByActorId[actorId],
      p.allInitialRollsById,
      p.allResolvedRollsById
    );
    working = resolved.state;
    const nextIdx = p.nextActorIndex + 1;

    if (working.phase === "finished") {
      return {
        ...working,
        pendingTurn: null,
        lastTurnPlayback: null,
      };
    }

    if (nextIdx >= p.orderedActorIds.length) {
      working = evaluateAbbyResetScheduling({
        ...working,
        pendingTurn: null,
      });
      return {
        ...working,
        pendingTurn: null,
        lastTurnPlayback: null,
      };
    }

    working = {
      ...working,
      pendingTurn: {
        ...p,
        nextActorIndex: nextIdx,
        openingBannerConsumed: true,
      },
    };
  }

  return working;
}

function applyInstantSimulateGame(
  state: GameState,
  boardEffectByCellIndex: Map<number, string | null>
): GameState {
  if (state.phase !== "running" || state.winnerId) {
    return state;
  }
  let working = state;
  while (working.phase === "running" && !working.winnerId) {
    working = applyStepAction(working, boardEffectByCellIndex);
  }
  if (!working.lastTurnPlayback) {
    return working;
  }
  return {
    ...working,
    lastTurnPlayback: {
      ...working.lastTurnPlayback,
      presentationMode: "settled",
      settledCells: cloneCellMap(working.cells),
      settledEntities: cloneEntityMap(working.entities),
    },
  };
}

export type HeadlessSimulationScenario =
  | {
      kind: "singleRace";
      setup: RaceSetup;
    }
  | {
      kind: "tournament";
      selectedBasicIds: DangoId[];
    };

export type HeadlessSimulationOutcome = {
  scenarioKind: HeadlessSimulationScenario["kind"];
  winnerBasicId: DangoId | null;
  turnsAtFinish: number;
  preliminaryTurnsAtFinish: number;
  finalTurnsAtFinish: number;
  preliminaryWinnerBasicId: DangoId | null;
  finalPlacements: DangoId[];
  preliminaryPlacements: DangoId[] | null;
  stackCarrierObservationCountByBasicId: Record<string, number>;
};

function tallyBasicStackTopsAcrossCells(
  state: GameState,
  tallies: Record<string, number>
): void {
  for (const [, stackBottomToTop] of state.cells) {
    const topId = stackBottomToTop[stackBottomToTop.length - 1];
    if (!topId || topId === ABBY_ID) {
      continue;
    }
    tallies[topId] = (tallies[topId] ?? 0) + 1;
  }
}

type HeadlessRaceResult = {
  state: GameState;
  stackCarrierObservationCountByBasicId: Record<string, number>;
};

function simulateHeadlessRace(
  setup: RaceSetup,
  boardEffectByCellIndex: Map<number, string | null>
): HeadlessRaceResult {
  let working = createRunningSessionFromSetup(setup);
  const stackCarrierObservationCountByBasicId: Record<string, number> = {};
  while (working.phase === "running" && !working.winnerId) {
    working = applyInstantFullTurn(working, boardEffectByCellIndex);
    tallyBasicStackTopsAcrossCells(working, stackCarrierObservationCountByBasicId);
  }
  return {
    state: working,
    stackCarrierObservationCountByBasicId,
  };
}

function mergeTallies(
  source: Record<string, number>,
  target: Record<string, number>
): Record<string, number> {
  const merged = { ...target };
  for (const [basicId, observationCount] of Object.entries(source)) {
    merged[basicId] = (merged[basicId] ?? 0) + observationCount;
  }
  return merged;
}

export function simulateHeadlessScenario(
  scenario: HeadlessSimulationScenario,
  boardEffectByCellIndex: Map<number, string | null>
): HeadlessSimulationOutcome {
  if (scenario.kind === "singleRace") {
    const race = simulateHeadlessRace(scenario.setup, boardEffectByCellIndex);
    const finalPlacements = deriveBasicPlacementsFromRace(race.state);
    return {
      scenarioKind: scenario.kind,
      winnerBasicId: race.state.winnerId ?? finalPlacements[0] ?? null,
      turnsAtFinish: race.state.turnIndex,
      preliminaryTurnsAtFinish: 0,
      finalTurnsAtFinish: race.state.turnIndex,
      preliminaryWinnerBasicId: null,
      finalPlacements,
      preliminaryPlacements: null,
      stackCarrierObservationCountByBasicId:
        race.stackCarrierObservationCountByBasicId,
    };
  }

  const preliminaryRace = simulateHeadlessRace(
    createTournamentPreliminaryRaceSetup(scenario.selectedBasicIds),
    boardEffectByCellIndex
  );
  const preliminaryPlacements = deriveBasicPlacementsFromRace(
    preliminaryRace.state
  );
  const finalRace = simulateHeadlessRace(
    createTournamentFinalRaceSetup(preliminaryPlacements),
    boardEffectByCellIndex
  );
  const finalPlacements = deriveBasicPlacementsFromRace(finalRace.state);
  return {
    scenarioKind: scenario.kind,
    winnerBasicId: finalRace.state.winnerId ?? finalPlacements[0] ?? null,
    turnsAtFinish: preliminaryRace.state.turnIndex + finalRace.state.turnIndex,
    preliminaryTurnsAtFinish: preliminaryRace.state.turnIndex,
    finalTurnsAtFinish: finalRace.state.turnIndex,
    preliminaryWinnerBasicId:
      preliminaryRace.state.winnerId ?? preliminaryPlacements[0] ?? null,
    finalPlacements,
    preliminaryPlacements,
    stackCarrierObservationCountByBasicId: mergeTallies(
      preliminaryRace.stackCarrierObservationCountByBasicId,
      finalRace.stackCarrierObservationCountByBasicId
    ),
  };
}

export function simulateHeadlessFullGame(
  selectedBasicIds: DangoId[],
  boardEffectByCellIndex: Map<number, string | null>
): HeadlessSimulationOutcome {
  return simulateHeadlessScenario(
    {
      kind: "singleRace",
      setup: createNormalRaceSetup(selectedBasicIds),
    },
    boardEffectByCellIndex
  );
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
    return applyStepAction(state, boardEffectByCellIndex);
  }
  if (action.type === "INSTANT_FULL_TURN") {
    if (state.phase !== "running") {
      return state;
    }
    if (state.winnerId) {
      return state;
    }
    return applyInstantFullTurn(state, boardEffectByCellIndex);
  }
  if (action.type === "INSTANT_SIMULATE_GAME") {
    if (state.phase !== "running") {
      return state;
    }
    if (state.winnerId) {
      return state;
    }
    return applyInstantSimulateGame(state, boardEffectByCellIndex);
  }
  return state;
}
