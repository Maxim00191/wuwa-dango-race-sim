import { useCallback, useMemo, useState } from "react";
import { text } from "@/i18n";
import { useTranslation } from "@/i18n/useTranslation";
import type { useLineupSelection } from "@/hooks/useLineupSelection";
import type { useMapSelection } from "@/hooks/useMapSelection";
import type { useMonteCarloCoordinator } from "@/hooks/useMonteCarloCoordinator";
import type { UseGameOptions } from "@/hooks/useGame";
import {
  mergeSimulationDependencies,
  useSimulationDependencies,
  type SimulationDependencies,
} from "@/hooks/simulationDependencies";
import { isValidBasicSelection } from "@/services/gameEngine";
import {
  resolveTournamentFinalRaceSetup,
  shouldUseOfficialTournamentFinalSetup,
} from "@/services/tournamentFinalSetup";
import {
  isMapSelectorDisabled,
  isRaceControlsLocked,
  resolveActiveLineupBasicIds,
} from "@/services/workspacePredicates";

type LineupSelection = ReturnType<typeof useLineupSelection>;
type MapSelection = ReturnType<typeof useMapSelection>;
type MonteCarloCoordinator = ReturnType<typeof useMonteCarloCoordinator>;

export type UseTournamentRaceWorkspaceOptions = {
  gameBoardOptions: UseGameOptions;
  mapSelection: MapSelection;
  lineup: LineupSelection;
  monteCarlo: MonteCarloCoordinator;
  dependencies?: Partial<SimulationDependencies>;
};

export function useTournamentRaceWorkspace({
  gameBoardOptions,
  mapSelection,
  lineup,
  monteCarlo,
  dependencies: dependencyOverrides,
}: UseTournamentRaceWorkspaceOptions) {
  const { t, tText } = useTranslation();
  const deps = mergeSimulationDependencies(
    useSimulationDependencies(),
    dependencyOverrides
  );

  const [selectedMonteCarloScenarioId, setSelectedMonteCarloScenarioId] =
    useState<"tournament" | "final">("tournament");
  const tournament = deps.useTournament(lineup.selectedBasicIds, gameBoardOptions);
  const replay = deps.useReplayTimeline({
    onReplayBoardLoaded: mapSelection.syncFromBoardAssignments,
    onReplayCleared: mapSelection.clearReplayOverride,
    game: deps.createReplayGameBridge(tournament.race),
  });
  const spectate = deps.useGameShellSpectate(tournament.race, replay);

  const resolvedLineupBasicIds = useMemo(
    () =>
      resolveActiveLineupBasicIds(
        tournament.race.state.phase,
        lineup.selectedBasicIds,
        tournament.race.state.activeBasicIds
      ),
    [
      lineup.selectedBasicIds,
      tournament.race.state.activeBasicIds,
      tournament.race.state.phase,
    ]
  );

  const flushPlaybackAndClearRace = useCallback(() => {
    replay.flushPlaybackForNewSession();
    tournament.clearRace();
  }, [replay, tournament]);

  const flushPlaybackAndResetTournament = useCallback(() => {
    replay.flushPlaybackForNewSession();
    tournament.resetTournament();
  }, [replay, tournament]);

  const beginPreliminary = useCallback(() => {
    replay.flushPlaybackForNewSession();
    tournament.startPreliminary();
  }, [replay, tournament]);

  const beginFinal = useCallback(() => {
    replay.flushPlaybackForNewSession();
    tournament.startFinal();
  }, [replay, tournament]);

  const requestMonteCarloBatch = useCallback(
    async (scenarioId: string, totalGames: number) => {
      if (scenarioId === "tournament") {
        await monteCarlo.runScenario({
          totalGames,
          scenario: {
            kind: "tournament",
            selectedBasicIds: resolvedLineupBasicIds,
          },
          selectedBasicIds: resolvedLineupBasicIds,
          scenarioKind: "tournament",
          scenarioLabel: text(
            "tournament.monteCarlo.scenarios.tournament.analysisLabel"
          ),
          returnView: "tournament",
          extremePerformance: monteCarlo.extremePerformanceEnabled,
        });
        return;
      }

      const useOfficialTournamentFinal = shouldUseOfficialTournamentFinalSetup(
        tournament.preliminaryPlacements,
        tournament.finalPlacements
      );
      const finalSetup = resolveTournamentFinalRaceSetup(
        tournament.preliminaryPlacements,
        tournament.finalPlacements
      );
      await monteCarlo.runScenario({
        totalGames,
        scenario: {
          kind: "singleRace",
          setup: finalSetup,
        },
        selectedBasicIds: finalSetup.selectedBasicIds,
        scenarioKind: "final",
        scenarioLabel: useOfficialTournamentFinal
          ? text("tournament.monteCarlo.scenarios.final.officialAnalysisLabel")
          : text("tournament.monteCarlo.scenarios.final.customAnalysisLabel"),
        returnView: "tournament",
        extremePerformance: monteCarlo.extremePerformanceEnabled,
      });
    },
    [
      monteCarlo,
      resolvedLineupBasicIds,
      tournament.finalPlacements,
      tournament.preliminaryPlacements,
    ]
  );

  const monteCarloRunDisabled =
    !isValidBasicSelection(resolvedLineupBasicIds) ||
    tournament.race.isAnimating ||
    replay.isReplayLoaded;

  const controlsLocked = isRaceControlsLocked(
    tournament.race.state.phase,
    tournament.race.isAnimating
  );

  const restartStartsFinal =
    tournament.race.state.mode === "tournamentFinal" ||
    tournament.race.state.mode === "customFinal";

  const canLaunchFinalFromPreliminary =
    tournament.race.state.mode === "tournamentPreliminary";

  const restartDisabled =
    tournament.race.state.phase === "running" ||
    tournament.race.isAnimating ||
    !isValidBasicSelection(resolvedLineupBasicIds) ||
    tournament.race.state.mode === null ||
    replay.isReplayLoaded;

  const launchFinalDisabled =
    !canLaunchFinalFromPreliminary ||
    tournament.race.state.phase === "running" ||
    tournament.race.isAnimating ||
    !isValidBasicSelection(resolvedLineupBasicIds) ||
    replay.isReplayLoaded;

  const sessionLabel =
    tournament.race.state.phase === "running"
      ? tournament.race.state.label
        ? tText(tournament.race.state.label)
        : t("tournament.session.raceFallback")
      : tournament.race.state.phase === "finished"
        ? tournament.race.state.mode === "tournamentPreliminary"
          ? t("tournament.session.preliminaryComplete")
          : tournament.race.state.label
            ? tText(tournament.race.state.label)
            : t("tournament.session.finalComplete")
        : tText(tournament.sessionLabel);

  const mapSelectorDisabled = isMapSelectorDisabled({
    phase: tournament.race.state.phase,
    isAnimating: tournament.race.isAnimating,
    replayLoaded: replay.isReplayLoaded,
  });

  return {
    tournament,
    replay,
    spectate,
    resolvedLineupBasicIds,
    selectedMonteCarloScenarioId,
    setSelectedMonteCarloScenarioId,
    flushPlaybackAndClearRace,
    flushPlaybackAndResetTournament,
    beginPreliminary,
    beginFinal,
    requestMonteCarloBatch,
    monteCarloRunDisabled,
    controlsLocked,
    restartStartsFinal,
    canLaunchFinalFromPreliminary,
    restartDisabled,
    launchFinalDisabled,
    sessionLabel,
    mapSelectorDisabled,
  };
}
