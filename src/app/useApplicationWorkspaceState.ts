import { useCallback, useMemo } from "react";
import { useNotification } from "@/app/notifications/useNotification";
import { useKnockoutRaceWorkspace } from "@/hooks/useKnockoutRaceWorkspace";
import { useMonteCarloCoordinator } from "@/hooks/useMonteCarloCoordinator";
import { useNormalRaceWorkspace } from "@/hooks/useNormalRaceWorkspace";
import { useSharedSimulationContext } from "@/hooks/useSharedSimulationContext";
import { useTheme } from "@/hooks/useTheme";
import { useTournamentRaceWorkspace } from "@/hooks/useTournamentRaceWorkspace";
import { useWorkspaceNavigation } from "@/hooks/useWorkspaceNavigation";
import { useTranslation } from "@/i18n/useTranslation";
import { routeObserverReplayImport } from "@/services/observerReplayRouting";

export function useApplicationWorkspaceState() {
  const { t } = useTranslation();
  const notify = useNotification();
  const navigation = useWorkspaceNavigation();
  const shared = useSharedSimulationContext(navigation.workspaceView);
  const monteCarlo = useMonteCarloCoordinator(
    shared.mapSelection,
    navigation.handleMonteCarloComplete
  );
  const normal = useNormalRaceWorkspace({
    gameBoardOptions: shared.gameBoardOptions,
    mapSelection: shared.mapSelection,
    lineup: shared.lineup,
    monteCarlo,
  });
  const knockout = useKnockoutRaceWorkspace({
    gameBoardOptions: shared.gameBoardOptions,
    mapSelection: shared.mapSelection,
    monteCarlo,
  });
  const tournament = useTournamentRaceWorkspace({
    gameBoardOptions: shared.gameBoardOptions,
    mapSelection: shared.mapSelection,
    lineup: shared.lineup,
    monteCarlo,
  });
  const theme = useTheme();
  const formattedBuildTimestamp = useMemo(() => {
    const buildDate = new Date(__BUILD_TIMESTAMP__);
    return Number.isNaN(buildDate.getTime())
      ? __BUILD_TIMESTAMP__
      : buildDate.toLocaleString();
  }, []);

  const handleObserverWatchReplayJson = useCallback(
    (json: string) => {
      const result = routeObserverReplayImport({
        json,
        analysisReturnView: navigation.analysisReturnView,
        normal: {
          flushPlayback: normal.replay.flushPlaybackForNewSession,
          readReplayFromJsonText: normal.replay.readReplayFromJsonText,
        },
        knockout: {
          flushPlayback: knockout.replay.flushPlaybackForNewSession,
          readReplayFromJsonText: knockout.replay.readReplayFromJsonText,
        },
        tournament: {
          flushPlayback: tournament.replay.flushPlaybackForNewSession,
          readReplayFromJsonText: tournament.replay.readReplayFromJsonText,
        },
        setWorkspaceView: navigation.setWorkspaceView,
      });
      if (!result.ok) {
        notify(t("game.replay.importInvalid"));
      }
    },
    [
      knockout.replay,
      navigation,
      normal.replay,
      notify,
      t,
      tournament.replay,
    ]
  );

  const navigateToAnalysisReturnView = useCallback(() => {
    navigation.setWorkspaceView(navigation.analysisReturnView);
  }, [navigation]);

  return {
    navigation,
    shared,
    monteCarlo,
    normal,
    knockout,
    tournament,
    theme,
    formattedBuildTimestamp,
    handleObserverWatchReplayJson,
    navigateToAnalysisReturnView,
  };
}

export type ApplicationWorkspaceState = ReturnType<
  typeof useApplicationWorkspaceState
>;

export type SimulationWorkspaceView = Exclude<
  ApplicationWorkspaceState["navigation"]["workspaceView"],
  "analysis"
>;
