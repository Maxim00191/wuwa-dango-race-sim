import { useCallback, useMemo } from "react";
import { text } from "@/i18n";
import { useTranslation } from "@/i18n/useTranslation";
import type { useMapSelection } from "@/hooks/useMapSelection";
import type { useMonteCarloCoordinator } from "@/hooks/useMonteCarloCoordinator";
import type { UseGameOptions } from "@/hooks/useGame";
import {
  mergeSimulationDependencies,
  useSimulationDependencies,
  type SimulationDependencies,
} from "@/hooks/simulationDependencies";
import { mergeKnockoutParticipantIds } from "@/services/knockout/bracket";
import {
  isKnockoutMonteCarloRunDisabled,
  isKnockoutStartDisabled,
  isMapSelectorDisabled,
  isRaceControlsLocked,
} from "@/services/workspacePredicates";

type MapSelection = ReturnType<typeof useMapSelection>;
type MonteCarloCoordinator = ReturnType<typeof useMonteCarloCoordinator>;

export type UseKnockoutRaceWorkspaceOptions = {
  gameBoardOptions: UseGameOptions;
  mapSelection: MapSelection;
  monteCarlo: MonteCarloCoordinator;
  dependencies?: Partial<SimulationDependencies>;
};

export function useKnockoutRaceWorkspace({
  gameBoardOptions,
  mapSelection,
  monteCarlo,
  dependencies: dependencyOverrides,
}: UseKnockoutRaceWorkspaceOptions) {
  const { t, tText } = useTranslation();
  const deps = mergeSimulationDependencies(
    useSimulationDependencies(),
    dependencyOverrides
  );

  const lineup = deps.useKnockoutLineup();
  const tournament = deps.useKnockoutTournament(
    lineup.groupAIds,
    lineup.groupBIds,
    gameBoardOptions
  );
  const replay = deps.useReplayTimeline({
    onReplayBoardLoaded: mapSelection.syncFromBoardAssignments,
    onReplayCleared: mapSelection.clearReplayOverride,
    game: deps.createReplayGameBridge(tournament.race),
  });
  const spectate = deps.useGameShellSpectate(tournament.race, replay);

  const participantIds = useMemo(
    () => mergeKnockoutParticipantIds(lineup.groupAIds, lineup.groupBIds),
    [lineup.groupAIds, lineup.groupBIds]
  );

  const flushPlaybackAndClearRace = useCallback(() => {
    replay.flushPlaybackForNewSession();
    tournament.clearRace();
  }, [replay, tournament]);

  const flushPlaybackAndReset = useCallback(() => {
    replay.flushPlaybackForNewSession();
    tournament.resetTournament();
  }, [replay, tournament]);

  const beginPhase = useCallback(() => {
    replay.flushPlaybackForNewSession();
    if (tournament.progress.completedPhases.length === 0) {
      tournament.startTournament();
      return;
    }
    tournament.advanceTournament();
  }, [replay, tournament]);

  const requestMonteCarloBatch = useCallback(
    async (_scenarioId: string, totalGames: number) => {
      await monteCarlo.runScenario({
        totalGames,
        scenario: {
          kind: "knockoutTournament",
          groupAIds: lineup.groupAIds,
          groupBIds: lineup.groupBIds,
        },
        selectedBasicIds: participantIds,
        scenarioKind: "knockoutTournament",
        scenarioLabel: text("knockout.monteCarlo.scenario.analysisLabel"),
        returnView: "knockout",
        extremePerformance: monteCarlo.extremePerformanceEnabled,
      });
    },
    [lineup.groupAIds, lineup.groupBIds, monteCarlo, participantIds]
  );

  const monteCarloRunDisabled = isKnockoutMonteCarloRunDisabled(
    lineup.isReady,
    tournament.race.isAnimating,
    replay.isReplayLoaded
  );

  const controlsLocked = isRaceControlsLocked(
    tournament.race.state.phase,
    tournament.race.isAnimating
  );

  const startDisabled = isKnockoutStartDisabled({
    controlsLocked,
    lineupReady: lineup.isReady,
    replayLoaded: replay.isReplayLoaded,
  });

  const sessionLabel =
    tournament.race.state.phase === "running"
      ? tournament.race.state.label
        ? tText(tournament.race.state.label)
        : t("knockout.session.setup")
      : tournament.race.state.phase === "finished"
        ? tournament.race.state.label
          ? tText(tournament.race.state.label)
          : t("knockout.session.setup")
        : tText(tournament.sessionLabel);

  const mapSelectorDisabled = isMapSelectorDisabled({
    phase: tournament.race.state.phase,
    isAnimating: tournament.race.isAnimating,
    replayLoaded: replay.isReplayLoaded,
  });

  return {
    lineup,
    tournament,
    replay,
    spectate,
    participantIds,
    flushPlaybackAndClearRace,
    flushPlaybackAndReset,
    beginPhase,
    requestMonteCarloBatch,
    monteCarloRunDisabled,
    controlsLocked,
    startDisabled,
    sessionLabel,
    mapSelectorDisabled,
  };
}
