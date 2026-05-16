import type { useGame } from "@/hooks/useGame";
import type { UseReplayTimelineOptions } from "@/hooks/useReplayTimeline";

export function createReplayGameBridge(
  game: ReturnType<typeof useGame>
): UseReplayTimelineOptions["game"] {
  return {
    state: game.state,
    reset: game.reset,
    hydrateEngineState: game.hydrateEngineState,
    stepAction: game.stepAction,
    playTurn: game.playTurn,
    setAutoPlayEnabled: game.setAutoPlayEnabled,
    isAnimating: game.isAnimating,
    boardEffects: game.boardEffects,
    autoPlayEnabled: game.autoPlayEnabled,
    getLastRaceSetup: game.getLastRaceSetup,
  };
}
