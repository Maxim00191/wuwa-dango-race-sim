import { createContext } from "react";
import type { PlaybackSpeedMultiplier } from "@/hooks/playbackSettings";

export type PlaybackSettingsContextValue = {
  speedMultiplier: PlaybackSpeedMultiplier;
  setSpeedMultiplier: (nextValue: PlaybackSpeedMultiplier) => void;
  scaleDurationMs: (baseDurationMs: number) => number;
};

export const PlaybackSettingsContext =
  createContext<PlaybackSettingsContextValue | null>(null);
