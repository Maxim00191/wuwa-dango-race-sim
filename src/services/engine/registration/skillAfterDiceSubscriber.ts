import { ENGINE_EVENT_PRIORITY } from "@/services/engine/core/eventPriorities";
import type { EngineExecutionContext } from "@/services/engine/core/executionContext";
import { applySkillHookAfterDice } from "@/services/engine/skills/hooks/afterDice";
import { recordSkillTrigger } from "@/services/engine/state/mutations";

export function registerSkillAfterDiceSubscriber(
  executionContext: EngineExecutionContext
): void {
  executionContext.bus.subscribe(
    "skill:after-dice",
    (payload) => {
      const outcome = applySkillHookAfterDice(payload.state, payload.context);
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
