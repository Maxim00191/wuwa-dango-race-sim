import { useMemo } from "react";
import { useMonteCarloWorkspace } from "@/app/contexts/workspaceContexts";
import type { RaceWorkspaceMonteCarloCoordinator } from "@/types/workspace";

export function useRaceWorkspaceMonteCarloCoordinator(): RaceWorkspaceMonteCarloCoordinator {
  const monteCarlo = useMonteCarloWorkspace();

  return useMemo(
    () => ({
      isStopping: monteCarlo.monteCarlo.isStopping,
      extremePerformanceEnabled: monteCarlo.extremePerformanceEnabled,
      onExtremePerformanceEnabledChange: monteCarlo.setExtremePerformanceEnabled,
      onAbortRun: monteCarlo.abortRun,
    }),
    [
      monteCarlo.monteCarlo.isStopping,
      monteCarlo.extremePerformanceEnabled,
      monteCarlo.setExtremePerformanceEnabled,
      monteCarlo.abortRun,
    ]
  );
}
