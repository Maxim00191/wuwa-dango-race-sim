import { useCallback, useMemo, useRef, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { AnalysisDashboard } from "@/components/AnalysisDashboard";
import { AppNavigation } from "@/components/AppNavigation";
import { GameShell } from "@/components/GameShell";
import { MonteCarloPanel } from "@/components/MonteCarloPanel";
import { useGame } from "@/hooks/useGame";
import { isValidBasicSelection } from "@/services/gameEngine";
import {
  absorbHeadlessOutcomeIntoAggregate,
  createEmptyMonteCarloAggregate,
} from "@/services/monteCarloAggregate";
import { runMonteCarloBatch } from "@/services/monteCarloRunner";
import type { MonteCarloAggregateSnapshot } from "@/types/monteCarlo";

type WorkspaceView = "simulation" | "analysis";

export default function App() {
  const game = useGame();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [workspaceView, setWorkspaceView] =
    useState<WorkspaceView>("simulation");
  const [monteCarloProgress, setMonteCarloProgress] = useState<{
    completedGames: number;
    totalGames: number;
  } | null>(null);
  const [monteCarloSnapshot, setMonteCarloSnapshot] =
    useState<MonteCarloAggregateSnapshot | null>(null);
  const monteCarloRunIdRef = useRef(0);

  const resolvedLineupBasicIds = useMemo(() => {
    if (game.state.phase === "idle") {
      return game.pendingBasicIds;
    }
    return game.state.activeBasicIds;
  }, [game.state.phase, game.pendingBasicIds, game.state.activeBasicIds]);

  const requestMonteCarloBatch = useCallback(
    async (totalGames: number) => {
      if (!isValidBasicSelection(resolvedLineupBasicIds)) {
        return;
      }
      const runId = (monteCarloRunIdRef.current += 1);
      setMonteCarloProgress({ completedGames: 0, totalGames });
      const aggregate = createEmptyMonteCarloAggregate(resolvedLineupBasicIds);
      await runMonteCarloBatch({
        totalRuns: totalGames,
        selectedBasicIds: resolvedLineupBasicIds,
        boardEffectByCellIndex: game.boardEffects,
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
      setWorkspaceView("analysis");
    },
    [game.boardEffects, resolvedLineupBasicIds]
  );

  const monteCarloRunDisabled =
    !isValidBasicSelection(resolvedLineupBasicIds) ||
    Boolean(monteCarloProgress) ||
    game.isAnimating;

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AppNavigation
        activeView={workspaceView}
        onSelectView={setWorkspaceView}
        isDarkTheme={isDark}
        onToggleTheme={toggleTheme}
      />
      {workspaceView === "simulation" ? (
        <>
          <MonteCarloPanel
            lineupBasicIds={resolvedLineupBasicIds}
            runDisabled={monteCarloRunDisabled}
            progress={monteCarloProgress}
            onRunBatch={requestMonteCarloBatch}
          />
          <GameShell
            state={game.state}
            rankingState={game.rankingState}
            broadcastPayload={game.broadcastPayload}
            boardCells={game.boardCells}
            boardEffects={game.boardEffects}
            hoppingEntityIds={game.hoppingEntityIds}
            pendingBasicIds={game.pendingBasicIds}
            onToggleBasicId={game.togglePendingBasicId}
            onStart={game.start}
            onPlayTurn={game.playTurn}
            onStepAction={game.stepAction}
            onInstantTurn={game.instantFullTurn}
            onInstantGame={game.instantSimulateGame}
            onReset={game.reset}
            isAnimating={game.isAnimating}
            playTurnEnabled={game.playTurnEnabled}
            autoPlayEnabled={game.autoPlayEnabled}
            onAutoPlayEnabledChange={game.setAutoPlayEnabled}
          />
        </>
      ) : (
        <AnalysisDashboard
          snapshot={monteCarloSnapshot}
          onNavigateSimulation={() => setWorkspaceView("simulation")}
        />
      )}
    </div>
  );
}
