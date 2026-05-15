import { ENGINE_EVENT_PRIORITY } from "@/services/engine/core/eventPriorities";
import type { EngineExecutionContext } from "@/services/engine/core/executionContext";
import { applySkillHookAfterTurnRolls } from "@/services/engine/skills/hooks/afterTurnRolls";
import { recordSkillTrigger } from "@/services/engine/state/mutations";

export function registerSkillAfterTurnRollsSubscriber(
  executionContext: EngineExecutionContext
): void {
  executionContext.bus.subscribe(
    "skill:after-turn-rolls",
    (payload) => {
      const outcome = applySkillHookAfterTurnRolls(payload.state, payload.context);
      let nextState = outcome.state;
      const openingSegments = [...payload.openingSegments];
      if (outcome.skillNarrative) {
        nextState = recordSkillTrigger(
          nextState,
          openingSegments,
          payload.context.actorId,
          outcome.skillNarrative,
          outcome.skillBannerActionId
        );
      }
      return {
        ...payload,
        state: nextState,
        openingSegments,
        planPatches: outcome.planPatches,
      };
    },
    ENGINE_EVENT_PRIORITY.skillHooks
  );
}
