import { useState } from "react";
import type { WorkspaceView } from "@/components/AppNavigation";
import { useMonteCarloSimulation } from "@/hooks/useMonteCarloSimulation";
import type { useMapSelection } from "@/hooks/useMapSelection";
import type { MonteCarloAggregateSnapshot } from "@/types/monteCarlo";

type MapSelection = ReturnType<typeof useMapSelection>;

export type MonteCarloCompleteHandler = (
  snapshot: MonteCarloAggregateSnapshot,
  returnView: Exclude<WorkspaceView, "analysis">
) => void;

export function useMonteCarloCoordinator(
  mapSelection: MapSelection,
  onComplete: MonteCarloCompleteHandler
) {
  const [extremePerformanceEnabled, setExtremePerformanceEnabled] =
    useState(false);
  const monteCarlo = useMonteCarloSimulation({
    boardEffectByCellIndex: mapSelection.boardEffects,
    onComplete,
  });

  return {
    monteCarlo,
    extremePerformanceEnabled,
    setExtremePerformanceEnabled,
    runScenario: monteCarlo.runScenario,
    abortRun: monteCarlo.abortRun,
  };
}
