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
  buildStepLandingCells,
  clockwiseProgressFromFinishLine,
  isClockwiseTrackCellIndex,
} from "@/services/circular";
import {
  CELL_EFFECT_IDS,
  CELL_EFFECT_LOG_KEY_BY_ID,
  resolveCellEffectIfPresent,
} from "@/services/cellEffects";
import {
  orderedBasicRacerIdsForLeaderboard,
  orderedRacerIdsForLeaderboard,
} from "@/services/racerRanking";
import {
  createNormalRaceSetup,
  createTournamentFinalRaceSetup,
  createTournamentPreliminaryRaceSetup,
  deriveBasicPlacementsFromRace,
} from "@/services/raceSetup";
import {
  serializeBoardEffectAssignments,
  serializeEngineFrame,
} from "@/services/replaySerialization";
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
  PostMovementHookContext,
  RaceSetup,
  SkillHookContext,
  TurnPlaybackPlan,
  TravelDirection,
  TurnQueueAttachment,
  TurnRollPlan,
} from "@/types/game";
import type {
  CellEffectAnalyticsKey,
  HeadlessRaceBasicMetrics,
  HeadlessRaceDeepMetrics,
  HeadlessSimulationOutcome,
  OneTimeSkillKey,
  StackRoleKey,
} from "@/types/monteCarlo";
import type { MatchGameFrameJson, MatchRecord } from "@/types/replay";

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

function buildRoundActorOrder(state: GameState): {
  state: GameState;
  orderedActors: DangoId[];
} {
  let nextState = state;
  const randomizedActors = shuffleOrderStableCopy(nextState.entityOrder);
  const randomizedActorIndexById = new Map(
    randomizedActors.map((actorId, index) => [actorId, index])
  );
  const leadingActorIds = randomizedActors.filter(
    (actorId) => !nextState.entities[actorId]?.skillState.actLastNextRound
  );
  const roundTailActorIds = randomizedActors
    .filter((actorId) => nextState.entities[actorId]?.skillState.actLastNextRound)
    .sort((leftActorId, rightActorId) => {
      const leftOrder =
        nextState.entities[leftActorId]?.skillState.actLastNextRoundOrder ??
        Number.MAX_SAFE_INTEGER;
      const rightOrder =
        nextState.entities[rightActorId]?.skillState.actLastNextRoundOrder ??
        Number.MAX_SAFE_INTEGER;
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }
      return (
        (randomizedActorIndexById.get(leftActorId) ?? Number.MAX_SAFE_INTEGER) -
        (randomizedActorIndexById.get(rightActorId) ?? Number.MAX_SAFE_INTEGER)
      );
    });
  const orderedActors = [...leadingActorIds, ...roundTailActorIds];
  if (roundTailActorIds.length === 0) {
    return { state: nextState, orderedActors };
  }
  let nextEntities = nextState.entities;
  for (const actorId of roundTailActorIds) {
    const actor = nextEntities[actorId];
    if (!actor?.skillState.actLastNextRound) {
      continue;
    }
    nextEntities = {
      ...nextEntities,
      [actorId]: {
        ...actor,
        skillState: {
          ...actor.skillState,
          actLastNextRound: false,
          actLastNextRoundOrder: undefined,
          augustaServingDelayedTurn:
            actorId === "augusta" ? true : actor.skillState.augustaServingDelayedTurn,
        },
      },
    };
  }
  nextState = {
    ...nextState,
    entities: nextEntities,
  };
  return { state: nextState, orderedActors };
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
  const startingDisplacementById = setup.startingDisplacementById;
  for (const id of setup.selectedBasicIds) {
    entities[id] = {
      id,
      cellIndex: FINISH_LINE_CELL_INDEX,
      raceDisplacement: startingDisplacementById[id] ?? 0,
      skillState: id === "aemeath" ? { hasUsedMidpointLeap: false } : {},
    };
  }
  entities[ABBY_ID] = {
    id: ABBY_ID,
    cellIndex: FINISH_LINE_CELL_INDEX,
    raceDisplacement: 0,
    skillState: {},
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
    actLastNextRoundOrderCounter: 0,
    playbackStamp: 0,
  };
}

function hasReachedWinningDistance(entity: EntityRuntimeState | undefined): boolean {
  return (entity?.raceDisplacement ?? Number.NEGATIVE_INFINITY) >=
    LAP_DISTANCE_IN_CLOCKWISE_STEPS;
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
    actLastNextRoundOrderCounter: 0,
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
    const nextSkillState = patch.skillState
      ? {
          ...previous.skillState,
          ...patch.skillState,
        }
      : previous.skillState;
    nextEntities = {
      ...nextEntities,
      [entityId]: {
        ...previous,
        ...patch,
        skillState: nextSkillState,
      },
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
    const entity = state.entities[topId];
    if (!hasReachedWinningDistance(entity)) {
      continue;
    }
    const displacement = entity.raceDisplacement;
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
): {
  state: GameState;
  segments: PlaybackSegment[];
  skillNarrative?: LocalizedText;
} {
  const character = CHARACTER_BY_ID[context.rollerId];
  if (!character) {
    return { state, segments: [] };
  }
  const handler = character.skillHooks.afterDiceRoll;
  if (!handler) {
    return { state, segments: [] };
  }
  const resolution = handler(state, context);
  return {
    state: resolution.state,
    segments: resolution.segments ?? [],
    skillNarrative: resolution.skillNarrative,
  };
}

function applySkillHookBeforeTurn(
  state: GameState,
  context: SkillHookContext
): {
  state: GameState;
  segments: PlaybackSegment[];
  skillNarrative?: LocalizedText;
} {
  const character = CHARACTER_BY_ID[context.rollerId];
  if (!character) {
    return { state, segments: [] };
  }
  const handler = character.skillHooks.beforeTurn;
  if (!handler) {
    return { state, segments: [] };
  }
  const resolution = handler(state, context);
  return {
    state: resolution.state,
    segments: resolution.segments ?? [],
    skillNarrative: resolution.skillNarrative,
  };
}

function applySkillHookAtRoundStart(
  state: GameState,
  context: {
    actorId: DangoId;
    cellIndex: number;
    orderedActorIds: DangoId[];
  }
): {
  state: GameState;
  skillNarrative?: LocalizedText;
} {
  const character = CHARACTER_BY_ID[context.actorId];
  if (!character) {
    return { state };
  }
  const handler = character.skillHooks.atRoundStart;
  if (!handler) {
    return { state };
  }
  return handler(state, {
    turnIndex: state.turnIndex,
    actorId: context.actorId,
    cellIndex: context.cellIndex,
    orderedActorIds: context.orderedActorIds,
  });
}

function applySkillHookAtRoundEnd(
  state: GameState,
  context: {
    actorId: DangoId;
    cellIndex: number;
    orderedActorIds: DangoId[];
  }
): {
  state: GameState;
  skillNarrative?: LocalizedText;
} {
  const character = CHARACTER_BY_ID[context.actorId];
  if (!character) {
    return { state };
  }
  const handler = character.skillHooks.atRoundEnd;
  if (!handler) {
    return { state };
  }
  return handler(state, {
    turnIndex: state.turnIndex,
    actorId: context.actorId,
    cellIndex: context.cellIndex,
    orderedActorIds: context.orderedActorIds,
  });
}

function applyRoundStartSkillHooks(
  state: GameState,
  orderedActors: DangoId[]
): {
  state: GameState;
  openingSegments: PlaybackSegment[];
} {
  let nextState = state;
  const openingSegments: PlaybackSegment[] = [];
  for (const actorId of orderedActors) {
    const roundStartOutcome = applySkillHookAtRoundStart(nextState, {
      actorId,
      cellIndex:
        findCellIndexForEntity(nextState.cells, actorId) ?? FINISH_LINE_CELL_INDEX,
      orderedActorIds: orderedActors,
    });
    nextState = roundStartOutcome.state;
    if (!roundStartOutcome.skillNarrative) {
      continue;
    }
    nextState = appendLog(nextState, {
      kind: "skillTrigger",
      message: roundStartOutcome.skillNarrative,
    });
    openingSegments.push({
      kind: "skill",
      actorId,
      message: roundStartOutcome.skillNarrative,
    });
  }
  return { state: nextState, openingSegments };
}

function applyRoundEndSkillHooks(
  state: GameState,
  orderedActors: DangoId[]
): {
  state: GameState;
  closingSegments: PlaybackSegment[];
} {
  let nextState = state;
  const closingSegments: PlaybackSegment[] = [];
  for (const actorId of orderedActors) {
    const roundEndOutcome = applySkillHookAtRoundEnd(nextState, {
      actorId,
      cellIndex:
        findCellIndexForEntity(nextState.cells, actorId) ?? FINISH_LINE_CELL_INDEX,
      orderedActorIds: orderedActors,
    });
    nextState = roundEndOutcome.state;
    if (!roundEndOutcome.skillNarrative) {
      continue;
    }
    nextState = appendLog(nextState, {
      kind: "skillTrigger",
      message: roundEndOutcome.skillNarrative,
    });
    closingSegments.push({
      kind: "skill",
      actorId,
      message: roundEndOutcome.skillNarrative,
    });
  }
  return { state: nextState, closingSegments };
}

function mergeMovementModifiers(
  existing: TurnRollPlan["movementModifiers"],
  incoming: TurnRollPlan["movementModifiers"]
): TurnRollPlan["movementModifiers"] {
  if (!existing?.length) {
    return incoming ? [...incoming] : undefined;
  }
  if (!incoming?.length) {
    return [...existing];
  }
  return [...existing, ...incoming];
}

function applyTurnRollPlanPatches(
  plansByActorId: Record<DangoId, TurnRollPlan | undefined>,
  patches: Partial<Record<DangoId, Partial<TurnRollPlan>>> | undefined
): Record<DangoId, TurnRollPlan | undefined> {
  if (!patches) {
    return plansByActorId;
  }
  let nextPlans = plansByActorId;
  for (const [actorId, patch] of Object.entries(patches)) {
    if (!patch) {
      continue;
    }
    const previous = nextPlans[actorId];
    if (!previous) {
      continue;
    }
    nextPlans = {
      ...nextPlans,
      [actorId]: {
        ...previous,
        ...patch,
        movementModifiers: mergeMovementModifiers(
          previous.movementModifiers,
          patch.movementModifiers
        ),
      },
    };
  }
  return nextPlans;
}

function applySkillHookAfterTurnRolls(
  state: GameState,
  context: {
    actorId: DangoId;
    rankedBasicIds: DangoId[];
    plansByActorId: Record<DangoId, TurnRollPlan | undefined>;
    allInitialRollsById: Record<DangoId, number | undefined>;
    allResolvedRollsById: Record<DangoId, number | undefined>;
  }
): {
  state: GameState;
  planPatches?: Partial<Record<DangoId, Partial<TurnRollPlan>>>;
  skillNarrative?: LocalizedText;
} {
  const character = CHARACTER_BY_ID[context.actorId];
  if (!character) {
    return { state };
  }
  const handler = character.skillHooks.afterTurnRolls;
  if (!handler) {
    return { state };
  }
  const resolution = handler(state, {
    turnIndex: state.turnIndex,
    actorId: context.actorId,
    rankedBasicIds: context.rankedBasicIds,
    plansByActorId: context.plansByActorId,
    allInitialRollsById: context.allInitialRollsById,
    allResolvedRollsById: context.allResolvedRollsById,
  });
  return {
    state: resolution.state,
    planPatches: resolution.planPatches,
    skillNarrative: resolution.skillNarrative,
  };
}

function applySkillHookAfterMovement(
  state: GameState,
  context: PostMovementHookContext
): {
  state: GameState;
  segments: PlaybackSegment[];
  skillNarrative?: LocalizedText;
} {
  const character = CHARACTER_BY_ID[context.rollerId];
  if (!character) {
    return { state, segments: [] };
  }
  const handler = character.skillHooks.afterMovement;
  if (!handler) {
    return { state, segments: [] };
  }
  const resolution = handler(state, context);
  return {
    state: resolution.state,
    segments: resolution.segments ?? [],
    skillNarrative: resolution.skillNarrative,
  };
}

function applySkillHookAfterMovementResolution(
  state: GameState,
  context: PostMovementHookContext
): {
  state: GameState;
  segments: PlaybackSegment[];
  skillNarrative?: LocalizedText;
} {
  const character = CHARACTER_BY_ID[context.rollerId];
  if (!character) {
    return { state, segments: [] };
  }
  const handler = character.skillHooks.afterMovementResolution;
  if (!handler) {
    return { state, segments: [] };
  }
  const resolution = handler(state, context);
  return {
    state: resolution.state,
    segments: resolution.segments ?? [],
    skillNarrative: resolution.skillNarrative,
  };
}

function applySkillHookAfterTurn(
  state: GameState,
  context: SkillHookContext
): {
  state: GameState;
  segments: PlaybackSegment[];
  skillNarrative?: LocalizedText;
} {
  const character = CHARACTER_BY_ID[context.rollerId];
  if (!character) {
    return { state, segments: [] };
  }
  const handler = character.skillHooks.afterTurn;
  if (!handler) {
    return { state, segments: [] };
  }
  const resolution = handler(state, context);
  return {
    state: resolution.state,
    segments: resolution.segments ?? [],
    skillNarrative: resolution.skillNarrative,
  };
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
  const movementModifierDelta = (plan.movementModifiers ?? []).reduce(
    (sum, modifier) => sum + modifier.delta,
    0
  );
  const minimumMovement = (plan.movementModifiers ?? []).reduce(
    (current, modifier) =>
      Math.max(current, modifier.minimumSteps ?? Number.NEGATIVE_INFINITY),
    Number.NEGATIVE_INFINITY
  );
  const adjustedSteps = resolvedSteps + movementModifierDelta;
  const diceValue =
    minimumMovement > Number.NEGATIVE_INFINITY
      ? Math.max(minimumMovement, adjustedSteps)
      : Math.max(0, adjustedSteps);
  return { ...resolved, diceValue };
}

function buildDirectlyAboveByActor(
  stackBottomToTop: DangoId[]
): Map<DangoId, DangoId | undefined> {
  const directlyAboveByActor = new Map<DangoId, DangoId | undefined>();
  for (let index = 0; index < stackBottomToTop.length; index++) {
    directlyAboveByActor.set(stackBottomToTop[index]!, stackBottomToTop[index + 1]);
  }
  return directlyAboveByActor;
}

function applyDirectTopLandingHooks(
  state: GameState,
  context: {
    turnIndex: number;
    cellIndex: number;
    previousStackBottomToTop: DangoId[];
    nextStackBottomToTop: DangoId[];
    trigger: "movement" | "cellEffect" | "timeRift";
  }
): {
  state: GameState;
  segments: PlaybackSegment[];
  skillNarratives: LocalizedText[];
} {
  if (
    context.previousStackBottomToTop.join("|") ===
    context.nextStackBottomToTop.join("|")
  ) {
    return { state, segments: [], skillNarratives: [] };
  }
  let nextState = state;
  const segments: PlaybackSegment[] = [];
  const skillNarratives: LocalizedText[] = [];
  const previousDirectlyAbove = buildDirectlyAboveByActor(
    context.previousStackBottomToTop
  );
  for (let index = 0; index < context.nextStackBottomToTop.length - 1; index++) {
    const actorId = context.nextStackBottomToTop[index]!;
    const directlyAboveId = context.nextStackBottomToTop[index + 1]!;
    if (!context.previousStackBottomToTop.includes(actorId)) {
      continue;
    }
    if (previousDirectlyAbove.get(actorId) === directlyAboveId) {
      continue;
    }
    const handler = CHARACTER_BY_ID[actorId]?.skillHooks.afterDirectTopLanding;
    if (!handler) {
      continue;
    }
    const resolution = handler(nextState, {
      turnIndex: context.turnIndex,
      actorId,
      cellIndex: context.cellIndex,
      directlyAboveId,
      trigger: context.trigger,
    });
    nextState = resolution.state;
    segments.push(...(resolution.segments ?? []));
    if (resolution.skillNarrative) {
      skillNarratives.push(resolution.skillNarrative);
    }
  }
  return { state: nextState, segments, skillNarratives };
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

function resolveExecutedMovementStepCount(
  state: GameState,
  actingEntityId: DangoId,
  plannedStepCount: number,
  travelDirection: TravelDirection
): number {
  if (plannedStepCount <= 0 || travelDirection !== "clockwise") {
    return plannedStepCount;
  }
  const character = CHARACTER_BY_ID[actingEntityId];
  if (!character || character.role !== "basic") {
    return plannedStepCount;
  }
  const actor = state.entities[actingEntityId];
  if (!actor) {
    return plannedStepCount;
  }
  if (hasReachedWinningDistance(actor)) {
    return 0;
  }
  const remainingStepsToFinish =
    LAP_DISTANCE_IN_CLOCKWISE_STEPS - actor.raceDisplacement;
  return Math.min(plannedStepCount, remainingStepsToFinish);
}

function finalizeWinningTurn(
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

function finalizeTurnIfWinnerResolved(
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

function clearCompletedDelayedTurnState(
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

function finalizeActorTurnResolution(
  state: GameState,
  actorId: DangoId,
  segments: PlaybackSegment[]
): { state: GameState; segments: PlaybackSegment[] } {
  return finalizeTurnIfWinnerResolved(
    clearCompletedDelayedTurnState(state, actorId),
    segments
  );
}

function executeStepwiseMovement(
  state: GameState,
  actingEntityId: DangoId,
  diceValue: number,
  travelDirection: TravelDirection,
  telemetry?: HeadlessRaceTelemetryCollector
): {
  state: GameState;
  segments: PlaybackSegment[];
  finalLandingCellIndex: number | null;
  finalLandingPreviousStackBottomToTop: DangoId[];
  carriedBasicIds: DangoId[];
} {
  const segments: PlaybackSegment[] = [];
  let nextState = state;
  let finalLandingCellIndex: number | null = null;
  let finalLandingPreviousStackBottomToTop: DangoId[] = [];
  const carriedBasicIds = new Set<DangoId>();
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
    return {
      state: nextState,
      segments,
      finalLandingCellIndex,
      finalLandingPreviousStackBottomToTop,
      carriedBasicIds: [],
    };
  }
  for (let stepNumber = 1; stepNumber <= diceValue; stepNumber++) {
    const fromCellIndex = findCellIndexForEntity(nextState.cells, actingEntityId);
    if (fromCellIndex === null) {
      return {
        state: nextState,
        segments,
        finalLandingCellIndex,
        finalLandingPreviousStackBottomToTop,
        carriedBasicIds: [...carriedBasicIds],
      };
    }
    const activeStack = nextState.cells.get(fromCellIndex)!;
    const actorIndexInStack = activeStack.indexOf(actingEntityId);
    if (actorIndexInStack === -1) {
      return {
        state: nextState,
        segments,
        finalLandingCellIndex,
        finalLandingPreviousStackBottomToTop,
        carriedBasicIds: [...carriedBasicIds],
      };
    }
    const travelingIds = activeStack.slice(actorIndexInStack);
    if (telemetry) {
      recordHeadlessCarriedMovementStep(
        actingEntityId,
        travelingIds,
        telemetry,
        carriedBasicIds
      );
    }
    const toCellIndex =
      travelDirection === "clockwise"
        ? addClockwise(fromCellIndex, 1)
        : addCounterClockwise(fromCellIndex, 1);
    const destinationStackBeforeLanding = [...(nextState.cells.get(toCellIndex) ?? [])];
    const clockwiseDisplacementDelta = travelDirection === "clockwise" ? 1 : -1;
    nextState = relocateActorLedPortionBetweenCells(
      nextState,
      fromCellIndex,
      toCellIndex,
      activeStack,
      actorIndexInStack,
      clockwiseDisplacementDelta
    );
    finalLandingCellIndex = toCellIndex;
    finalLandingPreviousStackBottomToTop = destinationStackBeforeLanding;
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
  return {
    state: nextState,
    segments,
    finalLandingCellIndex,
    finalLandingPreviousStackBottomToTop,
    carriedBasicIds: [...carriedBasicIds],
  };
}

function hasEntityMovementChanged(
  originState: GameState,
  currentState: GameState,
  entityId: DangoId
): boolean {
  const originEntity = originState.entities[entityId];
  const currentEntity = currentState.entities[entityId];
  if (!originEntity || !currentEntity) {
    return false;
  }
  return (
    originEntity.cellIndex !== currentEntity.cellIndex ||
    originEntity.raceDisplacement !== currentEntity.raceDisplacement
  );
}

function buildPostMovementHookContext(
  originState: GameState,
  currentState: GameState,
  subjectId: DangoId,
  baseContext: {
    turnIndex: number;
    diceValue: number;
    travelDirection: TravelDirection;
    landingCells: number[];
    actingEntityId: DangoId;
  },
  requireMovement = true
): PostMovementHookContext | null {
  const originEntity = originState.entities[subjectId];
  const currentEntity = currentState.entities[subjectId];
  if (!originEntity || !currentEntity) {
    return null;
  }
  if (
    requireMovement &&
    !hasEntityMovementChanged(originState, currentState, subjectId)
  ) {
    return null;
  }
  return {
    turnIndex: baseContext.turnIndex,
    rollerId: subjectId,
    actingEntityId: baseContext.actingEntityId,
    diceValue: baseContext.diceValue,
    startCellIndex: originEntity.cellIndex,
    endCellIndex: currentEntity.cellIndex,
    travelDirection: baseContext.travelDirection,
    landingCells: baseContext.landingCells,
    startRaceDisplacement: originEntity.raceDisplacement,
    endRaceDisplacement: currentEntity.raceDisplacement,
  };
}

function collectPostMovementSubjectIds(
  originState: GameState,
  currentState: GameState,
  actingEntityId: DangoId
): DangoId[] {
  const orderedSubjectIds: DangoId[] = [];
  const seen = new Set<DangoId>();
  const candidateIds = [
    actingEntityId,
    ...originState.entityOrder,
    ...Object.keys(originState.entities),
  ];
  for (const candidateId of candidateIds) {
    if (seen.has(candidateId)) {
      continue;
    }
    seen.add(candidateId);
    if (!hasEntityMovementChanged(originState, currentState, candidateId)) {
      continue;
    }
    orderedSubjectIds.push(candidateId);
  }
  return orderedSubjectIds;
}

function applySkillHooksAfterAffectedMovement(
  state: GameState,
  movementStartState: GameState,
  actingEntityId: DangoId,
  baseContext: {
    turnIndex: number;
    diceValue: number;
    travelDirection: TravelDirection;
    landingCells: number[];
    actingEntityId: DangoId;
  }
): { state: GameState; segments: PlaybackSegment[] } {
  let nextState = state;
  const segments: PlaybackSegment[] = [];
  const subjectIds = collectPostMovementSubjectIds(
    movementStartState,
    state,
    actingEntityId
  );
  for (const subjectId of subjectIds) {
    const hookContext = buildPostMovementHookContext(
      movementStartState,
      state,
      subjectId,
      baseContext
    );
    if (!hookContext) {
      continue;
    }
    const skillOutcome = applySkillHookAfterMovement(nextState, hookContext);
    nextState = skillOutcome.state;
    segments.push(...skillOutcome.segments);
    if (!skillOutcome.skillNarrative) {
      continue;
    }
    nextState = appendLog(nextState, {
      kind: "skillTrigger",
      message: skillOutcome.skillNarrative,
    });
    segments.push({
      kind: "skill",
      actorId: subjectId,
      message: skillOutcome.skillNarrative,
    });
  }
  return { state: nextState, segments };
}

type HeadlessRaceTelemetryCollector = {
  basicMetricsById: Record<string, HeadlessRaceBasicMetrics>;
};

type OneTimeSkillFlagDefinition = {
  actorId: DangoId;
  skillKey: OneTimeSkillKey;
  isActivated: (state: GameState) => boolean;
};

const ONE_TIME_SKILL_FLAG_DEFINITIONS: OneTimeSkillFlagDefinition[] = [
  {
    actorId: "aemeath",
    skillKey: "aemeathMidpointLeap",
    isActivated: (state) => Boolean(state.entities.aemeath?.skillState.hasUsedMidpointLeap),
  },
  {
    actorId: "iuno",
    skillKey: "iunoAnchoredDestiny",
    isActivated: (state) =>
      Boolean(state.entities.iuno?.skillState.hasUsedAnchoredDestiny),
  },
  {
    actorId: "hiyuki",
    skillKey: "hiyukiMetAbby",
    isActivated: (state) => Boolean(state.entities.hiyuki?.skillState.hasMetAbby),
  },
  {
    actorId: "cartethyia",
    skillKey: "cartethyiaComebackAwaken",
    isActivated: (state) =>
      Boolean(state.entities.cartethyia?.skillState.comebackActive),
  },
];

function createHeadlessRoleObservationCounts(): HeadlessRaceBasicMetrics["roleObservationCounts"] {
  return {
    solo: 0,
    driver: 0,
    passenger: 0,
    crown: 0,
  };
}

function createHeadlessCellEffectCounts(): HeadlessRaceBasicMetrics["cellEffectTriggerCounts"] {
  return {
    propulsionDevice: 0,
    hindranceDevice: 0,
    timeRift: 0,
  };
}

function createHeadlessRaceTelemetryCollector(
  setup: RaceSetup
): HeadlessRaceTelemetryCollector {
  return {
    basicMetricsById: Object.fromEntries(
      setup.selectedBasicIds.map((basicId) => [
        basicId,
        {
          startingDisplacement: setup.startingDisplacementById[basicId] ?? 0,
          ownTurnProgress: 0,
          passiveProgress: 0,
          carriedProgress: 0,
          activeTurnCount: 0,
          passengerRideTurnCount: 0,
          roleObservationCounts: createHeadlessRoleObservationCounts(),
          cellEffectTriggerCounts: createHeadlessCellEffectCounts(),
          oneTimeSkillActivationTurnBySkillKey: {},
        },
      ])
    ),
  };
}

function getBasicStackRole(state: GameState, basicId: DangoId): StackRoleKey | null {
  const cellIndex = findCellIndexForEntity(state.cells, basicId);
  if (cellIndex === null) {
    return null;
  }
  const stack = state.cells.get(cellIndex);
  if (!stack) {
    return null;
  }
  const actorIndex = stack.indexOf(basicId);
  if (actorIndex === -1) {
    return null;
  }
  if (stack.length === 1) {
    return "solo";
  }
  if (actorIndex === 0) {
    return "driver";
  }
  if (actorIndex === stack.length - 1) {
    return "crown";
  }
  return "passenger";
}

function recordHeadlessRoleObservations(
  state: GameState,
  telemetry: HeadlessRaceTelemetryCollector
): void {
  for (const basicId of Object.keys(telemetry.basicMetricsById)) {
    const metrics = telemetry.basicMetricsById[basicId];
    if (!metrics) {
      continue;
    }
    const role = getBasicStackRole(state, basicId);
    if (!role) {
      continue;
    }
    metrics.roleObservationCounts[role] += 1;
  }
}

function recordHeadlessActiveTurn(
  actorId: DangoId,
  telemetry: HeadlessRaceTelemetryCollector
): void {
  const metrics = telemetry.basicMetricsById[actorId];
  if (!metrics) {
    return;
  }
  metrics.activeTurnCount += 1;
}

function recordHeadlessCarriedMovementStep(
  actorId: DangoId,
  travelingIds: DangoId[],
  telemetry: HeadlessRaceTelemetryCollector,
  carriedBasicIds: Set<DangoId>
): void {
  for (const travelingId of travelingIds) {
    if (travelingId === actorId || travelingId === ABBY_ID) {
      continue;
    }
    const metrics = telemetry.basicMetricsById[travelingId];
    if (!metrics) {
      continue;
    }
    metrics.carriedProgress += 1;
    carriedBasicIds.add(travelingId);
  }
}

function recordHeadlessPassengerRideTurns(
  basicIds: Iterable<DangoId>,
  telemetry: HeadlessRaceTelemetryCollector
): void {
  for (const basicId of basicIds) {
    const metrics = telemetry.basicMetricsById[basicId];
    if (!metrics) {
      continue;
    }
    metrics.passengerRideTurnCount += 1;
  }
}

function buildPlacementIndexByBasicId(placements: DangoId[]): Record<string, number> {
  return Object.fromEntries(
    placements.map((basicId, placementIndex) => [basicId, placementIndex])
  );
}

function recordHeadlessTurnProgress(
  previousState: GameState,
  nextState: GameState,
  actorId: DangoId,
  telemetry: HeadlessRaceTelemetryCollector
): void {
  for (const [basicId, metrics] of Object.entries(telemetry.basicMetricsById)) {
    const previousDisplacement =
      previousState.entities[basicId]?.raceDisplacement ?? 0;
    const nextDisplacement = nextState.entities[basicId]?.raceDisplacement ?? 0;
    const gainedProgress = nextDisplacement - previousDisplacement;
    if (gainedProgress <= 0) {
      continue;
    }
    if (basicId === actorId) {
      metrics.ownTurnProgress += gainedProgress;
      continue;
    }
    metrics.passiveProgress += gainedProgress;
  }
}

function recordHeadlessCellEffectTrigger(
  telemetry: HeadlessRaceTelemetryCollector,
  actorId: DangoId,
  effectId: CellEffectAnalyticsKey
): void {
  const metrics = telemetry.basicMetricsById[actorId];
  if (!metrics) {
    return;
  }
  metrics.cellEffectTriggerCounts[effectId] += 1;
}

function captureHeadlessSkillActivations(
  previousState: GameState,
  nextState: GameState,
  telemetry: HeadlessRaceTelemetryCollector,
  turnIndex: number
): void {
  for (const definition of ONE_TIME_SKILL_FLAG_DEFINITIONS) {
    const metrics = telemetry.basicMetricsById[definition.actorId];
    if (!metrics) {
      continue;
    }
    if (metrics.oneTimeSkillActivationTurnBySkillKey[definition.skillKey] !== undefined) {
      continue;
    }
    if (!definition.isActivated(nextState) || definition.isActivated(previousState)) {
      continue;
    }
    metrics.oneTimeSkillActivationTurnBySkillKey[definition.skillKey] = turnIndex;
  }
}

function resolveMovementStabilization(
  state: GameState,
  actingEntityId: DangoId,
  turnIndex: number,
  diceValue: number,
  travelDirection: TravelDirection,
  boardEffectByCellIndex: Map<number, string | null>,
  finalLandingCellIndex: number | null,
  finalLandingPreviousStackBottomToTop: DangoId[],
  telemetry?: HeadlessRaceTelemetryCollector
): { state: GameState; segments: PlaybackSegment[] } {
  let resolvedState = state;
  const segments: PlaybackSegment[] = [];
  if (diceValue <= 0) {
    return { state: resolvedState, segments };
  }
  const finalCellIndex = findCellIndexForEntity(state.cells, actingEntityId);
  if (finalCellIndex === null) {
    return { state: resolvedState, segments };
  }
  const finalStack = state.cells.get(finalCellIndex) ?? [];
  const stackBeforeCellEffect = [...finalStack];
  const effectOutcome = resolveCellEffectIfPresent(state, boardEffectByCellIndex, {
    turnIndex,
    moverId: actingEntityId,
    destinationCellIndex: finalCellIndex,
    stackBottomToTop: finalStack,
    moverTravelDirection: travelDirection,
  });
  resolvedState = effectOutcome?.state ?? state;
  if (effectOutcome) {
    if (telemetry) {
      recordHeadlessCellEffectTrigger(
        telemetry,
        actingEntityId,
        effectOutcome.effectId as CellEffectAnalyticsKey
      );
    }
    const effectMessage =
      effectOutcome.message ?? text(CELL_EFFECT_LOG_KEY_BY_ID[effectOutcome.effectId]);
    segments.push({
      kind: "cellEffect",
      actorId: actingEntityId,
      effectId: effectOutcome.effectId,
      message: effectMessage,
    });
    resolvedState = appendLog(resolvedState, {
      kind: "cellEffect",
      message: effectMessage,
    });
  }
  if (effectOutcome?.shift) {
    segments.push({
      kind: "slide",
      travelingIds: effectOutcome.shift.travelingIds,
      direction: effectOutcome.shift.direction,
      fromCell: effectOutcome.shift.fromCell,
      toCell: effectOutcome.shift.toCell,
    });
  }
  if (effectOutcome) {
    const reactiveCellIndex = effectOutcome.shift?.toCell ?? finalCellIndex;
    const reactiveOutcome = applyDirectTopLandingHooks(resolvedState, {
      turnIndex: resolvedState.turnIndex,
      cellIndex: reactiveCellIndex,
      previousStackBottomToTop:
        effectOutcome.effectId === CELL_EFFECT_IDS.timeRift
          ? stackBeforeCellEffect
          : [...(state.cells.get(reactiveCellIndex) ?? [])],
      nextStackBottomToTop: [...(resolvedState.cells.get(reactiveCellIndex) ?? [])],
      trigger:
        effectOutcome.effectId === CELL_EFFECT_IDS.timeRift ? "timeRift" : "cellEffect",
    });
    resolvedState = reactiveOutcome.state;
    for (const narrative of reactiveOutcome.skillNarratives) {
      resolvedState = appendLog(resolvedState, {
        kind: "skillTrigger",
        message: narrative,
      });
    }
    segments.push(...reactiveOutcome.segments);
    return { state: resolvedState, segments };
  }
  if (finalLandingCellIndex === null) {
    return { state: resolvedState, segments };
  }
  const landingReactionOutcome = applyDirectTopLandingHooks(resolvedState, {
    turnIndex: resolvedState.turnIndex,
    cellIndex: finalLandingCellIndex,
    previousStackBottomToTop: finalLandingPreviousStackBottomToTop,
    nextStackBottomToTop: [...(resolvedState.cells.get(finalLandingCellIndex) ?? [])],
    trigger: "movement",
  });
  resolvedState = landingReactionOutcome.state;
  for (const narrative of landingReactionOutcome.skillNarratives) {
    resolvedState = appendLog(resolvedState, {
      kind: "skillTrigger",
      message: narrative,
    });
  }
  segments.push(...landingReactionOutcome.segments);
  return { state: resolvedState, segments };
}

function resolvePostMovementPhase(
  state: GameState,
  movementStartState: GameState,
  actingEntityId: DangoId,
  diceValue: number,
  travelDirection: TravelDirection,
  boardEffectByCellIndex: Map<number, string | null>,
  finalLandingCellIndex: number | null,
  finalLandingPreviousStackBottomToTop: DangoId[],
  telemetry?: HeadlessRaceTelemetryCollector
): { state: GameState; segments: PlaybackSegment[] } {
  const segments: PlaybackSegment[] = [];
  const landingCells = buildStepLandingCells(
    movementStartState.entities[actingEntityId]?.cellIndex ?? FINISH_LINE_CELL_INDEX,
    diceValue,
    travelDirection
  );
  const stabilizedOutcome = resolveMovementStabilization(
    state,
    actingEntityId,
    state.turnIndex,
    diceValue,
    travelDirection,
    boardEffectByCellIndex,
    finalLandingCellIndex,
    finalLandingPreviousStackBottomToTop,
    telemetry
  );
  let nextState = stabilizedOutcome.state;
  segments.push(...stabilizedOutcome.segments);
  const affectedMovementOutcome = applySkillHooksAfterAffectedMovement(
    nextState,
    movementStartState,
    actingEntityId,
    {
      turnIndex: movementStartState.turnIndex,
      diceValue,
      travelDirection,
      landingCells,
      actingEntityId,
    }
  );
  nextState = affectedMovementOutcome.state;
  segments.push(...affectedMovementOutcome.segments);
  const finalContext = buildPostMovementHookContext(
    movementStartState,
    nextState,
    actingEntityId,
    {
      turnIndex: movementStartState.turnIndex,
      diceValue,
      travelDirection,
      landingCells,
      actingEntityId,
    },
    false
  );
  if (!finalContext) {
    return { state: nextState, segments };
  }
  const finalOutcome = applySkillHookAfterMovementResolution(nextState, finalContext);
  nextState = finalOutcome.state;
  segments.push(...finalOutcome.segments);
  if (finalOutcome.skillNarrative) {
    nextState = appendLog(nextState, {
      kind: "skillTrigger",
      message: finalOutcome.skillNarrative,
    });
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
    if (state.entities[actorId]?.skillState.skipTurnThisRound) {
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
  allResolvedRollsById: Record<DangoId, number | undefined>,
  telemetry?: HeadlessRaceTelemetryCollector
): { state: GameState; segments: PlaybackSegment[] } {
  const segments: PlaybackSegment[] = [];
  const character = CHARACTER_BY_ID[actingEntityId];
  if (telemetry) {
    recordHeadlessRoleObservations(state, telemetry);
    recordHeadlessActiveTurn(actingEntityId, telemetry);
  }
  const finalizeResolvedTurn = (
    resolved: { state: GameState; segments: PlaybackSegment[] }
  ) => {
    if (telemetry) {
      captureHeadlessSkillActivations(
        state,
        resolved.state,
        telemetry,
        resolved.state.turnIndex
      );
      recordHeadlessTurnProgress(state, resolved.state, actingEntityId, telemetry);
    }
    return resolved;
  };
  if (!character) {
    return finalizeResolvedTurn({ state, segments });
  }
  const shouldStandbyBoss =
    character.role === "boss" &&
    state.turnIndex <= character.activateAfterTurnIndex;
  if (shouldStandbyBoss) {
    return finalizeResolvedTurn(
      finalizeActorTurnResolution(
        appendLog(state, {
          kind: "standby",
          message: text("simulation.log.standby", {
            actor: characterParam(actingEntityId),
          }),
        }),
        actingEntityId,
        [
          {
            kind: "idle",
            actorId: actingEntityId,
            reason: "standby",
          },
        ]
      )
    );
  }
  const actingEntity = state.entities[actingEntityId];
  if (actingEntity?.skillState.skipTurnThisRound) {
    let skippedState: GameState = {
      ...state,
      entities: {
        ...state.entities,
        [actingEntityId]: {
          ...actingEntity,
          skillState: {
            ...actingEntity.skillState,
            skipTurnThisRound: false,
          },
        },
      },
    };
    const skippedSegments: PlaybackSegment[] = [];
    const actingCellIndex =
      findCellIndexForEntity(skippedState.cells, actingEntityId) ??
      FINISH_LINE_CELL_INDEX;
    const afterTurnOutcome = applySkillHookAfterTurn(skippedState, {
      turnIndex: state.turnIndex,
      rollerId: actingEntityId,
      diceValue: 0,
      cellIndex: actingCellIndex,
    });
    skippedState = afterTurnOutcome.state;
    skippedSegments.push(...afterTurnOutcome.segments);
    if (afterTurnOutcome.skillNarrative) {
      skippedState = appendLog(skippedState, {
        kind: "skillTrigger",
        message: afterTurnOutcome.skillNarrative,
      });
      skippedSegments.push({
        kind: "skill",
        actorId: actingEntityId,
        message: afterTurnOutcome.skillNarrative,
      });
    }
    return finalizeResolvedTurn(
      finalizeActorTurnResolution(skippedState, actingEntityId, skippedSegments)
    );
  }
  if (!plan) {
    return finalizeResolvedTurn(
      finalizeActorTurnResolution(state, actingEntityId, segments)
    );
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
    entities: applyEntityRuntimePatches(
      applyEntityRuntimePatches(state.entities, plan.entityPatches),
      movementOutcome.entityPatches
    ),
  };
  const beforeTurnOutcome = applySkillHookBeforeTurn(nextState, {
    turnIndex: state.turnIndex,
    rollerId: actingEntityId,
    diceValue: resolvedMovementStepCount,
    cellIndex:
      findCellIndexForEntity(nextState.cells, actingEntityId) ??
      FINISH_LINE_CELL_INDEX,
  });
  nextState = beforeTurnOutcome.state;
  segments.push(...beforeTurnOutcome.segments);
  if (beforeTurnOutcome.skillNarrative) {
    nextState = appendLog(nextState, {
      kind: "skillTrigger",
      message: beforeTurnOutcome.skillNarrative,
    });
    segments.push({
      kind: "skill",
      actorId: actingEntityId,
      message: beforeTurnOutcome.skillNarrative,
    });
  }
  nextState = {
    ...nextState,
    lastRollById: {
      ...nextState.lastRollById,
      [actingEntityId]: plan.initialDiceValue,
    },
  };
  nextState = appendLog(nextState, {
    kind: "roll",
    message: text("simulation.log.roll", {
      actor: characterParam(actingEntityId),
      value: plan.initialDiceValue,
    }),
  });
  segments.push({
    kind: "roll",
    actorId: actingEntityId,
    value: plan.initialDiceValue,
  });
  for (const narrative of [plan.skillNarrative, movementOutcome.skillNarrative]) {
    if (!narrative) {
      continue;
    }
    nextState = appendLog(nextState, {
      kind: "skillTrigger",
      message: narrative,
    });
    segments.push({
      kind: "skill",
      actorId: actingEntityId,
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
  const afterDiceOutcome = applySkillHookAfterDice(nextState, diceContext);
  nextState = afterDiceOutcome.state;
  segments.push(...afterDiceOutcome.segments);
  if (afterDiceOutcome.skillNarrative) {
    nextState = appendLog(nextState, {
      kind: "skillTrigger",
      message: afterDiceOutcome.skillNarrative,
    });
    segments.push({
      kind: "skill",
      actorId: actingEntityId,
      message: afterDiceOutcome.skillNarrative,
    });
  }
  const activeCellIndex = findCellIndexForEntity(nextState.cells, actingEntityId);
  if (activeCellIndex === null) {
    return finalizeResolvedTurn(
      finalizeActorTurnResolution(nextState, actingEntityId, segments)
    );
  }
  const activeStack = nextState.cells.get(activeCellIndex)!;
  const actorIndexInStack = activeStack.indexOf(actingEntityId);
  if (actorIndexInStack === -1) {
    let skippedState = appendLog(nextState, {
      kind: "skipNotBottom",
      message: text("simulation.log.skipNotBottom", {
        actor: characterParam(actingEntityId),
      }),
    });
    const skippedSegments: PlaybackSegment[] = [
      {
        kind: "idle",
        actorId: actingEntityId,
        reason: "skipNotBottom",
        rollValue: plan.initialDiceValue,
      },
    ];
    const afterTurnOutcome = applySkillHookAfterTurn(skippedState, {
      turnIndex: state.turnIndex,
      rollerId: actingEntityId,
      diceValue: resolvedMovementStepCount,
      cellIndex: activeCellIndex,
    });
    skippedState = afterTurnOutcome.state;
    skippedSegments.push(...afterTurnOutcome.segments);
    if (afterTurnOutcome.skillNarrative) {
      skippedState = appendLog(skippedState, {
        kind: "skillTrigger",
        message: afterTurnOutcome.skillNarrative,
      });
      skippedSegments.push({
        kind: "skill",
        actorId: actingEntityId,
        message: afterTurnOutcome.skillNarrative,
      });
    }
    return finalizeResolvedTurn(
      finalizeActorTurnResolution(skippedState, actingEntityId, skippedSegments)
    );
  }
  const executedMovementStepCount = resolveExecutedMovementStepCount(
    nextState,
    actingEntityId,
    resolvedMovementStepCount,
    character.travelDirection
  );
  const movementStartState = nextState;
  const movementResult = executeStepwiseMovement(
    movementStartState,
    actingEntityId,
    executedMovementStepCount,
    character.travelDirection,
    telemetry
  );
  nextState = movementResult.state;
  segments.push(...movementResult.segments);
  if (telemetry) {
    recordHeadlessPassengerRideTurns(movementResult.carriedBasicIds, telemetry);
  }
  nextState = appendLog(nextState, {
    kind: "move",
    message: text("simulation.log.move", {
      actor: characterParam(actingEntityId),
      steps: executedMovementStepCount,
      direction: directionParam(character.travelDirection),
    }),
  });
  const postMovementOutcome = resolvePostMovementPhase(
    nextState,
    movementStartState,
    actingEntityId,
    executedMovementStepCount,
    character.travelDirection,
    boardEffectByCellIndex,
    movementResult.finalLandingCellIndex,
    movementResult.finalLandingPreviousStackBottomToTop,
    telemetry
  );
  const afterEffectState = postMovementOutcome.state;
  segments.push(...postMovementOutcome.segments);
  const finalCellIndex =
    findCellIndexForEntity(afterEffectState.cells, actingEntityId) ??
    FINISH_LINE_CELL_INDEX;
  const afterTurnOutcome = applySkillHookAfterTurn(afterEffectState, {
    turnIndex: state.turnIndex,
    rollerId: actingEntityId,
    diceValue: executedMovementStepCount,
    cellIndex: finalCellIndex,
  });
  nextState = afterTurnOutcome.state;
  segments.push(...afterTurnOutcome.segments);
  if (afterTurnOutcome.skillNarrative) {
    nextState = appendLog(nextState, {
      kind: "skillTrigger",
      message: afterTurnOutcome.skillNarrative,
    });
    segments.push({
      kind: "skill",
      actorId: actingEntityId,
      message: afterTurnOutcome.skillNarrative,
    });
  }
  return finalizeResolvedTurn(
    finalizeActorTurnResolution(nextState, actingEntityId, segments)
  );
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
    presentationMode: options.presentationMode ?? "animated",
    showTurnIntroBanner: options.showTurnIntroBanner,
    turnOrderActorIds: options.turnOrderActorIds,
    turnQueue: options.turnQueue,
  };
}

function openNextTurnWithDicePlans(
  state: GameState,
  telemetry?: HeadlessRaceTelemetryCollector
): {
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
  const roundOrder = buildRoundActorOrder(nextState);
  nextState = roundOrder.state;
  const orderedActors = roundOrder.orderedActors;
  const roundStartOutcome = applyRoundStartSkillHooks(nextState, orderedActors);
  nextState = roundStartOutcome.state;
  openingSegments.push(...roundStartOutcome.openingSegments);
  const {
    plansByActorId: initialPlansByActorId,
    allInitialRollsById,
    allResolvedRollsById,
  } = createTurnRollPlans(nextState, orderedActors);
  let plansByActorId = initialPlansByActorId;
  for (const actorId of orderedActors) {
    const preMovementOutcome = applySkillHookAfterTurnRolls(nextState, {
      actorId,
      rankedBasicIds: orderedBasicRacerIdsForLeaderboard(nextState),
      plansByActorId,
      allInitialRollsById,
      allResolvedRollsById,
    });
    nextState = preMovementOutcome.state;
    plansByActorId = applyTurnRollPlanPatches(
      plansByActorId,
      preMovementOutcome.planPatches
    );
    if (preMovementOutcome.skillNarrative) {
      nextState = appendLog(nextState, {
        kind: "skillTrigger",
        message: preMovementOutcome.skillNarrative,
      });
      openingSegments.push({
        kind: "skill",
        actorId,
        message: preMovementOutcome.skillNarrative,
      });
    }
  }
  const pendingTurn = buildPendingTurnResolution(
    orderedActors,
    plansByActorId,
    allInitialRollsById,
    allResolvedRollsById
  );
  if (telemetry) {
    captureHeadlessSkillActivations(state, nextState, telemetry, nextState.turnIndex);
  }
  return { state: nextState, pendingTurn, openingSegments };
}

function applyStepAction(
  state: GameState,
  boardEffectByCellIndex: Map<number, string | null>,
  telemetry?: HeadlessRaceTelemetryCollector
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
    const opened = openNextTurnWithDicePlans(working, telemetry);
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
    pending.allResolvedRollsById,
    telemetry
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
    const preRoundEndState = working;
    const roundEndOutcome = applyRoundEndSkillHooks(working, pending.orderedActorIds);
    working = roundEndOutcome.state;
    if (telemetry) {
      captureHeadlessSkillActivations(
        preRoundEndState,
        working,
        telemetry,
        working.turnIndex
      );
    }
    segments.push(...roundEndOutcome.closingSegments);
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
  boardEffectByCellIndex: Map<number, string | null>,
  telemetry?: HeadlessRaceTelemetryCollector
): GameState {
  if (state.phase !== "running" || state.winnerId) {
    return state;
  }

  let working = state;

  if (!working.pendingTurn) {
    const opened = openNextTurnWithDicePlans(working, telemetry);
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
      p.allResolvedRollsById,
      telemetry
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
      const preRoundEndState = working;
      const roundEndOutcome = applyRoundEndSkillHooks(working, p.orderedActorIds);
      working = roundEndOutcome.state;
      if (telemetry) {
        captureHeadlessSkillActivations(
          preRoundEndState,
          working,
          telemetry,
          working.turnIndex
        );
      }
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
    working = applyInstantFullTurn(working, boardEffectByCellIndex);
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

type HeadlessRaceResult = {
  state: GameState;
  metrics: HeadlessRaceDeepMetrics;
  record: MatchRecord;
};

function buildHeadlessRaceMetrics(
  setup: RaceSetup,
  state: GameState,
  telemetry: HeadlessRaceTelemetryCollector
): HeadlessRaceDeepMetrics {
  const startingDisplacements = setup.selectedBasicIds.map(
    (basicId) => setup.startingDisplacementById[basicId] ?? 0
  );
  const maxProgressDebt = Math.min(0, ...startingDisplacements);
  return {
    mode: setup.mode,
    winnerBasicId: state.winnerId,
    turnsAtFinish: state.turnIndex,
    finalPlacements: deriveBasicPlacementsFromRace(state),
    startingPlacementByBasicId: buildPlacementIndexByBasicId(
      setup.selectedBasicIds
    ),
    startedWithMaxProgressDebtBasicIds:
      maxProgressDebt < 0
        ? setup.selectedBasicIds.filter(
            (basicId) =>
              (setup.startingDisplacementById[basicId] ?? 0) === maxProgressDebt
          )
        : [],
    basicMetricsById: telemetry.basicMetricsById,
  };
}

function simulateHeadlessRace(
  setup: RaceSetup,
  boardEffectByCellIndex: Map<number, string | null>
): HeadlessRaceResult {
  let working = createRunningSessionFromSetup(setup);
  const telemetry = createHeadlessRaceTelemetryCollector(setup);
  const board = serializeBoardEffectAssignments(boardEffectByCellIndex);
  const frames: MatchGameFrameJson[] = [serializeEngineFrame(working)];
  const safetyCap = 250_000;
  let iterations = 0;
  while (working.phase === "running" && !working.winnerId) {
    if (iterations >= safetyCap) {
      break;
    }
    iterations += 1;
    const previousStamp = working.playbackStamp;
    working = applyStepAction(working, boardEffectByCellIndex, telemetry);
    if (
      working.playbackStamp === previousStamp &&
      working.phase === "running" &&
      !working.winnerId
    ) {
      break;
    }
    frames.push(serializeEngineFrame(working));
  }
  const record: MatchRecord = {
    schemaVersion: 1,
    setup,
    board,
    frames,
  };
  return {
    state: working,
    metrics: buildHeadlessRaceMetrics(setup, working, telemetry),
    record,
  };
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
      raceMetrics: {
        preliminary: null,
        final: race.metrics,
      },
      modeMetrics: {
        kind: "singleRace",
        finalStartingPlacementByBasicId: race.metrics.startingPlacementByBasicId,
      },
      capturedReplay: {
        scenarioKind: "singleRace",
        record: race.record,
      },
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
  const preliminaryWinnerBasicId =
    preliminaryRace.state.winnerId ?? preliminaryPlacements[0] ?? null;
  const finalWinnerBasicId = finalRace.state.winnerId ?? finalPlacements[0] ?? null;
  return {
    scenarioKind: scenario.kind,
    winnerBasicId: finalWinnerBasicId,
    turnsAtFinish: preliminaryRace.state.turnIndex + finalRace.state.turnIndex,
    preliminaryTurnsAtFinish: preliminaryRace.state.turnIndex,
    finalTurnsAtFinish: finalRace.state.turnIndex,
    preliminaryWinnerBasicId,
    finalPlacements,
    preliminaryPlacements,
    raceMetrics: {
      preliminary: preliminaryRace.metrics,
      final: finalRace.metrics,
    },
    modeMetrics: {
      kind: "tournament",
      preliminaryPlacementByBasicId: buildPlacementIndexByBasicId(
        preliminaryPlacements
      ),
      finalStartingPlacementByBasicId: finalRace.metrics.startingPlacementByBasicId,
      preliminaryWinnerRetainedTitle:
        preliminaryWinnerBasicId !== null &&
        preliminaryWinnerBasicId === finalWinnerBasicId,
    },
    capturedReplay: {
      scenarioKind: "tournament",
      preliminary: preliminaryRace.record,
      final: finalRace.record,
    },
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
