import { CHARACTER_BY_ID } from "@/services/characters";
import type { SkillBannerActionId } from "@/broadcast/skillBannerLexicon";
import type { LocalizedText } from "@/i18n";
import { recordSkillTrigger } from "@/services/engine/state/mutations";
import { orderedRacerIdsForLeaderboard } from "@/services/racerRanking";
import { hasReachedWinningDistance } from "@/services/engine/victory/distance";
import type {
  DangoId,
  EntityRuntimeState,
  GameState,
  MovementModifier,
  PlaybackSegment,
  StackReactiveLandingCause,
  TravelDirection,
  TurnRollPlan,
} from "@/types/game";

export function resolveStepsWithMovementModifiers(
  resolvedSteps: number,
  exemptRaw: number,
  movementModifiers: MovementModifier[] | undefined
): number {
  const exempt =
    exemptRaw > 0 ? Math.min(exemptRaw, resolvedSteps) : 0;
  const modifiableSteps = resolvedSteps - exempt;
  const movementModifierDelta = (movementModifiers ?? []).reduce(
    (sum, modifier) => sum + modifier.delta,
    0
  );
  const minimumMovement = (movementModifiers ?? []).reduce(
    (current, modifier) =>
      Math.max(current, modifier.minimumSteps ?? Number.NEGATIVE_INFINITY),
    Number.NEGATIVE_INFINITY
  );
  const adjustedModifiable = modifiableSteps + movementModifierDelta;
  const adjustedModifiableClamped =
    minimumMovement > Number.NEGATIVE_INFINITY
      ? Math.max(minimumMovement, adjustedModifiable)
      : Math.max(0, adjustedModifiable);
  return adjustedModifiableClamped + exempt;
}

export function resolveMovementDiceValue(
  state: GameState,
  plan: TurnRollPlan,
  allInitialRollsById: Record<DangoId, number | undefined>,
  allResolvedRollsById: Record<DangoId, number | undefined>
): {
  diceValue: number;
  entityPatches?: Partial<Record<DangoId, Partial<EntityRuntimeState>>>;
  skillNarrative?: LocalizedText;
  skillBannerActionId?: SkillBannerActionId;
} {
  if (plan.locksMovementSteps) {
    return { diceValue: plan.diceValue };
  }
  const character = CHARACTER_BY_ID[plan.actorId];
  const handler = character?.skillHooks.resolveMovement;
  const resolvedFromHook = handler?.(state, {
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
    resolvedFromHook &&
    typeof resolvedFromHook.diceValue === "number" &&
    Number.isFinite(resolvedFromHook.diceValue)
      ? resolvedFromHook.diceValue
      : plan.diceValue;
  const exemptFromDiceRoll = plan.stepsExemptFromMovementModifiers ?? 0;
  const exemptFromHookRaw =
    resolvedFromHook?.stepsExemptFromMovementModifiers ?? 0;
  const exemptRaw = exemptFromDiceRoll + exemptFromHookRaw;
  const diceValue = resolveStepsWithMovementModifiers(
    resolvedSteps,
    exemptRaw,
    plan.movementModifiers
  );
  if (!resolvedFromHook) {
    return { diceValue };
  }
  const {
    stepsExemptFromMovementModifiers: exemptFromDeclared,
    ...restFromHook
  } = resolvedFromHook;
  void exemptFromDeclared;
  return { ...restFromHook, diceValue };
}

export function buildDirectlyAboveByActor(
  stackBottomToTop: DangoId[]
): Map<DangoId, DangoId | undefined> {
  const directlyAboveByActor = new Map<DangoId, DangoId | undefined>();
  for (let index = 0; index < stackBottomToTop.length; index++) {
    directlyAboveByActor.set(stackBottomToTop[index]!, stackBottomToTop[index + 1]);
  }
  return directlyAboveByActor;
}

export function applyDirectTopLandingHooks(
  state: GameState,
  context: {
    turnIndex: number;
    cellIndex: number;
    previousStackBottomToTop: DangoId[];
    nextStackBottomToTop: DangoId[];
    landingCause: StackReactiveLandingCause;
  }
): {
  state: GameState;
  segments: PlaybackSegment[];
} {
  if (
    context.previousStackBottomToTop.join("|") ===
    context.nextStackBottomToTop.join("|")
  ) {
    return { state, segments: [] };
  }
  let nextState = state;
  const segments: PlaybackSegment[] = [];
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
      landingCause: context.landingCause,
    });
    nextState = resolution.state;
    segments.push(...(resolution.segments ?? []));
    if (resolution.skillNarrative) {
      nextState = recordSkillTrigger(
        nextState,
        segments,
        actorId,
        resolution.skillNarrative,
        resolution.skillBannerActionId
      );
    }
  }
  return { state: nextState, segments };
}

export function applyMovementStepHooksForTravelGroup(
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

export function pushHopSegment(
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

export function resolveExecutedMovementStepCount(
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
  if (hasReachedWinningDistance(actor, state.raceWinDistanceInClockwiseSteps)) {
    return 0;
  }
  const remainingStepsToFinish =
    state.raceWinDistanceInClockwiseSteps - actor.raceDisplacement;
  return Math.min(plannedStepCount, remainingStepsToFinish);
}
