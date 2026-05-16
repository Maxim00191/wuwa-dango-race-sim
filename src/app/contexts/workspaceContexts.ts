import { createContextSelector } from "@/lib/createContextSelector";
import type { useKnockoutRaceWorkspace } from "@/hooks/useKnockoutRaceWorkspace";
import type { useMonteCarloCoordinator } from "@/hooks/useMonteCarloCoordinator";
import type { useNormalRaceWorkspace } from "@/hooks/useNormalRaceWorkspace";
import type { useSharedSimulationContext } from "@/hooks/useSharedSimulationContext";
import type { useTheme } from "@/hooks/useTheme";
import type { useTournamentRaceWorkspace } from "@/hooks/useTournamentRaceWorkspace";
import type { useWorkspaceNavigation } from "@/hooks/useWorkspaceNavigation";

export type NavigationWorkspaceValue = ReturnType<typeof useWorkspaceNavigation>;

export type SharedSimulationValue = ReturnType<typeof useSharedSimulationContext>;

export type MonteCarloWorkspaceValue = ReturnType<typeof useMonteCarloCoordinator>;

export type NormalWorkspaceValue = ReturnType<typeof useNormalRaceWorkspace>;

export type KnockoutWorkspaceValue = ReturnType<typeof useKnockoutRaceWorkspace>;

export type TournamentWorkspaceValue = ReturnType<typeof useTournamentRaceWorkspace>;

export type ApplicationThemeValue = ReturnType<typeof useTheme>;

export type ApplicationActionsValue = {
  formattedBuildTimestamp: string;
  handleObserverWatchReplayJson: (json: string) => void;
  navigateToAnalysisReturnView: () => void;
};

const navigationWorkspace = createContextSelector<NavigationWorkspaceValue>(
  "NavigationWorkspace"
);

const sharedSimulation = createContextSelector<SharedSimulationValue>(
  "SharedSimulation"
);

const monteCarloWorkspace = createContextSelector<MonteCarloWorkspaceValue>(
  "MonteCarloWorkspace"
);

const normalWorkspace = createContextSelector<NormalWorkspaceValue>(
  "NormalWorkspace"
);

const knockoutWorkspace = createContextSelector<KnockoutWorkspaceValue>(
  "KnockoutWorkspace"
);

const tournamentWorkspace = createContextSelector<TournamentWorkspaceValue>(
  "TournamentWorkspace"
);

const applicationTheme = createContextSelector<ApplicationThemeValue>(
  "ApplicationTheme"
);

const applicationActions = createContextSelector<ApplicationActionsValue>(
  "ApplicationActions"
);

export const NavigationWorkspaceProvider = navigationWorkspace.Provider;
export const SharedSimulationProvider = sharedSimulation.Provider;
export const MonteCarloWorkspaceProvider = monteCarloWorkspace.Provider;
export const NormalWorkspaceProvider = normalWorkspace.Provider;
export const KnockoutWorkspaceProvider = knockoutWorkspace.Provider;
export const TournamentWorkspaceProvider = tournamentWorkspace.Provider;
export const ApplicationThemeProvider = applicationTheme.Provider;
export const ApplicationActionsProvider = applicationActions.Provider;

export const useNavigationWorkspace = navigationWorkspace.useContextValue;
export const useNavigationWorkspaceSelector =
  navigationWorkspace.useContextSelector;

export const useSharedSimulation = sharedSimulation.useContextValue;
export const useSharedSimulationSelector = sharedSimulation.useContextSelector;

export const useMonteCarloWorkspace = monteCarloWorkspace.useContextValue;
export const useMonteCarloWorkspaceSelector =
  monteCarloWorkspace.useContextSelector;

export const useNormalWorkspace = normalWorkspace.useContextValue;
export const useNormalWorkspaceSelector = normalWorkspace.useContextSelector;

export const useKnockoutWorkspace = knockoutWorkspace.useContextValue;
export const useKnockoutWorkspaceSelector = knockoutWorkspace.useContextSelector;

export const useTournamentWorkspace = tournamentWorkspace.useContextValue;
export const useTournamentWorkspaceSelector =
  tournamentWorkspace.useContextSelector;

export const useApplicationTheme = applicationTheme.useContextValue;
export const useApplicationThemeSelector = applicationTheme.useContextSelector;

export const useApplicationActions = applicationActions.useContextValue;
export const useApplicationActionsSelector =
  applicationActions.useContextSelector;
