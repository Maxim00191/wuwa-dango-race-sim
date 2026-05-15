import { ENGINE_EVENT_PRIORITY } from "@/services/engine/core/eventPriorities";
import type { EngineExecutionContext } from "@/services/engine/core/executionContext";
import { applyRoundEndSkillHooks } from "@/services/engine/skills/round/batchRoundEnd";

export function registerRoundEndSubscriber(
  executionContext: EngineExecutionContext
): void {
  executionContext.bus.subscribe(
    "round:end",
    (payload) => {
      const outcome = applyRoundEndSkillHooks(
        payload.state,
        payload.orderedActorIds
      );
      return {
        ...payload,
        state: outcome.state,
        closingSegments: [...payload.closingSegments, ...outcome.closingSegments],
      };
    },
    ENGINE_EVENT_PRIORITY.skillHooks
  );
}
