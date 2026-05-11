import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const PLAYBACK_SPEED_OPTIONS = [1, 2, 4, 8] as const;

export type PlaybackSpeedMultiplier = (typeof PLAYBACK_SPEED_OPTIONS)[number];

export const DEFAULT_PLAYBACK_SPEED_MULTIPLIER: PlaybackSpeedMultiplier = 2;

const PLAYBACK_SPEED_STORAGE_KEY = "wuwa-dango-race-sim-playback-speed";
const PLAYBACK_BASELINE_SPEED_MULTIPLIER = 2;

type PlaybackSettingsContextValue = {
  speedMultiplier: PlaybackSpeedMultiplier;
  setSpeedMultiplier: (nextValue: PlaybackSpeedMultiplier) => void;
  scaleDurationMs: (baseDurationMs: number) => number;
};

const PlaybackSettingsContext =
  createContext<PlaybackSettingsContextValue | null>(null);

function isPlaybackSpeedMultiplier(
  value: number
): value is PlaybackSpeedMultiplier {
  return PLAYBACK_SPEED_OPTIONS.includes(value as PlaybackSpeedMultiplier);
}

function readStoredPlaybackSpeedMultiplier(): PlaybackSpeedMultiplier {
  if (typeof window === "undefined") {
    return DEFAULT_PLAYBACK_SPEED_MULTIPLIER;
  }
  const stored = window.localStorage.getItem(PLAYBACK_SPEED_STORAGE_KEY);
  if (stored === null) {
    return DEFAULT_PLAYBACK_SPEED_MULTIPLIER;
  }
  const parsed = Number(stored);
  return isPlaybackSpeedMultiplier(parsed)
    ? parsed
    : DEFAULT_PLAYBACK_SPEED_MULTIPLIER;
}

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

export function PlaybackSettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [speedMultiplier, setSpeedMultiplier] =
    useState<PlaybackSpeedMultiplier>(readStoredPlaybackSpeedMultiplier);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      PLAYBACK_SPEED_STORAGE_KEY,
      String(speedMultiplier)
    );
  }, [speedMultiplier]);

  const scaleDurationMs = useCallback(
    (baseDurationMs: number) =>
      scalePlaybackDurationMs(baseDurationMs, speedMultiplier),
    [speedMultiplier]
  );

  const value = useMemo(
    () => ({
      speedMultiplier,
      setSpeedMultiplier,
      scaleDurationMs,
    }),
    [scaleDurationMs, speedMultiplier]
  );

  return (
    <PlaybackSettingsContext.Provider value={value}>
      {children}
    </PlaybackSettingsContext.Provider>
  );
}

export function usePlaybackSettings(): PlaybackSettingsContextValue {
  const context = useContext(PlaybackSettingsContext);
  if (!context) {
    throw new Error(
      "usePlaybackSettings must be used within a PlaybackSettingsProvider"
    );
  }
  return context;
}
