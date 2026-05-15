import { ENGINE_EVENT_PRIORITY } from "@/services/engine/core/eventPriorities";
import type { EngineExecutionContext } from "@/services/engine/core/executionContext";
import { applyRoundStartSkillHooks } from "@/services/engine/skills/round/batchRoundStart";

export function registerRoundStartSubscriber(
  executionContext: EngineExecutionContext
): void {
  executionContext.bus.subscribe(
    "round:start",
    (payload) => {
      const outcome = applyRoundStartSkillHooks(
        payload.state,
        payload.orderedActorIds
      );
      return {
        ...payload,
        state: outcome.state,
        openingSegments: [...payload.openingSegments, ...outcome.openingSegments],
      };
    },
    ENGINE_EVENT_PRIORITY.skillHooks
  );
}
