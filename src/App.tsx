import { useCallback, useMemo, useState } from "react";
import { AnalysisDashboard } from "@/components/AnalysisDashboard";
import {
  AppNavigation,
  type WorkspaceView,
} from "@/components/AppNavigation";
import { DangoPicker } from "@/components/DangoPicker";
import { FooterSocialLinks } from "@/components/FooterSocialLinks";
import { GameShell, type GameShellSpectate } from "@/components/GameShell";
import { MapSelector } from "@/components/MapSelector";
import { MonteCarloPanel } from "@/components/MonteCarloPanel";
import { ReplayTimelineCluster } from "@/components/ReplayTimelineCluster";
import { KnockoutSetupPanel } from "@/components/KnockoutSetupPanel";
import { TournamentSetupPanel } from "@/components/TournamentSetupPanel";
import { ABBY_ID } from "@/constants/ids";
import { text } from "@/i18n";
import { useTranslation } from "@/i18n/useTranslation";
import { useGame, type UseGameOptions } from "@/hooks/useGame";
import { useMapSelection } from "@/hooks/useMapSelection";
import { useReplayTimeline } from "@/hooks/useReplayTimeline";
import { useLineupSelection } from "@/hooks/useLineupSelection";
import { useMonteCarloSimulation } from "@/hooks/useMonteCarloSimulation";
import { useTheme } from "@/hooks/useTheme";
import { useKnockoutLineup } from "@/hooks/useKnockoutLineup";
import { useKnockoutTournament } from "@/hooks/useKnockoutTournament";
import { useTournament } from "@/hooks/useTournament";
import { mergeKnockoutParticipantIds } from "@/services/knockout/bracket";
import { isValidBasicSelection } from "@/services/gameEngine";
import { BASIC_CHARACTER_LIST } from "@/services/characters";
import {
  createCustomFinalRaceSetup,
  createNormalRaceSetup,
  createTournamentFinalRaceSetup,
} from "@/services/raceSetup";
import type { MonteCarloAggregateSnapshot } from "@/types/monteCarlo";

function arraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((entry, index) => entry === right[index]);
}

export default function App() {
  const { t, tText } = useTranslation();
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("normal");
  const mapSelection = useMapSelection(workspaceView);
  const gameBoardOptions = useMemo(
    (): UseGameOptions => ({
      boardEffects: mapSelection.boardEffects,
    }),
    [mapSelection.boardEffects]
  );
  const lineup = useLineupSelection();
  const normalGame = useGame(gameBoardOptions);
  const normalReplay = useReplayTimeline({
    onReplayBoardLoaded: mapSelection.syncFromBoardAssignments,
    game: {
      state: normalGame.state,
      reset: normalGame.reset,
      hydrateEngineState: normalGame.hydrateEngineState,
      stepAction: normalGame.stepAction,
      playTurn: normalGame.playTurn,
      setAutoPlayEnabled: normalGame.setAutoPlayEnabled,
      isAnimating: normalGame.isAnimating,
      boardEffects: normalGame.boardEffects,
      autoPlayEnabled: normalGame.autoPlayEnabled,
      getLastRaceSetup: normalGame.getLastRaceSetup,
    },
  });
  const tournament = useTournament(lineup.selectedBasicIds, gameBoardOptions);
  const knockoutLineup = useKnockoutLineup();
  const knockout = useKnockoutTournament(
    knockoutLineup.groupAIds,
    knockoutLineup.groupBIds,
    gameBoardOptions
  );
  const knockoutReplay = useReplayTimeline({
    onReplayBoardLoaded: mapSelection.syncFromBoardAssignments,
    game: {
      state: knockout.race.state,
      reset: knockout.clearRace,
      hydrateEngineState: knockout.race.hydrateEngineState,
      stepAction: knockout.race.stepAction,
      playTurn: knockout.race.playTurn,
      setAutoPlayEnabled: knockout.race.setAutoPlayEnabled,
      isAnimating: knockout.race.isAnimating,
      boardEffects: knockout.race.boardEffects,
      autoPlayEnabled: knockout.race.autoPlayEnabled,
      getLastRaceSetup: knockout.race.getLastRaceSetup,
    },
  });
  const tournamentReplay = useReplayTimeline({
    onReplayBoardLoaded: mapSelection.syncFromBoardAssignments,
    game: {
      state: tournament.race.state,
      reset: tournament.clearRace,
      hydrateEngineState: tournament.race.hydrateEngineState,
      stepAction: tournament.race.stepAction,
      playTurn: tournament.race.playTurn,
      setAutoPlayEnabled: tournament.race.setAutoPlayEnabled,
      isAnimating: tournament.race.isAnimating,
      boardEffects: tournament.race.boardEffects,
      autoPlayEnabled: tournament.race.autoPlayEnabled,
      getLastRaceSetup: tournament.race.getLastRaceSetup,
    },
  });
  const { isDark, toggle: toggleTheme } = useTheme();
  const formattedBuildTimestamp = useMemo(() => {
    const buildDate = new Date(__BUILD_TIMESTAMP__);
    return Number.isNaN(buildDate.getTime())
      ? __BUILD_TIMESTAMP__
      : buildDate.toLocaleString();
  }, []);
  const [analysisReturnView, setAnalysisReturnView] =
    useState<Exclude<WorkspaceView, "analysis">>("normal");
  const [selectedTournamentMonteCarloScenarioId, setSelectedTournamentMonteCarloScenarioId] =
    useState<"tournament" | "final">("tournament");
  const [monteCarloSnapshot, setMonteCarloSnapshot] =
    useState<MonteCarloAggregateSnapshot | null>(null);
  const [monteCarloExtremePerformance, setMonteCarloExtremePerformance] =
    useState(false);

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

  const monteCarlo = useMonteCarloSimulation({
    boardEffectByCellIndex: mapSelection.boardEffects,
    onComplete: handleMonteCarloComplete,
  });

  const rosterBasics = useMemo(() => BASIC_CHARACTER_LIST, []);
  const idleParticipantIds = useMemo(
    () => [...lineup.selectedBasicIds, ABBY_ID],
    [lineup.selectedBasicIds]
  );

  const flushNormalPlaybackAndReset = useCallback(() => {
    normalReplay.flushPlaybackForNewSession();
    normalGame.reset();
  }, [normalGame, normalReplay]);

  const beginNormalSprint = useCallback(() => {
    normalReplay.flushPlaybackForNewSession();
    normalGame.start(createNormalRaceSetup(lineup.selectedBasicIds));
  }, [lineup.selectedBasicIds, normalGame, normalReplay]);

  const flushTournamentPlaybackAndClearRace = useCallback(() => {
    tournamentReplay.flushPlaybackForNewSession();
    tournament.clearRace();
  }, [tournament, tournamentReplay]);

  const flushTournamentPlaybackAndResetTournament = useCallback(() => {
    tournamentReplay.flushPlaybackForNewSession();
    tournament.resetTournament();
  }, [tournament, tournamentReplay]);

  const beginTournamentPreliminary = useCallback(() => {
    tournamentReplay.flushPlaybackForNewSession();
    tournament.startPreliminary();
  }, [tournament, tournamentReplay]);

  const beginTournamentFinal = useCallback(() => {
    tournamentReplay.flushPlaybackForNewSession();
    tournament.startFinal();
  }, [tournament, tournamentReplay]);

  const flushKnockoutPlaybackAndClearRace = useCallback(() => {
    knockoutReplay.flushPlaybackForNewSession();
    knockout.clearRace();
  }, [knockout, knockoutReplay]);

  const flushKnockoutPlaybackAndReset = useCallback(() => {
    knockoutReplay.flushPlaybackForNewSession();
    knockout.resetTournament();
  }, [knockout, knockoutReplay]);

  const beginKnockoutPhase = useCallback(() => {
    knockoutReplay.flushPlaybackForNewSession();
    if (knockout.progress.completedPhases.length === 0) {
      knockout.startTournament();
      return;
    }
    knockout.advanceTournament();
  }, [knockout, knockoutReplay]);

  const resolvedNormalLineupBasicIds = useMemo(() => {
    if (normalGame.state.phase === "idle") {
      return lineup.selectedBasicIds;
    }
    return normalGame.state.activeBasicIds;
  }, [
    lineup.selectedBasicIds,
    normalGame.state.activeBasicIds,
    normalGame.state.phase,
  ]);

  const resolvedTournamentLineupBasicIds = useMemo(() => {
    if (tournament.race.state.phase === "idle") {
      return lineup.selectedBasicIds;
    }
    return tournament.race.state.activeBasicIds;
  }, [
    lineup.selectedBasicIds,
    tournament.race.state.activeBasicIds,
    tournament.race.state.phase,
  ]);

  const runScenarioMonteCarlo = monteCarlo.runScenario;
  const abortMonteCarloRun = monteCarlo.abortRun;

  const requestNormalMonteCarloBatch = useCallback(
    async (_scenarioId: string, totalGames: number) => {
      await runScenarioMonteCarlo({
        totalGames,
        scenario: {
          kind: "singleRace",
          setup: createNormalRaceSetup(resolvedNormalLineupBasicIds),
        },
        selectedBasicIds: resolvedNormalLineupBasicIds,
        scenarioKind: "normalRace",
        scenarioLabel: text("normal.monteCarlo.scenario.analysisLabel"),
        returnView: "normal",
        extremePerformance: monteCarloExtremePerformance,
      });
    },
    [
      resolvedNormalLineupBasicIds,
      runScenarioMonteCarlo,
      monteCarloExtremePerformance,
    ]
  );

  const requestKnockoutMonteCarloBatch = useCallback(
    async (_scenarioId: string, totalGames: number) => {
      const participantIds = mergeKnockoutParticipantIds(
        knockoutLineup.groupAIds,
        knockoutLineup.groupBIds
      );
      await runScenarioMonteCarlo({
        totalGames,
        scenario: {
          kind: "knockoutTournament",
          groupAIds: knockoutLineup.groupAIds,
          groupBIds: knockoutLineup.groupBIds,
        },
        selectedBasicIds: participantIds,
        scenarioKind: "knockoutTournament",
        scenarioLabel: text("knockout.monteCarlo.scenario.analysisLabel"),
        returnView: "knockout",
        extremePerformance: monteCarloExtremePerformance,
      });
    },
    [
      knockoutLineup.groupAIds,
      knockoutLineup.groupBIds,
      runScenarioMonteCarlo,
      monteCarloExtremePerformance,
    ]
  );

  const requestTournamentMonteCarloBatch = useCallback(
    async (scenarioId: string, totalGames: number) => {
      if (scenarioId === "tournament") {
        await runScenarioMonteCarlo({
          totalGames,
          scenario: {
            kind: "tournament",
            selectedBasicIds: resolvedTournamentLineupBasicIds,
          },
          selectedBasicIds: resolvedTournamentLineupBasicIds,
          scenarioKind: "tournament",
          scenarioLabel: text("tournament.monteCarlo.scenarios.tournament.analysisLabel"),
          returnView: "tournament",
          extremePerformance: monteCarloExtremePerformance,
        });
        return;
      }

      const useOfficialTournamentFinal =
        tournament.preliminaryPlacements !== null &&
        arraysEqual(tournament.finalPlacements, tournament.preliminaryPlacements);
      const finalSetup = useOfficialTournamentFinal
        ? createTournamentFinalRaceSetup(tournament.finalPlacements)
        : createCustomFinalRaceSetup(tournament.finalPlacements);
      await runScenarioMonteCarlo({
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
        extremePerformance: monteCarloExtremePerformance,
      });
    },
    [
      resolvedTournamentLineupBasicIds,
      runScenarioMonteCarlo,
      tournament.finalPlacements,
      tournament.preliminaryPlacements,
      monteCarloExtremePerformance,
    ]
  );

  const normalMonteCarloRunDisabled =
    !isValidBasicSelection(resolvedNormalLineupBasicIds) ||
    normalGame.isAnimating ||
    normalReplay.isReplayLoaded;
  const knockoutMonteCarloRunDisabled =
    !knockoutLineup.isReady ||
    knockout.race.isAnimating ||
    knockoutReplay.isReplayLoaded;
  const tournamentMonteCarloRunDisabled =
    !isValidBasicSelection(resolvedTournamentLineupBasicIds) ||
    tournament.race.isAnimating ||
    tournamentReplay.isReplayLoaded;
  const normalStartDisabled =
    normalGame.state.phase === "running" ||
    normalGame.isAnimating ||
    !isValidBasicSelection(lineup.selectedBasicIds) ||
    normalReplay.isReplayLoaded;
  const tournamentControlsLocked =
    tournament.race.state.phase === "running" || tournament.race.isAnimating;
  const tournamentRestartStartsFinal =
    tournament.race.state.mode === "tournamentFinal" ||
    tournament.race.state.mode === "customFinal";
  const tournamentCanLaunchFinalFromPreliminary =
    tournament.race.state.mode === "tournamentPreliminary";
  const tournamentRestartDisabled =
    tournament.race.state.phase === "running" ||
    tournament.race.isAnimating ||
    !isValidBasicSelection(resolvedTournamentLineupBasicIds) ||
    tournament.race.state.mode === null ||
    tournamentReplay.isReplayLoaded;
  const tournamentLaunchFinalDisabled =
    !tournamentCanLaunchFinalFromPreliminary ||
    tournament.race.state.phase === "running" ||
    tournament.race.isAnimating ||
    !isValidBasicSelection(resolvedTournamentLineupBasicIds) ||
    tournamentReplay.isReplayLoaded;
  const normalSessionLabel =
    normalGame.state.phase === "idle"
      ? t("normal.session.idle")
      : normalGame.state.label
        ? tText(normalGame.state.label)
        : t("normal.session.fallback");
  const knockoutParticipantIds = useMemo(
    () => mergeKnockoutParticipantIds(knockoutLineup.groupAIds, knockoutLineup.groupBIds),
    [knockoutLineup.groupAIds, knockoutLineup.groupBIds]
  );
  const knockoutSessionLabel =
    knockout.race.state.phase === "running"
      ? knockout.race.state.label
        ? tText(knockout.race.state.label)
        : t("knockout.session.setup")
      : knockout.race.state.phase === "finished"
        ? knockout.race.state.label
          ? tText(knockout.race.state.label)
          : t("knockout.session.setup")
        : tText(knockout.sessionLabel);
  const knockoutControlsLocked =
    knockout.race.state.phase === "running" || knockout.race.isAnimating;
  const knockoutStartDisabled =
    knockoutControlsLocked ||
    !knockoutLineup.isReady ||
    knockoutReplay.isReplayLoaded;
  const tournamentSessionLabel =
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

  const normalReplayLabels = useMemo(
    () => ({
      toolbarCaption: t("game.replay.toolbarCaption"),
      idleHint: t("game.replay.idleHint"),
      seekTurnLabel: t("game.replay.seekEngineTurn"),
      seekTurnButton: t("game.replay.seekTurnButton"),
      exportCopy: t("game.replay.exportCopy"),
      import: t("game.replay.import"),
      jumpToPresent: t("game.replay.jumpToPresent"),
      stepBack: t("game.replay.stepBack"),
      stepForward: t("game.replay.stepForward"),
      bannersOn: t("game.replay.bannersOn"),
      bannersOff: t("game.replay.bannersOff"),
    }),
    [t]
  );

  const tournamentReplayLabels = useMemo(
    () => ({
      toolbarCaption: t("game.replay.toolbarCaption"),
      idleHint: t("game.replay.idleHint"),
      seekTurnLabel: t("game.replay.seekEngineTurn"),
      seekTurnButton: t("game.replay.seekTurnButton"),
      exportCopy: t("game.replay.exportCopy"),
      import: t("game.replay.import"),
      jumpToPresent: t("game.replay.jumpToPresent"),
      stepBack: t("game.replay.stepBack"),
      stepForward: t("game.replay.stepForward"),
      bannersOn: t("game.replay.bannersOn"),
      bannersOff: t("game.replay.bannersOff"),
    }),
    [t]
  );

  const handleNormalReplayImport = useCallback(
    (payload: string) => {
      try {
        normalReplay.readReplayFromJsonText(payload);
      } catch {
        window.alert(t("game.replay.importInvalid"));
      }
    },
    [normalReplay, t]
  );

  const handleNormalReplayExportCopy = useCallback(() => {
    const raw = normalReplay.exportRecordJson();
    if (!raw) {
      return;
    }
    void navigator.clipboard.writeText(raw);
  }, [normalReplay]);

  const handleTournamentReplayImport = useCallback(
    (payload: string) => {
      try {
        tournamentReplay.readReplayFromJsonText(payload);
      } catch {
        window.alert(t("game.replay.importInvalid"));
      }
    },
    [tournamentReplay, t]
  );

  const handleTournamentReplayExportCopy = useCallback(() => {
    const raw = tournamentReplay.exportRecordJson();
    if (!raw) {
      return;
    }
    void navigator.clipboard.writeText(raw);
  }, [tournamentReplay]);

  const handleObserverWatchReplayJson = useCallback(
    (json: string) => {
      try {
        if (analysisReturnView === "normal") {
          normalReplay.flushPlaybackForNewSession();
          normalReplay.readReplayFromJsonText(json);
          setWorkspaceView("normal");
          return;
        }
        if (analysisReturnView === "knockout") {
          knockoutReplay.flushPlaybackForNewSession();
          knockoutReplay.readReplayFromJsonText(json);
          setWorkspaceView("knockout");
          return;
        }
        tournamentReplay.flushPlaybackForNewSession();
        tournamentReplay.readReplayFromJsonText(json);
        setWorkspaceView("tournament");
      } catch {
        window.alert(t("game.replay.importInvalid"));
      }
    },
    [
      analysisReturnView,
      knockoutReplay,
      normalReplay,
      tournamentReplay,
      t,
    ]
  );

  const normalSpectate = useMemo((): GameShellSpectate => {
    const file = normalReplay.isReplayLoaded;
    const stepDisabled = file
      ? normalGame.isAnimating ||
        normalGame.state.phase !== "running" ||
        Boolean(normalGame.state.winnerId) ||
        normalReplay.timelineStep >= normalReplay.timelineMax
      : normalGame.state.phase !== "running" ||
        Boolean(normalGame.state.winnerId) ||
        normalGame.isAnimating ||
        normalGame.playTurnEnabled ||
        normalReplay.spectateAutoActive;
    const playTurnDisabled = file
      ? normalGame.isAnimating ||
        normalReplay.spectatePlayTurnChaining ||
        normalReplay.timelineStep >= normalReplay.timelineMax
      : normalGame.state.phase !== "running" ||
        Boolean(normalGame.state.winnerId) ||
        normalGame.isAnimating ||
        normalGame.playTurnEnabled ||
        normalReplay.spectateAutoActive;
    const autoRunDisabled = file
      ? normalGame.isAnimating ||
        normalReplay.timelineStep >= normalReplay.timelineMax
      : normalGame.state.phase !== "running" ||
        Boolean(normalGame.state.winnerId);
    return {
      replayFileActive: file,
      timelineVisible: file || normalGame.state.phase !== "idle",
      timelineStep: normalReplay.timelineStep,
      timelineMax: normalReplay.timelineMax,
      onScrub: normalReplay.scrubToStep,
      scrubAria: t("game.replay.scrubAria"),
      turnSummaryText: `${normalReplay.timelineStep + 1} / ${normalReplay.timelineMax + 1} · ${t("game.replay.seekEngineTurn")}: ${normalReplay.currentEngineTurn}`,
      replayToolbar: (
        <ReplayTimelineCluster
          seekControlsVisible={normalReplay.isReplayLoaded}
          canCopyJson={normalReplay.canExportReplayJson}
          seekTurnDraft={normalReplay.seekTurnDraft}
          onSeekTurnDraftChange={normalReplay.setSeekTurnDraft}
          onSeekTurnSubmit={normalReplay.seekToEngineTurn}
          onExportCopy={handleNormalReplayExportCopy}
          onImportFile={handleNormalReplayImport}
          jumpToPresentVisible={normalReplay.jumpToPresentVisible}
          onJumpToPresent={normalReplay.jumpToPresent}
          onStepBackward={normalReplay.historyStepBack}
          onStepForward={normalReplay.spectateAdvanceStep}
          stepBackwardDisabled={normalReplay.timelineStep <= 0}
          stepForwardDisabled={stepDisabled}
          bannersEnabled={normalReplay.replayBannersEnabled}
          onToggleBanners={normalReplay.toggleReplayBanners}
          labels={normalReplayLabels}
        />
      ),
      onStep: normalReplay.spectateAdvanceStep,
      onPlayTurn: normalReplay.spectatePlayTurn,
      onToggleAuto: normalReplay.spectateToggleAuto,
      autoActive: normalReplay.spectateAutoActive,
      replayBannersEnabled: normalReplay.replayBannersEnabled,
      replayBannerPayload: normalReplay.replayBannerPayload,
      onToggleReplayBanners: normalReplay.toggleReplayBanners,
      playTurnBusy: normalReplay.spectatePlayTurnChaining,
      stepDisabled,
      playTurnDisabled,
      autoRunDisabled,
      onHistoryStepBack: normalReplay.historyStepBack,
    };
  }, [
    handleNormalReplayExportCopy,
    handleNormalReplayImport,
    normalGame.isAnimating,
    normalGame.playTurnEnabled,
    normalGame.state.phase,
    normalGame.state.winnerId,
    normalReplay,
    normalReplayLabels,
    t,
  ]);

  const knockoutReplayLabels = useMemo(
    () => ({
      toolbarCaption: t("game.replay.toolbarCaption"),
      idleHint: t("game.replay.idleHint"),
      seekTurnLabel: t("game.replay.seekEngineTurn"),
      seekTurnButton: t("game.replay.seekTurnButton"),
      exportCopy: t("game.replay.exportCopy"),
      import: t("game.replay.import"),
      jumpToPresent: t("game.replay.jumpToPresent"),
      stepBack: t("game.replay.stepBack"),
      stepForward: t("game.replay.stepForward"),
      bannersOn: t("game.replay.bannersOn"),
      bannersOff: t("game.replay.bannersOff"),
    }),
    [t]
  );

  const handleKnockoutReplayImport = useCallback(
    (payload: string) => {
      try {
        knockoutReplay.readReplayFromJsonText(payload);
      } catch {
        window.alert(t("game.replay.importInvalid"));
      }
    },
    [knockoutReplay, t]
  );

  const handleKnockoutReplayExportCopy = useCallback(() => {
    const raw = knockoutReplay.exportRecordJson();
    if (!raw) {
      return;
    }
    void navigator.clipboard.writeText(raw);
  }, [knockoutReplay]);

  const knockoutSpectate = useMemo((): GameShellSpectate => {
    const file = knockoutReplay.isReplayLoaded;
    const stepDisabled = file
      ? knockout.race.isAnimating ||
        knockout.race.state.phase !== "running" ||
        Boolean(knockout.race.state.winnerId) ||
        knockoutReplay.timelineStep >= knockoutReplay.timelineMax
      : knockout.race.state.phase !== "running" ||
        Boolean(knockout.race.state.winnerId) ||
        knockout.race.isAnimating ||
        knockout.race.playTurnEnabled ||
        knockoutReplay.spectateAutoActive;
    const playTurnDisabled = file
      ? knockout.race.isAnimating ||
        knockoutReplay.spectatePlayTurnChaining ||
        knockoutReplay.timelineStep >= knockoutReplay.timelineMax
      : knockout.race.state.phase !== "running" ||
        Boolean(knockout.race.state.winnerId) ||
        knockout.race.isAnimating ||
        knockout.race.playTurnEnabled ||
        knockoutReplay.spectateAutoActive;
    const autoRunDisabled = file
      ? knockout.race.isAnimating ||
        knockoutReplay.timelineStep >= knockoutReplay.timelineMax
      : knockout.race.state.phase !== "running" ||
        Boolean(knockout.race.state.winnerId);
    return {
      replayFileActive: file,
      timelineVisible: file || knockout.race.state.phase !== "idle",
      timelineStep: knockoutReplay.timelineStep,
      timelineMax: knockoutReplay.timelineMax,
      onScrub: knockoutReplay.scrubToStep,
      scrubAria: t("game.replay.scrubAria"),
      turnSummaryText: `${knockoutReplay.timelineStep + 1} / ${knockoutReplay.timelineMax + 1} · ${t("game.replay.seekEngineTurn")}: ${knockoutReplay.currentEngineTurn}`,
      replayToolbar: (
        <ReplayTimelineCluster
          seekControlsVisible={knockoutReplay.isReplayLoaded}
          canCopyJson={knockoutReplay.canExportReplayJson}
          seekTurnDraft={knockoutReplay.seekTurnDraft}
          onSeekTurnDraftChange={knockoutReplay.setSeekTurnDraft}
          onSeekTurnSubmit={knockoutReplay.seekToEngineTurn}
          onExportCopy={handleKnockoutReplayExportCopy}
          onImportFile={handleKnockoutReplayImport}
          jumpToPresentVisible={knockoutReplay.jumpToPresentVisible}
          onJumpToPresent={knockoutReplay.jumpToPresent}
          onStepBackward={knockoutReplay.historyStepBack}
          onStepForward={knockoutReplay.spectateAdvanceStep}
          stepBackwardDisabled={knockoutReplay.timelineStep <= 0}
          stepForwardDisabled={stepDisabled}
          bannersEnabled={knockoutReplay.replayBannersEnabled}
          onToggleBanners={knockoutReplay.toggleReplayBanners}
          labels={knockoutReplayLabels}
        />
      ),
      onStep: knockoutReplay.spectateAdvanceStep,
      onPlayTurn: knockoutReplay.spectatePlayTurn,
      onToggleAuto: knockoutReplay.spectateToggleAuto,
      autoActive: knockoutReplay.spectateAutoActive,
      replayBannersEnabled: knockoutReplay.replayBannersEnabled,
      replayBannerPayload: knockoutReplay.replayBannerPayload,
      onToggleReplayBanners: knockoutReplay.toggleReplayBanners,
      playTurnBusy: knockoutReplay.spectatePlayTurnChaining,
      stepDisabled,
      playTurnDisabled,
      autoRunDisabled,
      onHistoryStepBack: knockoutReplay.historyStepBack,
    };
  }, [
    handleKnockoutReplayExportCopy,
    handleKnockoutReplayImport,
    knockout.race.isAnimating,
    knockout.race.playTurnEnabled,
    knockout.race.state.phase,
    knockout.race.state.winnerId,
    knockoutReplay,
    knockoutReplayLabels,
    t,
  ]);

  const tournamentSpectate = useMemo((): GameShellSpectate => {
    const file = tournamentReplay.isReplayLoaded;
    const stepDisabled = file
      ? tournament.race.isAnimating ||
        tournament.race.state.phase !== "running" ||
        Boolean(tournament.race.state.winnerId) ||
        tournamentReplay.timelineStep >= tournamentReplay.timelineMax
      : tournament.race.state.phase !== "running" ||
        Boolean(tournament.race.state.winnerId) ||
        tournament.race.isAnimating ||
        tournament.race.playTurnEnabled ||
        tournamentReplay.spectateAutoActive;
    const playTurnDisabled = file
      ? tournament.race.isAnimating ||
        tournamentReplay.spectatePlayTurnChaining ||
        tournamentReplay.timelineStep >= tournamentReplay.timelineMax
      : tournament.race.state.phase !== "running" ||
        Boolean(tournament.race.state.winnerId) ||
        tournament.race.isAnimating ||
        tournament.race.playTurnEnabled ||
        tournamentReplay.spectateAutoActive;
    const autoRunDisabled = file
      ? tournament.race.isAnimating ||
        tournamentReplay.timelineStep >= tournamentReplay.timelineMax
      : tournament.race.state.phase !== "running" ||
        Boolean(tournament.race.state.winnerId);
    return {
      replayFileActive: file,
      timelineVisible: file || tournament.race.state.phase !== "idle",
      timelineStep: tournamentReplay.timelineStep,
      timelineMax: tournamentReplay.timelineMax,
      onScrub: tournamentReplay.scrubToStep,
      scrubAria: t("game.replay.scrubAria"),
      turnSummaryText: `${tournamentReplay.timelineStep + 1} / ${tournamentReplay.timelineMax + 1} · ${t("game.replay.seekEngineTurn")}: ${tournamentReplay.currentEngineTurn}`,
      replayToolbar: (
        <ReplayTimelineCluster
          seekControlsVisible={tournamentReplay.isReplayLoaded}
          canCopyJson={tournamentReplay.canExportReplayJson}
          seekTurnDraft={tournamentReplay.seekTurnDraft}
          onSeekTurnDraftChange={tournamentReplay.setSeekTurnDraft}
          onSeekTurnSubmit={tournamentReplay.seekToEngineTurn}
          onExportCopy={handleTournamentReplayExportCopy}
          onImportFile={handleTournamentReplayImport}
          jumpToPresentVisible={tournamentReplay.jumpToPresentVisible}
          onJumpToPresent={tournamentReplay.jumpToPresent}
          onStepBackward={tournamentReplay.historyStepBack}
          onStepForward={tournamentReplay.spectateAdvanceStep}
          stepBackwardDisabled={tournamentReplay.timelineStep <= 0}
          stepForwardDisabled={stepDisabled}
          bannersEnabled={tournamentReplay.replayBannersEnabled}
          onToggleBanners={tournamentReplay.toggleReplayBanners}
          labels={tournamentReplayLabels}
        />
      ),
      onStep: tournamentReplay.spectateAdvanceStep,
      onPlayTurn: tournamentReplay.spectatePlayTurn,
      onToggleAuto: tournamentReplay.spectateToggleAuto,
      autoActive: tournamentReplay.spectateAutoActive,
      replayBannersEnabled: tournamentReplay.replayBannersEnabled,
      replayBannerPayload: tournamentReplay.replayBannerPayload,
      onToggleReplayBanners: tournamentReplay.toggleReplayBanners,
      playTurnBusy: tournamentReplay.spectatePlayTurnChaining,
      stepDisabled,
      playTurnDisabled,
      autoRunDisabled,
      onHistoryStepBack: tournamentReplay.historyStepBack,
    };
  }, [
    handleTournamentReplayExportCopy,
    handleTournamentReplayImport,
    t,
    tournament.race.isAnimating,
    tournament.race.playTurnEnabled,
    tournament.race.state.phase,
    tournament.race.state.winnerId,
    tournamentReplay,
    tournamentReplayLabels,
  ]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AppNavigation
        activeView={workspaceView}
        onSelectView={setWorkspaceView}
        isDarkTheme={isDark}
        onToggleTheme={toggleTheme}
      />
      <main className="flex flex-1 flex-col">
        {workspaceView === "normal" ? (
          <>
            <MonteCarloPanel
              heading={t("normal.monteCarlo.heading")}
              title={t("normal.monteCarlo.title")}
              description={t("normal.monteCarlo.description")}
              lineupBasicIds={resolvedNormalLineupBasicIds}
              runDisabled={normalMonteCarloRunDisabled}
              progress={monteCarlo.progress}
              isStopping={monteCarlo.isStopping}
              extremePerformanceEnabled={monteCarloExtremePerformance}
              onExtremePerformanceEnabledChange={setMonteCarloExtremePerformance}
              scenarioOptions={[
                {
                  id: "normalRace",
                  label: t("normal.monteCarlo.scenario.label"),
                  description: t("normal.monteCarlo.scenario.description"),
                },
              ]}
              selectedScenarioId="normalRace"
              onSelectedScenarioChange={() => {}}
              onRunBatch={requestNormalMonteCarloBatch}
              onAbortRun={abortMonteCarloRun}
            />
            <GameShell
              state={normalGame.state}
              rankingState={normalGame.rankingState}
              broadcastPayload={normalGame.broadcastPayload}
              boardCells={normalGame.boardCells}
              boardEffects={mapSelection.boardEffects}
              mapSelector={
                <MapSelector
                  selectedMapId={mapSelection.selectedMapId}
                  onSelectMapId={mapSelection.setSelectedMapId}
                  disabled={
                    normalGame.state.phase === "running" ||
                    normalGame.isAnimating ||
                    normalReplay.isReplayLoaded
                  }
                />
              }
              hoppingEntityIds={normalGame.hoppingEntityIds}
              idleParticipantIds={idleParticipantIds}
              headerEyebrow={t("normal.shell.eyebrow")}
              headerTitle={t("normal.shell.title")}
              headerDescription={t("normal.shell.description")}
              sessionLabel={normalSessionLabel}
              setupPanel={
                <DangoPicker
                  rosterBasics={rosterBasics}
                  selectedBasicIds={lineup.selectedBasicIds}
                  onSetLineup={lineup.setLineup}
                  onToggleBasicId={lineup.toggleSelectedBasicId}
                  onClearSelections={lineup.clearSelectedBasicIds}
                />
              }
              showSetupPanel={normalGame.state.phase === "idle"}
              startControls={
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={beginNormalSprint}
                  disabled={normalStartDisabled}
                  className="inline-flex min-h-9 items-center justify-center rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-950 shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:min-h-11 sm:px-5 sm:py-2 sm:text-sm dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                >
                  {t("normal.shell.start")}
                </button>
              }
              onStartSprint={beginNormalSprint}
              startShortcutDisabled={normalStartDisabled}
              onPlayTurn={normalGame.playTurn}
              onStepAction={normalGame.stepAction}
              onInstantTurn={normalReplay.quickResolveTurn}
              onInstantGame={normalReplay.quickResolveRace}
              onReset={flushNormalPlaybackAndReset}
              isAnimating={normalGame.isAnimating}
              playTurnEnabled={normalGame.playTurnEnabled}
              autoPlayEnabled={normalGame.autoPlayEnabled}
              onAutoPlayEnabledChange={normalGame.setAutoPlayEnabled}
              spectate={normalSpectate}
            />
          </>
        ) : workspaceView === "knockout" ? (
          <>
            <MonteCarloPanel
              heading={t("knockout.monteCarlo.heading")}
              title={t("knockout.monteCarlo.title")}
              description={t("knockout.monteCarlo.description")}
              lineupBasicIds={knockoutParticipantIds}
              lineupComplete={knockoutLineup.isReady}
              runDisabled={knockoutMonteCarloRunDisabled}
              progress={monteCarlo.progress}
              isStopping={monteCarlo.isStopping}
              extremePerformanceEnabled={monteCarloExtremePerformance}
              onExtremePerformanceEnabledChange={setMonteCarloExtremePerformance}
              scenarioOptions={[
                {
                  id: "knockoutTournament",
                  label: t("knockout.monteCarlo.scenario.label"),
                  description: t("knockout.monteCarlo.scenario.description"),
                },
              ]}
              selectedScenarioId="knockoutTournament"
              onSelectedScenarioChange={() => {}}
              onRunBatch={requestKnockoutMonteCarloBatch}
              onAbortRun={abortMonteCarloRun}
            />
            <GameShell
              state={knockout.race.state}
              rankingState={knockout.race.rankingState}
              broadcastPayload={knockout.race.broadcastPayload}
              boardCells={knockout.race.boardCells}
              boardEffects={mapSelection.boardEffects}
              mapSelector={
                <MapSelector
                  selectedMapId={mapSelection.selectedMapId}
                  onSelectMapId={mapSelection.setSelectedMapId}
                  disabled={
                    knockout.race.state.phase === "running" ||
                    knockout.race.isAnimating ||
                    knockoutReplay.isReplayLoaded
                  }
                />
              }
              hoppingEntityIds={knockout.race.hoppingEntityIds}
              idleParticipantIds={[...knockoutParticipantIds, ABBY_ID]}
              headerEyebrow={t("knockout.shell.eyebrow")}
              headerTitle={t("knockout.shell.title")}
              headerDescription={t("knockout.shell.description")}
              sessionLabel={knockoutSessionLabel}
              setupPanel={
                <KnockoutSetupPanel
                  rosterBasics={rosterBasics}
                  groupAIds={knockoutLineup.groupAIds}
                  groupBIds={knockoutLineup.groupBIds}
                  onSetGroupLineup={knockoutLineup.setGroupLineup}
                  onToggleGroupBasicId={knockoutLineup.toggleGroupBasicId}
                  onClearGroupSelections={knockoutLineup.clearGroupSelections}
                  progress={knockout.progress}
                  lineupsReady={knockoutLineup.isReady}
                  isComplete={knockout.isComplete}
                  onStartTournament={beginKnockoutPhase}
                  onAdvanceTournament={beginKnockoutPhase}
                  onReset={flushKnockoutPlaybackAndReset}
                  controlsLocked={knockoutControlsLocked}
                />
              }
              showSetupPanel={knockout.race.state.phase === "idle"}
              startControls={
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={beginKnockoutPhase}
                  disabled={knockoutStartDisabled}
                  className="inline-flex min-h-9 items-center justify-center rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-950 shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:min-h-11 sm:px-5 sm:py-2 sm:text-sm dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                >
                  {t("normal.shell.start")}
                </button>
              }
              onStartSprint={beginKnockoutPhase}
              startShortcutDisabled={knockoutStartDisabled}
              onPlayTurn={knockout.race.playTurn}
              onStepAction={knockout.race.stepAction}
              onInstantTurn={knockoutReplay.quickResolveTurn}
              onInstantGame={knockoutReplay.quickResolveRace}
              onReset={flushKnockoutPlaybackAndClearRace}
              isAnimating={knockout.race.isAnimating}
              playTurnEnabled={knockout.race.playTurnEnabled}
              autoPlayEnabled={knockout.race.autoPlayEnabled}
              onAutoPlayEnabledChange={knockout.race.setAutoPlayEnabled}
              spectate={knockoutSpectate}
            />
          </>
        ) : workspaceView === "tournament" ? (
          <>
            <MonteCarloPanel
              heading={t("tournament.monteCarlo.heading")}
              title={t("tournament.monteCarlo.title")}
              description={t("tournament.monteCarlo.description")}
              lineupBasicIds={resolvedTournamentLineupBasicIds}
              runDisabled={tournamentMonteCarloRunDisabled}
              progress={monteCarlo.progress}
              isStopping={monteCarlo.isStopping}
              extremePerformanceEnabled={monteCarloExtremePerformance}
              onExtremePerformanceEnabledChange={setMonteCarloExtremePerformance}
              scenarioOptions={[
                {
                  id: "tournament",
                  label: t("tournament.monteCarlo.scenarios.tournament.label"),
                  description: t("tournament.monteCarlo.scenarios.tournament.description"),
                },
                {
                  id: "final",
                  label: t("tournament.monteCarlo.scenarios.final.label"),
                  description: t("tournament.monteCarlo.scenarios.final.description"),
                },
              ]}
              selectedScenarioId={selectedTournamentMonteCarloScenarioId}
              onSelectedScenarioChange={(scenarioId) =>
                setSelectedTournamentMonteCarloScenarioId(
                  scenarioId as "tournament" | "final"
                )
              }
              onRunBatch={requestTournamentMonteCarloBatch}
              onAbortRun={abortMonteCarloRun}
            />
            <GameShell
              state={tournament.race.state}
              rankingState={tournament.race.rankingState}
              broadcastPayload={tournament.race.broadcastPayload}
              boardCells={tournament.race.boardCells}
              boardEffects={mapSelection.boardEffects}
              mapSelector={
                <MapSelector
                  selectedMapId={mapSelection.selectedMapId}
                  onSelectMapId={mapSelection.setSelectedMapId}
                  disabled={
                    tournament.race.state.phase === "running" ||
                    tournament.race.isAnimating ||
                    tournamentReplay.isReplayLoaded
                  }
                />
              }
              hoppingEntityIds={tournament.race.hoppingEntityIds}
              idleParticipantIds={idleParticipantIds}
              headerEyebrow={t("tournament.shell.eyebrow")}
              headerTitle={t("tournament.shell.title")}
              headerDescription={t("tournament.shell.description")}
              sessionLabel={tournamentSessionLabel}
              startControls={
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={
                    tournamentRestartStartsFinal
                      ? beginTournamentFinal
                      : beginTournamentPreliminary
                  }
                  disabled={tournamentRestartDisabled}
                  className="inline-flex min-h-9 items-center justify-center rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-950 shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:min-h-11 sm:px-5 sm:py-2 sm:text-sm dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                >
                  {t("normal.shell.start")}
                </button>
              }
              setupPanel={
                <TournamentSetupPanel
                  rosterBasics={rosterBasics}
                  selectedBasicIds={lineup.selectedBasicIds}
                  onSetLineup={lineup.setLineup}
                  onToggleBasicId={lineup.toggleSelectedBasicId}
                  onClearSelections={lineup.clearSelectedBasicIds}
                  finalPlacements={tournament.finalPlacements}
                  preliminaryPlacements={tournament.preliminaryPlacements}
                  onSetFinalPlacements={tournament.setFinalPlacements}
                  onMovePlacement={tournament.moveFinalPlacement}
                  onStartPreliminary={beginTournamentPreliminary}
                  onStartFinal={beginTournamentFinal}
                  onRestorePreliminaryPlacements={
                    tournament.restorePreliminaryPlacements
                  }
                  onReset={flushTournamentPlaybackAndResetTournament}
                  controlsLocked={tournamentControlsLocked}
                />
              }
              showSetupPanel={tournament.race.state.phase === "idle"}
              resetAdjacentControls={
                tournamentCanLaunchFinalFromPreliminary ? (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={beginTournamentFinal}
                    disabled={tournamentLaunchFinalDisabled}
                    className="inline-flex min-h-9 items-center justify-center rounded-full bg-violet-500 px-3 py-1.5 text-xs font-semibold text-violet-950 shadow-lg shadow-violet-900/40 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:min-h-11 sm:px-5 sm:py-2 sm:text-sm dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                  >
                    {t("tournament.setup.finals.start")}
                  </button>
                ) : null
              }
              onStartSprint={
                tournamentRestartStartsFinal
                  ? beginTournamentFinal
                  : beginTournamentPreliminary
              }
              startShortcutDisabled={tournamentRestartDisabled}
              onPlayTurn={tournament.race.playTurn}
              onStepAction={tournament.race.stepAction}
              onInstantTurn={tournamentReplay.quickResolveTurn}
              onInstantGame={tournamentReplay.quickResolveRace}
              onReset={flushTournamentPlaybackAndClearRace}
              isAnimating={tournament.race.isAnimating}
              playTurnEnabled={tournament.race.playTurnEnabled}
              autoPlayEnabled={tournament.race.autoPlayEnabled}
              onAutoPlayEnabledChange={tournament.race.setAutoPlayEnabled}
              spectate={tournamentSpectate}
            />
          </>
        ) : (
          <AnalysisDashboard
            snapshot={monteCarloSnapshot}
            onNavigateSimulation={() => setWorkspaceView(analysisReturnView)}
            onObserverWatchReplayJson={handleObserverWatchReplayJson}
          />
        )}
      </main>
      <footer className="mt-auto border-t border-slate-200/70 px-4 py-6 text-center text-xs text-slate-500/80 dark:border-slate-800/70 dark:text-slate-400/80 sm:px-6 md:px-10 lg:px-14 xl:px-16 2xl:px-24">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 leading-6">
          <p>{t("footer.disclaimer")}</p>
          <FooterSocialLinks />
          <p>
            Build time: <time dateTime={__BUILD_TIMESTAMP__}>{formattedBuildTimestamp}</time>
          </p>
        </div>
      </footer>
    </div>
  );
}
