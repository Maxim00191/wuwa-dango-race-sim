import { ENGINE_EVENT_PRIORITY } from "@/services/engine/core/eventPriorities";
import type { EngineExecutionContext } from "@/services/engine/core/executionContext";
import { applySkillHookAfterTurn } from "@/services/engine/skills/hooks/afterTurn";
import { recordSkillTrigger } from "@/services/engine/state/mutations";

export function registerSkillAfterTurnSubscriber(
  executionContext: EngineExecutionContext
): void {
  executionContext.bus.subscribe(
    "skill:after-turn",
    (payload) => {
      const outcome = applySkillHookAfterTurn(payload.state, payload.context);
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
      return { ...payload, state: nextState, segments };
    },
    ENGINE_EVENT_PRIORITY.skillHooks
  );
}
