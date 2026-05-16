import type { GameShellSpectate } from "@/types/gameShell";
import type { GameState } from "@/types/game";

export type GameShellControlGameSlice = Pick<GameState, "phase" | "winnerId"> & {
  isAnimating: boolean;
  playTurnEnabled: boolean;
  autoPlayEnabled: boolean;
};

export type GameShellControlOptions = {
  onStartSprint?: () => void;
  startShortcutDisabled: boolean;
  spectate?: GameShellSpectate;
};

export type GameShellControlDisabledState = {
  nextTurnDisabled: boolean;
  keyboardEngineStepDisabled: boolean;
  playTurnDisabled: boolean;
  instantDisabled: boolean;
  startSprintDisabled: boolean;
  autoRunDisabled: boolean;
};

export function computeGameShellControlDisabled(
  game: GameShellControlGameSlice,
  options: GameShellControlOptions
): GameShellControlDisabledState {
  const { spectate } = options;
  const engineStepBlocked =
    game.phase !== "running" ||
    Boolean(game.winnerId) ||
    game.isAnimating ||
    game.playTurnEnabled ||
    game.autoPlayEnabled;

  return {
    nextTurnDisabled: spectate ? spectate.stepDisabled : engineStepBlocked,
    keyboardEngineStepDisabled:
      engineStepBlocked || Boolean(spectate?.autoActive),
    playTurnDisabled: spectate ? spectate.playTurnDisabled : engineStepBlocked,
    instantDisabled: engineStepBlocked || Boolean(spectate?.replayFileActive),
    startSprintDisabled:
      !options.onStartSprint ||
      options.startShortcutDisabled ||
      game.phase === "running",
    autoRunDisabled: spectate
      ? spectate.autoRunDisabled
      : game.phase !== "running" || Boolean(game.winnerId),
  };
}
