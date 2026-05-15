import { ENGINE_EVENT_PRIORITY } from "@/services/engine/core/eventPriorities";
import type { EngineExecutionContext } from "@/services/engine/core/executionContext";
import { resolvePostMovementPhase } from "@/services/engine/movement/postMovement/resolvePostMovementPhase";

export function registerMovementCompletedSubscriber(
  executionContext: EngineExecutionContext
): void {
  executionContext.bus.subscribe(
    "movement:completed",
    (payload) => {
      const outcome = resolvePostMovementPhase(
        payload.state,
        payload.movementStartState,
        payload.actingEntityId,
        payload.diceValue,
        payload.travelDirection,
        payload.boardEffectByCellIndex,
        payload.finalLandingCellIndex,
        payload.finalLandingPreviousStackBottomToTop,
        payload.telemetry
      );
      return {
        ...payload,
        state: outcome.state,
        segments: [...payload.segments, ...outcome.segments],
      };
    },
    ENGINE_EVENT_PRIORITY.movementResolution
  );
}
