import { useMemo, type ComponentType, type ReactNode } from "react";
import {
  ApplicationActionsProvider,
  ApplicationThemeProvider,
  KnockoutWorkspaceProvider,
  MonteCarloWorkspaceProvider,
  NavigationWorkspaceProvider,
  NormalWorkspaceProvider,
  SharedSimulationProvider,
  TournamentWorkspaceProvider,
  type ApplicationActionsValue,
  type ApplicationThemeValue,
  type KnockoutWorkspaceValue,
  type MonteCarloWorkspaceValue,
  type NavigationWorkspaceValue,
  type NormalWorkspaceValue,
  type SharedSimulationValue,
  type TournamentWorkspaceValue,
} from "@/app/contexts/workspaceContexts";
import {
  useApplicationWorkspaceState,
  type ApplicationWorkspaceState,
} from "@/app/useApplicationWorkspaceState";
import {
  composeProviders,
  type AppProviderComponent,
} from "@/app/providerComposition";

export type ApplicationWorkspaceProviderProps = {
  children: ReactNode;
  value?: ApplicationWorkspaceState;
};

function createValueProvider<T>(
  Provider: ComponentType<{ value: T; children: ReactNode }>,
  value: T
): AppProviderComponent {
  function BoundProvider({ children }: { children: ReactNode }) {
    return <Provider value={value}>{children}</Provider>;
  }
  return BoundProvider;
}

type WorkspaceProviderValues = {
  navigation: NavigationWorkspaceValue;
  shared: SharedSimulationValue;
  monteCarlo: MonteCarloWorkspaceValue;
  normal: NormalWorkspaceValue;
  knockout: KnockoutWorkspaceValue;
  tournament: TournamentWorkspaceValue;
  theme: ApplicationThemeValue;
  actions: ApplicationActionsValue;
};

function buildWorkspaceProviders({
  navigation,
  shared,
  monteCarlo,
  normal,
  knockout,
  tournament,
  theme,
  actions,
}: WorkspaceProviderValues): AppProviderComponent[] {
  return [
    createValueProvider(NavigationWorkspaceProvider, navigation),
    createValueProvider(SharedSimulationProvider, shared),
    createValueProvider(MonteCarloWorkspaceProvider, monteCarlo),
    createValueProvider(NormalWorkspaceProvider, normal),
    createValueProvider(KnockoutWorkspaceProvider, knockout),
    createValueProvider(TournamentWorkspaceProvider, tournament),
    createValueProvider(ApplicationThemeProvider, theme),
    createValueProvider(ApplicationActionsProvider, actions),
  ];
}

export function ApplicationWorkspaceProvider({
  children,
  value,
}: ApplicationWorkspaceProviderProps) {
  const defaultValue = useApplicationWorkspaceState();
  const resolvedValue = value ?? defaultValue;

  const actions = useMemo(
    (): ApplicationActionsValue => ({
      formattedBuildTimestamp: resolvedValue.formattedBuildTimestamp,
      handleObserverWatchReplayJson:
        resolvedValue.handleObserverWatchReplayJson,
      navigateToAnalysisReturnView: resolvedValue.navigateToAnalysisReturnView,
    }),
    [
      resolvedValue.formattedBuildTimestamp,
      resolvedValue.handleObserverWatchReplayJson,
      resolvedValue.navigateToAnalysisReturnView,
    ]
  );

  const providers = useMemo(
    () =>
      buildWorkspaceProviders({
        navigation: resolvedValue.navigation,
        shared: resolvedValue.shared,
        monteCarlo: resolvedValue.monteCarlo,
        normal: resolvedValue.normal,
        knockout: resolvedValue.knockout,
        tournament: resolvedValue.tournament,
        theme: resolvedValue.theme,
        actions,
      }),
    [
      actions,
      resolvedValue.knockout,
      resolvedValue.monteCarlo,
      resolvedValue.navigation,
      resolvedValue.normal,
      resolvedValue.shared,
      resolvedValue.theme,
      resolvedValue.tournament,
    ]
  );

  return composeProviders(children, providers);
}
