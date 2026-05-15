import type { EngineExecutionContext } from "@/services/engine/core/executionContext";
import { registerMovementCompletedSubscriber } from "@/services/engine/registration/movementCompletedSubscriber";
import { registerRoundEndSubscriber } from "@/services/engine/registration/roundEndSubscriber";
import { registerRoundStartSubscriber } from "@/services/engine/registration/roundStartSubscriber";
import { registerSkillAfterDiceSubscriber } from "@/services/engine/registration/skillAfterDiceSubscriber";
import { registerSkillAfterTurnRollsSubscriber } from "@/services/engine/registration/skillAfterTurnRollsSubscriber";
import { registerSkillAfterTurnSubscriber } from "@/services/engine/registration/skillAfterTurnSubscriber";
import { registerSkillBeforeTurnSubscriber } from "@/services/engine/registration/skillBeforeTurnSubscriber";

export function registerEngineModules(
  executionContext: EngineExecutionContext
): void {
  registerRoundStartSubscriber(executionContext);
  registerRoundEndSubscriber(executionContext);
  registerSkillBeforeTurnSubscriber(executionContext);
  registerSkillAfterDiceSubscriber(executionContext);
  registerSkillAfterTurnSubscriber(executionContext);
  registerSkillAfterTurnRollsSubscriber(executionContext);
  registerMovementCompletedSubscriber(executionContext);
}
