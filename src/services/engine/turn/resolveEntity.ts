import { FINISH_LINE_CELL_INDEX } from "@/constants/board";
import { CHARACTER_BY_ID } from "@/services/characters";
import { characterParam, directionParam, text } from "@/i18n";
import type { EngineExecutionContext } from "@/services/engine/core/executionContext";
import {
  appendLog,
  applyEntityRuntimePatches,
  recordSkillTrigger,
} from "@/services/engine/state/mutations";
import {
  resolveExecutedMovementStepCount,
  resolveMovementDiceValue,
} from "@/services/engine/movement/diceAndLanding";
import { executeStepwiseMovement } from "@/services/engine/movement/stepwise";
import {
  captureHeadlessSkillActivations,
  recordHeadlessActiveTurn,
  recordHeadlessPassengerRideTurns,
  recordHeadlessRoleObservations,
  recordHeadlessTurnProgress,
} from "@/services/engine/headless/telemetry";
import { finalizeActorTurnResolution } from "@/services/engine/victory/finalizeTurn";
import { findCellIndexForEntity } from "@/services/stateCells";
import type {
  DangoId,
  GameState,
  PlaybackSegment,
  SkillHookContext,
  TurnRollPlan,
} from "@/types/game";

export function resolveTurnForEntity(
  state: GameState,
  actingEntityId: string,
  executionContext: EngineExecutionContext,
  turnRollPlan: TurnRollPlan | undefined,
  allInitialRollsById: Record<DangoId, number | undefined>,
  allResolvedRollsById: Record<DangoId, number | undefined>
): { state: GameState; segments: PlaybackSegment[] } {
  const segments: PlaybackSegment[] = [];
  const character = CHARACTER_BY_ID[actingEntityId];
  const telemetry = executionContext.telemetry;
  const boardEffectByCellIndex = executionContext.boardEffectByCellIndex;
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
  if (!turnRollPlan) {
    return finalizeResolvedTurn(
      finalizeActorTurnResolution(state, actingEntityId, segments)
    );
  }
  const movementOutcome = resolveMovementDiceValue(
    state,
    turnRollPlan,
    allInitialRollsById,
    allResolvedRollsById
  );
  const resolvedMovementStepCount = movementOutcome.diceValue;
  let nextState: GameState = {
    ...state,
    entities: applyEntityRuntimePatches(
      applyEntityRuntimePatches(state.entities, turnRollPlan.entityPatches),
      movementOutcome.entityPatches
    ),
  };
  const beforeTurn = executionContext.bus.publish("skill:before-turn", {
    state: nextState,
    context: {
      turnIndex: state.turnIndex,
      rollerId: actingEntityId,
      diceValue: resolvedMovementStepCount,
      cellIndex:
        findCellIndexForEntity(nextState.cells, actingEntityId) ??
        FINISH_LINE_CELL_INDEX,
    },
    segments: [],
  });
  nextState = beforeTurn.state;
  segments.push(...beforeTurn.segments);
  nextState = {
    ...nextState,
    lastRollById: {
      ...nextState.lastRollById,
      [actingEntityId]: turnRollPlan.initialDiceValue,
    },
  };
  nextState = appendLog(nextState, {
    kind: "roll",
    message: text("simulation.log.roll", {
      actor: characterParam(actingEntityId),
      value: turnRollPlan.initialDiceValue,
    }),
  });
  segments.push({
    kind: "roll",
    actorId: actingEntityId,
    value: turnRollPlan.initialDiceValue,
  });
  if (turnRollPlan.skillNarrative) {
    nextState = recordSkillTrigger(
      nextState,
      segments,
      actingEntityId,
      turnRollPlan.skillNarrative,
      turnRollPlan.skillBannerActionId
    );
  }
  if (movementOutcome.skillNarrative) {
    nextState = recordSkillTrigger(
      nextState,
      segments,
      actingEntityId,
      movementOutcome.skillNarrative,
      movementOutcome.skillBannerActionId
    );
  }
  const diceContext: SkillHookContext = {
    turnIndex: state.turnIndex,
    rollerId: actingEntityId,
    diceValue: resolvedMovementStepCount,
    cellIndex:
      findCellIndexForEntity(nextState.cells, actingEntityId) ??
      FINISH_LINE_CELL_INDEX,
  };
  const afterDice = executionContext.bus.publish("skill:after-dice", {
    state: nextState,
    context: diceContext,
    segments: [],
  });
  nextState = afterDice.state;
  segments.push(...afterDice.segments);
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
        rollValue: turnRollPlan.initialDiceValue,
      },
    ];
    const afterTurnSkipped = executionContext.bus.publish("skill:after-turn", {
      state: skippedState,
      context: {
        turnIndex: state.turnIndex,
        rollerId: actingEntityId,
        diceValue: resolvedMovementStepCount,
        cellIndex: activeCellIndex,
      },
      segments: [],
    });
    skippedState = afterTurnSkipped.state;
    skippedSegments.push(...afterTurnSkipped.segments);
    return finalizeResolvedTurn(
      finalizeActorTurnResolution(skippedState, actingEntityId, skippedSegments)
    );
  }
  let executedMovementStepCount = resolveExecutedMovementStepCount(
    nextState,
    actingEntityId,
    resolvedMovementStepCount,
    character.travelDirection
  );
  if (
    actingEntityId === "augusta" &&
    nextState.entities.augusta?.skillState.augustaGovernorAuthorityZeroMovePending
  ) {
    executedMovementStepCount = 0;
  }
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
  const postMovement = executionContext.bus.publish("movement:completed", {
    state: nextState,
    movementStartState,
    actingEntityId,
    diceValue: executedMovementStepCount,
    travelDirection: character.travelDirection,
    boardEffectByCellIndex,
    finalLandingCellIndex: movementResult.finalLandingCellIndex,
    finalLandingPreviousStackBottomToTop:
      movementResult.finalLandingPreviousStackBottomToTop,
    segments: [],
    telemetry,
  });
  const afterEffectState = postMovement.state;
  segments.push(...postMovement.segments);
  const finalCellIndex =
    findCellIndexForEntity(afterEffectState.cells, actingEntityId) ??
    FINISH_LINE_CELL_INDEX;
  const afterTurn = executionContext.bus.publish("skill:after-turn", {
    state: afterEffectState,
    context: {
      turnIndex: state.turnIndex,
      rollerId: actingEntityId,
      diceValue: executedMovementStepCount,
      cellIndex: finalCellIndex,
    },
    segments: [],
  });
  nextState = afterTurn.state;
  segments.push(...afterTurn.segments);
  return finalizeResolvedTurn(
    finalizeActorTurnResolution(nextState, actingEntityId, segments)
  );
}
