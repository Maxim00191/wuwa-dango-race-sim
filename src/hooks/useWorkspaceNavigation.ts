import { useCallback, useState } from "react";
import type { WorkspaceView } from "@/components/AppNavigation";
import type { MonteCarloAggregateSnapshot } from "@/types/monteCarlo";

export function useWorkspaceNavigation() {
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("normal");
  const [analysisReturnView, setAnalysisReturnView] =
    useState<Exclude<WorkspaceView, "analysis">>("normal");
  const [monteCarloSnapshot, setMonteCarloSnapshot] =
    useState<MonteCarloAggregateSnapshot | null>(null);

  const handleMonteCarloComplete = useCallback(
    (
      snapshot: MonteCarloAggregateSnapshot,
      returnView: Exclude<WorkspaceView, "analysis">
    ) => {
      setMonteCarloSnapshot(snapshot);
      setAnalysisReturnView(returnView);
      setWorkspaceView("analysis");
    },
    []
  );

  return {
    workspaceView,
    setWorkspaceView,
    analysisReturnView,
    monteCarloSnapshot,
    handleMonteCarloComplete,
  };
}
