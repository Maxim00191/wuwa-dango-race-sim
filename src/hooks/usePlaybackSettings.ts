import { useContext } from "react";
import {
  PlaybackSettingsContext,
  type PlaybackSettingsContextValue,
} from "@/hooks/playbackSettingsContext";

export function usePlaybackSettings(): PlaybackSettingsContextValue {
  const context = useContext(PlaybackSettingsContext);
  if (!context) {
    throw new Error(
      "usePlaybackSettings must be used within a PlaybackSettingsProvider"
    );
  }
  return context;
}
