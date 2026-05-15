import { useCallback, useMemo, useRef, useState } from "react";
import { AnalysisDashboard } from "@/components/AnalysisDashboard";
import {
  AppNavigation,
  type WorkspaceView,
} from "@/components/AppNavigation";
import { DangoPicker } from "@/components/DangoPicker";
import { FooterSocialLinks } from "@/components/FooterSocialLinks";
import { GameShell, type GameShellSpectate } from "@/components/GameShell";
import { MonteCarloPanel } from "@/components/MonteCarloPanel";
import { ReplayTimelineCluster } from "@/components/ReplayTimelineCluster";
import { TournamentSetupPanel } from "@/components/TournamentSetupPanel";
import { ABBY_ID } from "@/constants/ids";
import { text, type LocalizedText } from "@/i18n";
import { useTranslation } from "@/i18n/useTranslation";
import { useGame } from "@/hooks/useGame";
import { useReplayTimeline } from "@/hooks/useReplayTimeline";
import { useLineupSelection } from "@/hooks/useLineupSelection";
import { useTheme } from "@/hooks/useTheme";
import { useTournament } from "@/hooks/useTournament";
import type { HeadlessSimulationScenario } from "@/services/gameEngine";
import { isValidBasicSelection } from "@/services/gameEngine";
import {
  absorbHeadlessOutcomeIntoAggregate,
  createEmptyMonteCarloAggregate,
  finalizeMonteCarloAggregate,
} from "@/services/monteCarloAggregate";
import { runMonteCarloBatch } from "@/services/monteCarloRunner";
import {
  createObserverSession,
  finalizeObserverRecords,
  observeCompletedMatch,
} from "@/services/observerSession";
import { BASIC_CHARACTER_LIST } from "@/services/characters";
import {
  createCustomFinalRaceSetup,
  createNormalRaceSetup,
  createTournamentFinalRaceSetup,
} from "@/services/raceSetup";
import type { DangoId } from "@/types/game";
import type {
  MonteCarloAggregateSnapshot,
  MonteCarloScenarioKind,
} from "@/types/monteCarlo";

function arraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((entry, index) => entry === right[index]);
}

export default function App() {
  const { t, tText } = useTranslation();
  const lineup = useLineupSelection();
  const normalGame = useGame();
  const normalReplay = useReplayTimeline({
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
  const tournament = useTournament(lineup.selectedBasicIds);
  const tournamentReplay = useReplayTimeline({
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
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("normal");
  const [analysisReturnView, setAnalysisReturnView] =
    useState<Exclude<WorkspaceView, "analysis">>("normal");
  const [selectedTournamentMonteCarloScenarioId, setSelectedTournamentMonteCarloScenarioId] =
    useState<"tournament" | "final">("tournament");
  const [monteCarloProgress, setMonteCarloProgress] = useState<{
    completedGames: number;
    totalGames: number;
  } | null>(null);
  const [monteCarloIsStopping, setMonteCarloIsStopping] = useState(false);
  const [monteCarloSnapshot, setMonteCarloSnapshot] =
    useState<MonteCarloAggregateSnapshot | null>(null);
  const monteCarloRunIdRef = useRef(0);
  const monteCarloAbortControllerRef = useRef<AbortController | null>(null);
  const monteCarloLastProgressAtRef = useRef(0);

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

  const runScenarioMonteCarlo = useCallback(
    async (options: {
      totalGames: number;
      scenario: HeadlessSimulationScenario;
      selectedBasicIds: DangoId[];
      scenarioKind: MonteCarloScenarioKind;
      scenarioLabel: LocalizedText;
      returnView: Exclude<WorkspaceView, "analysis">;
    }) => {
      const {
        totalGames,
        scenario,
        selectedBasicIds,
        scenarioKind,
        scenarioLabel,
        returnView,
      } = options;
      if (
        !Number.isSafeInteger(totalGames) ||
        totalGames < 1 ||
        !isValidBasicSelection(selectedBasicIds)
      ) {
        return;
      }
      monteCarloAbortControllerRef.current?.abort();
      const runId = (monteCarloRunIdRef.current += 1);
      const abortController = new AbortController();
      monteCarloAbortControllerRef.current = abortController;
      setMonteCarloIsStopping(false);
      setMonteCarloProgress({ completedGames: 0, totalGames });
      monteCarloLastProgressAtRef.current = 0;
      const aggregate = createEmptyMonteCarloAggregate(
        selectedBasicIds,
        scenarioKind,
        scenarioLabel
      );
      const observerSession = createObserverSession();
      try {
        await runMonteCarloBatch({
          totalRuns: totalGames,
          scenario,
          boardEffectByCellIndex: normalGame.boardEffects,
          onProgress: (completedGames, totalGamesBatch) => {
            if (monteCarloRunIdRef.current === runId) {
              const now = performance.now();
              if (
                completedGames === totalGamesBatch ||
                now - monteCarloLastProgressAtRef.current > 60
              ) {
                setMonteCarloProgress({
                  completedGames,
                  totalGames: totalGamesBatch,
                });
                monteCarloLastProgressAtRef.current = now;
              }
            }
          },
          onOutcome: (outcome) => {
            absorbHeadlessOutcomeIntoAggregate(aggregate, outcome);
            observeCompletedMatch(observerSession, outcome);
          },
          signal: abortController.signal,
          shouldAbort: () => monteCarloRunIdRef.current !== runId,
        });
      } finally {
        if (monteCarloAbortControllerRef.current === abortController) {
          monteCarloAbortControllerRef.current = null;
        }
      }
      if (monteCarloRunIdRef.current !== runId) {
        return;
      }
      setMonteCarloProgress(null);
      setMonteCarloIsStopping(false);
      if (aggregate.totalRuns === 0) {
        return;
      }
      setMonteCarloSnapshot({
        ...finalizeMonteCarloAggregate(aggregate),
        observerRecords: finalizeObserverRecords(observerSession),
      });
      setAnalysisReturnView(returnView);
      setWorkspaceView("analysis");
    },
    [normalGame.boardEffects]
  );

  const abortMonteCarloRun = useCallback(() => {
    const controller = monteCarloAbortControllerRef.current;
    if (!controller || controller.signal.aborted) {
      return;
    }
    setMonteCarloIsStopping(true);
    controller.abort();
  }, []);

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
      });
    },
    [resolvedNormalLineupBasicIds, runScenarioMonteCarlo]
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
      });
    },
    [
      resolvedTournamentLineupBasicIds,
      runScenarioMonteCarlo,
      tournament.finalPlacements,
      tournament.preliminaryPlacements,
    ]
  );

  const normalMonteCarloRunDisabled =
    !isValidBasicSelection(resolvedNormalLineupBasicIds) ||
    normalGame.isAnimating ||
    normalReplay.isReplayLoaded;
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
        tournamentReplay.flushPlaybackForNewSession();
        tournamentReplay.readReplayFromJsonText(json);
        setWorkspaceView("tournament");
      } catch {
        window.alert(t("game.replay.importInvalid"));
      }
    },
    [
      analysisReturnView,
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
              progress={monteCarloProgress}
              isStopping={monteCarloIsStopping}
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
              boardEffects={normalGame.boardEffects}
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
        ) : workspaceView === "tournament" ? (
          <>
            <MonteCarloPanel
              heading={t("tournament.monteCarlo.heading")}
              title={t("tournament.monteCarlo.title")}
              description={t("tournament.monteCarlo.description")}
              lineupBasicIds={resolvedTournamentLineupBasicIds}
              runDisabled={tournamentMonteCarloRunDisabled}
              progress={monteCarloProgress}
              isStopping={monteCarloIsStopping}
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
              boardEffects={tournament.race.boardEffects}
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
