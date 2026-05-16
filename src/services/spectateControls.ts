import type { GameState } from "@/types/game";

export type SpectateControlGameSlice = {
  phase: GameState["phase"];
  winnerId: GameState["winnerId"];
  isAnimating: boolean;
  playTurnEnabled: boolean;
};

export type SpectateControlReplaySlice = {
  isReplayLoaded: boolean;
  timelineStep: number;
  timelineMax: number;
  spectateAutoActive: boolean;
  spectatePlayTurnChaining: boolean;
};

export type SpectateControlDisabledState = {
  stepDisabled: boolean;
  playTurnDisabled: boolean;
  autoRunDisabled: boolean;
};

export function computeSpectateControlDisabled(
  game: SpectateControlGameSlice,
  replay: SpectateControlReplaySlice
): SpectateControlDisabledState {
  const file = replay.isReplayLoaded;
  const stepDisabled = file
    ? game.isAnimating ||
      game.phase !== "running" ||
      Boolean(game.winnerId) ||
      replay.timelineStep >= replay.timelineMax
    : game.phase !== "running" ||
      Boolean(game.winnerId) ||
      game.isAnimating ||
      game.playTurnEnabled ||
      replay.spectateAutoActive;
  const playTurnDisabled = file
    ? game.isAnimating ||
      replay.spectatePlayTurnChaining ||
      replay.timelineStep >= replay.timelineMax
    : game.phase !== "running" ||
      Boolean(game.winnerId) ||
      game.isAnimating ||
      game.playTurnEnabled ||
      replay.spectateAutoActive;
  const autoRunDisabled = file
    ? game.isAnimating || replay.timelineStep >= replay.timelineMax
    : game.phase !== "running" || Boolean(game.winnerId);

  return { stepDisabled, playTurnDisabled, autoRunDisabled };
}
