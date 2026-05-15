import { ENGINE_EVENT_PRIORITY } from "@/services/engine/core/eventPriorities";
import type { EngineExecutionContext } from "@/services/engine/core/executionContext";
import { applySkillHookBeforeTurn } from "@/services/engine/skills/hooks/beforeTurn";
import { recordSkillTrigger } from "@/services/engine/state/mutations";

export function registerSkillBeforeTurnSubscriber(
  executionContext: EngineExecutionContext
): void {
  executionContext.bus.subscribe(
    "skill:before-turn",
    (payload) => {
      const outcome = applySkillHookBeforeTurn(payload.state, payload.context);
      let nextState = outcome.state;
      const segments = [...payload.segments, ...outcome.segments];
      if (outcome.skillNarrative) {
        nextState = recordSkillTrigger(
          nextState,
          segments,
          payload.context.rollerId,
          outcome.skillNarrative,
          outcome.skillBannerActionId
        );
      }
      return {
        ...payload,
        state: nextState,
        segments,
        turnRollPlanPatch: outcome.turnRollPlanPatch,
      };
    },
    ENGINE_EVENT_PRIORITY.skillHooks
  );
}
