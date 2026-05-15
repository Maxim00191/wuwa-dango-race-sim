import { FINISH_LINE_CELL_INDEX } from "@/constants/board";
import { ABBY_ID } from "@/constants/ids";
import { text } from "@/i18n";
import { orderedBasicRacerIdsForLeaderboard } from "@/services/racerRanking";
import type { EngineExecutionContext } from "@/services/engine/core/executionContext";
import { createTurnRollPlans } from "@/services/engine/lifecycle/dicePlans";
import { buildRoundActorOrder } from "@/services/engine/lifecycle/roundOrder";
import { buildPendingTurnResolution } from "@/services/engine/lifecycle/pendingAndPlayback";
import { applyTurnRollPlanPatches } from "@/services/engine/skills/plans/turnRollPlanPatches";
import { appendLog } from "@/services/engine/state/mutations";
import { teleportAbbyToStartLine } from "@/services/engine/victory/abby";
import { captureHeadlessSkillActivations } from "@/services/engine/headless/telemetry";
import { findCellIndexForEntity } from "@/services/stateCells";
import type {
  GameState,
  PendingTurnResolution,
  PlaybackSegment,
} from "@/types/game";

export function openNextTurnWithDicePlans(
  state: GameState,
  executionContext: EngineExecutionContext
): {
  state: GameState;
  pendingTurn: PendingTurnResolution;
  openingSegments: PlaybackSegment[];
} {
  let nextState = state;
  let openingSegments: PlaybackSegment[] = [];
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
  const orderedActorIds = roundOrder.orderedActors;
  const roundStarted = executionContext.bus.publish("round:start", {
    state: nextState,
    orderedActorIds,
    openingSegments,
  });
  nextState = roundStarted.state;
  openingSegments = roundStarted.openingSegments;
  const {
    plansByActorId: initialPlansByActorId,
    allInitialRollsById,
    allResolvedRollsById,
  } = createTurnRollPlans(nextState, orderedActorIds);
  let plansByActorId = initialPlansByActorId;
  for (const actorId of orderedActorIds) {
    const afterTurnRolls = executionContext.bus.publish("skill:after-turn-rolls", {
      state: nextState,
      context: {
        actorId,
        rankedBasicIds: orderedBasicRacerIdsForLeaderboard(nextState),
        plansByActorId,
        allInitialRollsById,
        allResolvedRollsById,
      },
      openingSegments,
    });
    nextState = afterTurnRolls.state;
    openingSegments = afterTurnRolls.openingSegments;
    plansByActorId = applyTurnRollPlanPatches(
      plansByActorId,
      afterTurnRolls.planPatches
    );
  }
  const pendingTurn = buildPendingTurnResolution(
    orderedActorIds,
    plansByActorId,
    allInitialRollsById,
    allResolvedRollsById
  );
  if (executionContext.telemetry) {
    captureHeadlessSkillActivations(
      state,
      nextState,
      executionContext.telemetry,
      nextState.turnIndex
    );
  }
  return { state: nextState, pendingTurn, openingSegments };
}
