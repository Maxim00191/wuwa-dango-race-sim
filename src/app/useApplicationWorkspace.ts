import { useMemo } from "react";
import {
  useApplicationActions,
  useApplicationTheme,
  useKnockoutWorkspace,
  useMonteCarloWorkspace,
  useNavigationWorkspace,
  useNormalWorkspace,
  useSharedSimulation,
  useTournamentWorkspace,
} from "@/app/contexts/workspaceContexts";
import type { ApplicationWorkspaceState } from "@/app/useApplicationWorkspaceState";

export type ApplicationWorkspaceSelector<T> = (
  state: ApplicationWorkspaceState
) => T;

function useApplicationWorkspaceStateSnapshot(): ApplicationWorkspaceState {
  const navigation = useNavigationWorkspace();
  const shared = useSharedSimulation();
  const monteCarlo = useMonteCarloWorkspace();
  const normal = useNormalWorkspace();
  const knockout = useKnockoutWorkspace();
  const tournament = useTournamentWorkspace();
  const theme = useApplicationTheme();
  const actions = useApplicationActions();

  return useMemo(
    (): ApplicationWorkspaceState => ({
      navigation,
      shared,
      monteCarlo,
      normal,
      knockout,
      tournament,
      theme,
      formattedBuildTimestamp: actions.formattedBuildTimestamp,
      handleObserverWatchReplayJson: actions.handleObserverWatchReplayJson,
      navigateToAnalysisReturnView: actions.navigateToAnalysisReturnView,
    }),
    [
      actions.formattedBuildTimestamp,
      actions.handleObserverWatchReplayJson,
      actions.navigateToAnalysisReturnView,
      knockout,
      monteCarlo,
      navigation,
      normal,
      shared,
      theme,
      tournament,
    ]
  );
}

export function useApplicationWorkspace(): ApplicationWorkspaceState;
export function useApplicationWorkspace<T>(
  selector: ApplicationWorkspaceSelector<T>
): T;
export function useApplicationWorkspace<T>(
  selector?: ApplicationWorkspaceSelector<T>
): ApplicationWorkspaceState | T {
  const state = useApplicationWorkspaceStateSnapshot();
  if (!selector) {
    return state;
  }
  return selector(state);
}
