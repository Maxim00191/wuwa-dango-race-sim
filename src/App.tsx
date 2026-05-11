import { useCallback, useMemo, useRef, useState } from "react";
import { AnalysisDashboard } from "@/components/AnalysisDashboard";
import {
  AppNavigation,
  type WorkspaceView,
} from "@/components/AppNavigation";
import { DangoPicker } from "@/components/DangoPicker";
import { GameShell } from "@/components/GameShell";
import { MonteCarloPanel } from "@/components/MonteCarloPanel";
import { TournamentSetupPanel } from "@/components/TournamentSetupPanel";
import { ABBY_ID } from "@/constants/ids";
import { useGame } from "@/hooks/useGame";
import { useLineupSelection } from "@/hooks/useLineupSelection";
import { useTheme } from "@/hooks/useTheme";
import { useTournament } from "@/hooks/useTournament";
import type { HeadlessSimulationScenario } from "@/services/gameEngine";
import { isValidBasicSelection } from "@/services/gameEngine";
import {
  absorbHeadlessOutcomeIntoAggregate,
  createEmptyMonteCarloAggregate,
} from "@/services/monteCarloAggregate";
import { runMonteCarloBatch } from "@/services/monteCarloRunner";
import { CHARACTER_LIST } from "@/services/characters";
import {
  createCustomFinalRaceSetup,
  createNormalRaceSetup,
  createTournamentFinalRaceSetup,
} from "@/services/raceSetup";
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
  const lineup = useLineupSelection();
  const normalGame = useGame();
  const tournament = useTournament(lineup.selectedBasicIds);
  const { isDark, toggle: toggleTheme } = useTheme();
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("normal");
  const [analysisReturnView, setAnalysisReturnView] =
    useState<Exclude<WorkspaceView, "analysis">>("normal");
  const [selectedTournamentMonteCarloScenarioId, setSelectedTournamentMonteCarloScenarioId] =
    useState<"tournament" | "final">("tournament");
  const [monteCarloProgress, setMonteCarloProgress] = useState<{
    completedGames: number;
    totalGames: number;
  } | null>(null);
  const [monteCarloSnapshot, setMonteCarloSnapshot] =
    useState<MonteCarloAggregateSnapshot | null>(null);
  const monteCarloRunIdRef = useRef(0);

  const rosterBasics = useMemo(
    () => CHARACTER_LIST.filter((character) => character.role === "basic"),
    []
  );
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
      selectedBasicIds: string[];
      scenarioKind: MonteCarloScenarioKind;
      scenarioLabel: string;
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
      if (!isValidBasicSelection(selectedBasicIds)) {
        return;
      }
      const runId = (monteCarloRunIdRef.current += 1);
      setMonteCarloProgress({ completedGames: 0, totalGames });
      const aggregate = createEmptyMonteCarloAggregate(
        selectedBasicIds,
        scenarioKind,
        scenarioLabel
      );
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
        shouldAbort: () => monteCarloRunIdRef.current !== runId,
      });
      if (monteCarloRunIdRef.current !== runId) {
        return;
      }
      setMonteCarloProgress(null);
      setMonteCarloSnapshot(aggregate);
      setAnalysisReturnView(returnView);
      setWorkspaceView("analysis");
    },
    [normalGame.boardEffects]
  );

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
        scenarioLabel: "Normal Race Monte Carlo",
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
          scenarioLabel: "Full Tournament Monte Carlo",
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
          ? "Tournament Final Monte Carlo"
          : "Custom Final Monte Carlo",
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
    Boolean(monteCarloProgress) ||
    normalGame.isAnimating;
  const tournamentMonteCarloRunDisabled =
    !isValidBasicSelection(resolvedTournamentLineupBasicIds) ||
    Boolean(monteCarloProgress) ||
    tournament.race.isAnimating;
  const normalStartDisabled =
    normalGame.state.phase === "running" ||
    normalGame.isAnimating ||
    !isValidBasicSelection(lineup.selectedBasicIds);
  const tournamentControlsLocked =
    tournament.race.state.phase === "running" || tournament.race.isAnimating;
  const normalSessionLabel =
    normalGame.state.phase === "idle"
      ? "Ready for a normal race"
      : normalGame.state.label ?? "Normal Race";
  const tournamentSessionLabel =
    tournament.race.state.phase === "running"
      ? tournament.race.state.label ?? "Tournament Race"
      : tournament.race.state.phase === "finished"
        ? tournament.race.state.mode === "tournamentPreliminary"
          ? "Preliminary Complete"
          : tournament.race.state.label ?? "Final Complete"
        : tournament.sessionLabel;

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AppNavigation
        activeView={workspaceView}
        onSelectView={setWorkspaceView}
        isDarkTheme={isDark}
        onToggleTheme={toggleTheme}
      />
      {workspaceView === "normal" ? (
        <>
          <MonteCarloPanel
            heading="Lots of practice laps"
            title="Replay this normal race lineup at speed"
            description="Simulate the selected six-dango lineup from the standard start so you can compare likely winners and race pace."
            lineupBasicIds={resolvedNormalLineupBasicIds}
            runDisabled={normalMonteCarloRunDisabled}
            progress={monteCarloProgress}
            scenarioOptions={[
              {
                id: "normalRace",
                label: "Normal race",
                description: "Every run starts from the usual full-stack opener.",
              },
            ]}
            selectedScenarioId="normalRace"
            onSelectedScenarioChange={() => {}}
            onRunBatch={requestNormalMonteCarloBatch}
          />
          <GameShell
            state={normalGame.state}
            rankingState={normalGame.rankingState}
            broadcastPayload={normalGame.broadcastPayload}
            boardCells={normalGame.boardCells}
            boardEffects={normalGame.boardEffects}
            hoppingEntityIds={normalGame.hoppingEntityIds}
            idleParticipantIds={idleParticipantIds}
            headerEyebrow="Normal mode"
            headerTitle="Dango Derby"
            headerDescription="Hop, stack, and scramble around the loop in the standard one-race format."
            sessionLabel={normalSessionLabel}
            setupPanel={
              <DangoPicker
                rosterBasics={rosterBasics}
                selectedBasicIds={lineup.selectedBasicIds}
                onToggleBasicId={lineup.toggleSelectedBasicId}
              />
            }
            showSetupPanel={normalGame.state.phase === "idle"}
            startControls={
              <button
                type="button"
                onClick={() =>
                  normalGame.start(createNormalRaceSetup(lineup.selectedBasicIds))
                }
                disabled={normalStartDisabled}
                className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
              >
                Start normal race
              </button>
            }
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
            heading="Bracket forecasting"
            title="Simulate whole tournaments or just the final"
            description="Stress-test both rounds together, or run final-only batches from the current finals order."
            lineupBasicIds={resolvedTournamentLineupBasicIds}
            runDisabled={tournamentMonteCarloRunDisabled}
            progress={monteCarloProgress}
            scenarioOptions={[
              {
                id: "tournament",
                label: "Full tournament",
                description: "Run a preliminary, seed the final from placements, then crown a champion.",
              },
              {
                id: "final",
                label: "Current finals setup",
                description: "Skip the preliminary and simulate only the current finals order.",
              },
            ]}
            selectedScenarioId={selectedTournamentMonteCarloScenarioId}
            onSelectedScenarioChange={(scenarioId) =>
              setSelectedTournamentMonteCarloScenarioId(
                scenarioId as "tournament" | "final"
              )
            }
            onRunBatch={requestTournamentMonteCarloBatch}
          />
          <GameShell
            state={tournament.race.state}
            rankingState={tournament.race.rankingState}
            broadcastPayload={tournament.race.broadcastPayload}
            boardCells={tournament.race.boardCells}
            boardEffects={tournament.race.boardEffects}
            hoppingEntityIds={tournament.race.hoppingEntityIds}
            idleParticipantIds={idleParticipantIds}
            headerEyebrow="Tournament mode"
            headerTitle="Dango Cup"
            headerDescription="Run a preliminary, seed the final from placements, or jump straight into a custom final arrangement."
            sessionLabel={tournamentSessionLabel}
            setupPanel={
              <TournamentSetupPanel
                rosterBasics={rosterBasics}
                selectedBasicIds={lineup.selectedBasicIds}
                onToggleBasicId={lineup.toggleSelectedBasicId}
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
            showSetupPanel={tournament.race.state.phase !== "running"}
            startControls={null}
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
    </div>
  );
}
