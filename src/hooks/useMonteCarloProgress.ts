import { useSyncExternalStore, useMemo } from "react";
import { progressStore } from "@/services/monteCarlo/progressStore";

export function useMonteCarloProgress() {
  const progress = useSyncExternalStore(
    (l) => {
      try {
        return progressStore.subscribe(() => l());
      } catch (e) {
        console.error("Failed to subscribe to progressStore", e);
        return () => {};
      }
    },
    () => {
      try {
        return progressStore.getState();
      } catch (e) {
        console.error("Failed to get state from progressStore", e);
        return null;
      }
    }
  );

  const progressRatio = useMemo(() => {
    if (!progress || progress.totalGames <= 0) return 0;
    return progress.completedGames / progress.totalGames;
  }, [progress]);

  return {
    progress,
    progressRatio,
    isRunning: progress !== null,
  };
}
