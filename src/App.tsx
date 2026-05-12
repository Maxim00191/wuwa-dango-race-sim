import { useCallback, useMemo, useRef, useState } from "react";
import { AnalysisDashboard } from "@/components/AnalysisDashboard";
import {
  AppNavigation,
  type WorkspaceView,
} from "@/components/AppNavigation";
import { DangoPicker } from "@/components/DangoPicker";
import { FooterSocialLinks } from "@/components/FooterSocialLinks";
import { GameShell } from "@/components/GameShell";
import { MonteCarloPanel } from "@/components/MonteCarloPanel";
import { TournamentSetupPanel } from "@/components/TournamentSetupPanel";
import { ABBY_ID } from "@/constants/ids";
import { text, type LocalizedText } from "@/i18n";
import { useTranslation } from "@/i18n/useTranslation";
import { useGame } from "@/hooks/useGame";
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
  const tournament = useTournament(lineup.selectedBasicIds);
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

  const rosterBasics = useMemo(() => BASIC_CHARACTER_LIST, []);
  const idleParticipantIds = useMemo(
    () => [...lineup.selectedBasicIds, ABBY_ID],
    [lineup.selectedBasicIds]
  );

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
      const aggregate = createEmptyMonteCarloAggregate(
        selectedBasicIds,
        scenarioKind,
        scenarioLabel
      );
      try {
        await runMonteCarloBatch({
          totalRuns: totalGames,
          scenario,
          boardEffectByCellIndex: normalGame.boardEffects,
          onProgress: (completedGames, totalGamesBatch) => {
            if (monteCarloRunIdRef.current === runId) {
              setMonteCarloProgress({
                completedGames,
                totalGames: totalGamesBatch,
              });
            }
          },
          onOutcome: (outcome) => {
            absorbHeadlessOutcomeIntoAggregate(aggregate, outcome);
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
      setMonteCarloSnapshot(finalizeMonteCarloAggregate(aggregate));
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
    !isValidBasicSelection(resolvedNormalLineupBasicIds) || normalGame.isAnimating;
  const tournamentMonteCarloRunDisabled =
    !isValidBasicSelection(resolvedTournamentLineupBasicIds) ||
    tournament.race.isAnimating;
  const normalStartDisabled =
    normalGame.state.phase === "running" ||
    normalGame.isAnimating ||
    !isValidBasicSelection(lineup.selectedBasicIds);
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
    tournament.race.state.mode === null;
  const tournamentLaunchFinalDisabled =
    !tournamentCanLaunchFinalFromPreliminary ||
    tournament.race.state.phase === "running" ||
    tournament.race.isAnimating ||
    !isValidBasicSelection(resolvedTournamentLineupBasicIds);
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
                  onClick={() =>
                    normalGame.start(createNormalRaceSetup(lineup.selectedBasicIds))
                  }
                  disabled={normalStartDisabled}
                  className="inline-flex min-h-9 items-center justify-center rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-950 shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:min-h-11 sm:px-5 sm:py-2 sm:text-sm dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                >
                  {t("normal.shell.start")}
                </button>
              }
              onStartSprint={() =>
                normalGame.start(createNormalRaceSetup(lineup.selectedBasicIds))
              }
              startShortcutDisabled={normalStartDisabled}
              onPlayTurn={normalGame.playTurn}
              onStepAction={normalGame.stepAction}
              onInstantTurn={normalGame.instantFullTurn}
              onInstantGame={normalGame.instantSimulateGame}
              onReset={normalGame.reset}
              isAnimating={normalGame.isAnimating}
              playTurnEnabled={normalGame.playTurnEnabled}
              autoPlayEnabled={normalGame.autoPlayEnabled}
              onAutoPlayEnabledChange={normalGame.setAutoPlayEnabled}
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
                      ? tournament.startFinal
                      : tournament.startPreliminary
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
                  onStartPreliminary={tournament.startPreliminary}
                  onStartFinal={tournament.startFinal}
                  onRestorePreliminaryPlacements={
                    tournament.restorePreliminaryPlacements
                  }
                  onReset={tournament.resetTournament}
                  controlsLocked={tournamentControlsLocked}
                />
              }
              showSetupPanel={tournament.race.state.phase === "idle"}
              resetAdjacentControls={
                tournamentCanLaunchFinalFromPreliminary ? (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={tournament.startFinal}
                    disabled={tournamentLaunchFinalDisabled}
                    className="inline-flex min-h-9 items-center justify-center rounded-full bg-violet-500 px-3 py-1.5 text-xs font-semibold text-violet-950 shadow-lg shadow-violet-900/40 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:min-h-11 sm:px-5 sm:py-2 sm:text-sm dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                  >
                    {t("tournament.setup.finals.start")}
                  </button>
                ) : null
              }
              onStartSprint={
                tournamentRestartStartsFinal
                  ? tournament.startFinal
                  : tournament.startPreliminary
              }
              startShortcutDisabled={tournamentRestartDisabled}
              onPlayTurn={tournament.race.playTurn}
              onStepAction={tournament.race.stepAction}
              onInstantTurn={tournament.race.instantFullTurn}
              onInstantGame={tournament.race.instantSimulateGame}
              onReset={tournament.clearRace}
              isAnimating={tournament.race.isAnimating}
              playTurnEnabled={tournament.race.playTurnEnabled}
              autoPlayEnabled={tournament.race.autoPlayEnabled}
              onAutoPlayEnabledChange={tournament.race.setAutoPlayEnabled}
            />
          </>
        ) : (
          <AnalysisDashboard
            snapshot={monteCarloSnapshot}
            onNavigateSimulation={() => setWorkspaceView(analysisReturnView)}
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
