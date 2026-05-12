export const PLAYBACK_SPEED_OPTIONS = [1, 2, 4, 8] as const;

export type PlaybackSpeedMultiplier = (typeof PLAYBACK_SPEED_OPTIONS)[number];

export const DEFAULT_PLAYBACK_SPEED_MULTIPLIER: PlaybackSpeedMultiplier = 2;

const PLAYBACK_BASELINE_SPEED_MULTIPLIER = 2;

export function scalePlaybackDurationMs(
  baseDurationMs: number,
  speedMultiplier: PlaybackSpeedMultiplier
): number {
  return Math.max(
    0,
    Math.round(
      (baseDurationMs * PLAYBACK_BASELINE_SPEED_MULTIPLIER) / speedMultiplier
    )
  );
}
