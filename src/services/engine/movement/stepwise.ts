import { addClockwise, addCounterClockwise } from "@/services/circular";
import { appendLog } from "@/services/engine/state/mutations";
import { relocateActorLedPortionBetweenCells } from "@/services/engine/movement/relocation";
import {
  applyMovementStepHooksForTravelGroup,
  pushHopSegment,
} from "@/services/engine/movement/diceAndLanding";
import {
  recordHeadlessCarriedMovementStep,
} from "@/services/engine/headless/telemetry";
import type { HeadlessRaceTelemetryCollector } from "@/services/engine/headless/telemetryTypes";
import { findCellIndexForEntity } from "@/services/stateCells";
import type {
  DangoId,
  GameState,
  PlaybackSegment,
  TravelDirection,
} from "@/types/game";

export function executeStepwiseMovement(
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
    finalLandingCellIndex = restingCellIndex;
    finalLandingPreviousStackBottomToTop = [...restingStack];
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
