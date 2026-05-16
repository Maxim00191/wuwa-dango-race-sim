import { AnalysisDashboard } from "@/components/AnalysisDashboard";
import {
  useApplicationActions,
  useNavigationWorkspace,
} from "@/app/contexts/workspaceContexts";

export function AnalysisWorkspace() {
  const navigation = useNavigationWorkspace();
  const {
    handleObserverWatchReplayJson,
    navigateToAnalysisReturnView,
  } = useApplicationActions();

  return (
    <AnalysisDashboard
      snapshot={navigation.monteCarloSnapshot}
      onNavigateSimulation={navigateToAnalysisReturnView}
      onObserverWatchReplayJson={handleObserverWatchReplayJson}
    />
  );
}
