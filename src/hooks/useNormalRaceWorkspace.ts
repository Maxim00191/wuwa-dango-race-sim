import { useCallback, useMemo } from "react";
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
import { createNormalRaceSetup } from "@/services/raceSetup";
import {
  isMapSelectorDisabled,
  isNormalMonteCarloRunDisabled,
  isNormalStartDisabled,
  resolveActiveLineupBasicIds,
} from "@/services/workspacePredicates";

type LineupSelection = ReturnType<typeof useLineupSelection>;
type MapSelection = ReturnType<typeof useMapSelection>;
type MonteCarloCoordinator = ReturnType<typeof useMonteCarloCoordinator>;

export type UseNormalRaceWorkspaceOptions = {
  gameBoardOptions: UseGameOptions;
  mapSelection: MapSelection;
  lineup: LineupSelection;
  monteCarlo: MonteCarloCoordinator;
  dependencies?: Partial<SimulationDependencies>;
};

export function useNormalRaceWorkspace({
  gameBoardOptions,
  mapSelection,
  lineup,
  monteCarlo,
  dependencies: dependencyOverrides,
}: UseNormalRaceWorkspaceOptions) {
  const { t, tText } = useTranslation();
  const deps = mergeSimulationDependencies(
    useSimulationDependencies(),
    dependencyOverrides
  );

  const game = deps.useGame(gameBoardOptions);
  const replay = deps.useReplayTimeline({
    onReplayBoardLoaded: mapSelection.syncFromBoardAssignments,
    onReplayCleared: mapSelection.clearReplayOverride,
    game: deps.createReplayGameBridge(game),
  });
  const spectate = deps.useGameShellSpectate(game, replay);

  const resolvedLineupBasicIds = useMemo(
    () =>
      resolveActiveLineupBasicIds(
        game.state.phase,
        lineup.selectedBasicIds,
        game.state.activeBasicIds
      ),
    [game.state.activeBasicIds, game.state.phase, lineup.selectedBasicIds]
  );

  const flushPlaybackAndReset = useCallback(() => {
    replay.flushPlaybackForNewSession();
    game.reset();
  }, [game, replay]);

  const beginSprint = useCallback(() => {
    replay.flushPlaybackForNewSession();
    game.start(createNormalRaceSetup(lineup.selectedBasicIds));
  }, [game, lineup.selectedBasicIds, replay]);

  const requestMonteCarloBatch = useCallback(
    async (_scenarioId: string, totalGames: number) => {
      await monteCarlo.runScenario({
        totalGames,
        scenario: {
          kind: "singleRace",
          setup: createNormalRaceSetup(resolvedLineupBasicIds),
        },
        selectedBasicIds: resolvedLineupBasicIds,
        scenarioKind: "normalRace",
        scenarioLabel: text("normal.monteCarlo.scenario.analysisLabel"),
        returnView: "normal",
        extremePerformance: monteCarlo.extremePerformanceEnabled,
      });
    },
    [monteCarlo, resolvedLineupBasicIds]
  );

  const monteCarloRunDisabled = isNormalMonteCarloRunDisabled(
    resolvedLineupBasicIds,
    game.isAnimating,
    replay.isReplayLoaded
  );

  const startDisabled = isNormalStartDisabled({
    phase: game.state.phase,
    isAnimating: game.isAnimating,
    lineupBasicIds: lineup.selectedBasicIds,
    replayLoaded: replay.isReplayLoaded,
  });

  const sessionLabel =
    game.state.phase === "idle"
      ? t("normal.session.idle")
      : game.state.label
        ? tText(game.state.label)
        : t("normal.session.fallback");

  const mapSelectorDisabled = isMapSelectorDisabled({
    phase: game.state.phase,
    isAnimating: game.isAnimating,
    replayLoaded: replay.isReplayLoaded,
  });

  return {
    game,
    replay,
    spectate,
    resolvedLineupBasicIds,
    flushPlaybackAndReset,
    beginSprint,
    requestMonteCarloBatch,
    monteCarloRunDisabled,
    startDisabled,
    sessionLabel,
    mapSelectorDisabled,
  };
}
