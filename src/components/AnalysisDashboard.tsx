import { useEffect, useMemo, useState } from "react";
import { ConditionalAnalysisPanel } from "@/components/analysis/ConditionalAnalysisPanel";
import { OverviewPanel } from "@/components/analysis/OverviewPanel";
import { TournamentInsights } from "@/components/analysis/TournamentInsights";
import {
  derivePlacementRows,
  formatPercent,
} from "@/components/analysis/analytics";
import type { MonteCarloAggregateSnapshot } from "@/types/monteCarlo";
import type { DangoId } from "@/types/game";

type AnalysisDashboardProps = {
  snapshot: MonteCarloAggregateSnapshot | null;
  onNavigateSimulation: () => void;
};

type DashboardTabId = "overview" | "conditional" | "tournament";

function pickDominantBasicId(tallies: Record<string, number>): DangoId | null {
  return Object.entries(tallies).reduce<DangoId | null>((bestId, [basicId, value]) => {
    if (!bestId) {
      return basicId;
    }
    return value > (tallies[bestId] ?? 0) ? basicId : bestId;
  }, null);
}

function sumUnderdogChampionships(snapshot: MonteCarloAggregateSnapshot): number {
  return snapshot.selectedBasicIds.reduce((sum, basicId) => {
    const matrix = snapshot.preliminaryToFinalCountsByBasicId[basicId] ?? [];
    return (
      sum +
      matrix
        .slice(3)
        .reduce(
          (rowSum, row) => rowSum + (row?.[0] ?? 0),
          0
        )
    );
  }, 0);
}

export function AnalysisDashboard({
  snapshot,
  onNavigateSimulation,
}: AnalysisDashboardProps) {
  const availableTabs = useMemo<DashboardTabId[]>(
    () =>
      snapshot?.scenarioKind === "tournament"
        ? ["overview", "conditional", "tournament"]
        : ["overview", "conditional"],
    [snapshot?.scenarioKind]
  );
  const [activeTab, setActiveTab] = useState<DashboardTabId>("overview");
  const [selectedWinnerId, setSelectedWinnerId] = useState<DangoId>(
    snapshot?.selectedBasicIds[0] ?? ""
  );

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab("overview");
    }
  }, [activeTab, availableTabs]);

  const finalRows = useMemo(
    () =>
      derivePlacementRows(
        snapshot?.selectedBasicIds ?? [],
        snapshot?.finalPlacementCountsByBasicId ?? {}
      ).sort((left, right) => {
        if (right.winRate !== left.winRate) {
          return right.winRate - left.winRate;
        }
        if (left.meanPlacement !== right.meanPlacement) {
          return left.meanPlacement - right.meanPlacement;
        }
        return right.stabilityScore - left.stabilityScore;
      }),
    [snapshot?.finalPlacementCountsByBasicId, snapshot?.selectedBasicIds]
  );

  useEffect(() => {
    if (!snapshot) {
      return;
    }
    if (snapshot.selectedBasicIds.includes(selectedWinnerId)) {
      return;
    }
    setSelectedWinnerId(finalRows[0]?.basicId ?? snapshot.selectedBasicIds[0] ?? "");
  }, [finalRows, selectedWinnerId, snapshot]);

  if (!snapshot || snapshot.totalRuns === 0) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <div className="max-w-lg space-y-3">
          <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Results nook
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">
            No cozy batch yet
          </h2>
          <p className="text-sm font-normal text-slate-500 dark:text-slate-400 md:text-base">
            Hop back to Simulation and fire off a bulk run—when the bar fills up,
            we'll tuck all the sweet summaries here for you.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateSimulation}
          className="rounded-full bg-emerald-500 px-8 py-3 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400"
        >
          Back to the race
        </button>
      </div>
    );
  }

  const averageTurnsToWin = snapshot.sumTurns / snapshot.totalRuns;
  const dominantWinnerId = pickDominantBasicId(snapshot.winsByBasicId);
  const dominantWinnerRow =
    finalRows.find((row) => row.basicId === dominantWinnerId) ?? finalRows[0] ?? null;
  const highestStabilityRow = finalRows.reduce<(typeof finalRows)[number] | null>(
    (best, row) => {
      if (!best || row.stabilityScore > best.stabilityScore) {
        return row;
      }
      return best;
    },
    null
  );
  const underdogChampionshipRate =
    snapshot.scenarioKind === "tournament"
      ? (sumUnderdogChampionships(snapshot) / snapshot.totalRuns) * 100
      : 0;
  const minTurnsDisplay =
    snapshot.totalRuns > 0 && Number.isFinite(snapshot.minTurns)
      ? snapshot.minTurns
      : "—";

  return (
    <div className="flex w-full flex-col gap-10 px-4 py-10 text-slate-900 dark:text-slate-100 sm:px-6 md:px-10 lg:px-14 xl:px-16 2xl:px-24">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-xl">
            Advanced analytics
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">
            {snapshot.scenarioLabel}
          </h2>
          <p className="max-w-2xl text-sm font-normal text-slate-500 dark:text-slate-400 md:text-base">
            From {snapshot.totalRuns.toLocaleString()} simulated runs with this same
            lineup. This dashboard tracks full placement distributions, winner-based
            conditional slices, and tournament seed-to-title transitions.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateSimulation}
          className="self-start rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:text-slate-950 md:self-auto dark:border-slate-600 dark:text-slate-100 dark:hover:text-white"
        >
          Return to simulation
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricHighlightCard
          label={snapshot.scenarioKind === "tournament" ? "Avg tournament length" : "Avg race length"}
          value={averageTurnsToWin.toFixed(1)}
          hint={snapshot.scenarioKind === "tournament" ? "Prelims plus finals combined" : "Average turns to finish"}
        />
        <MetricHighlightCard
          label="Fastest finish"
          value={String(minTurnsDisplay)}
          hint="Shortest complete simulation in the batch"
        />
        <MetricHighlightCard
          label="Lead title share"
          value={
            dominantWinnerRow
              ? formatPercent(dominantWinnerRow.winRate)
              : "0.0%"
          }
          hint={dominantWinnerRow ? `${dominantWinnerRow.label} wins most often` : "No winner data"}
        />
        <MetricHighlightCard
          label={
            snapshot.scenarioKind === "tournament"
              ? "Bottom-half comeback"
              : "Best stability"
          }
          value={
            snapshot.scenarioKind === "tournament"
              ? formatPercent(underdogChampionshipRate)
              : highestStabilityRow
                ? `${Math.round(highestStabilityRow.stabilityScore)}`
                : "—"
          }
          hint={
            snapshot.scenarioKind === "tournament"
              ? "Titles won after placing 4th-6th in prelims"
              : highestStabilityRow
                ? `${highestStabilityRow.label} has the tightest finish spread`
                : "No stability data"
          }
        />
      </section>

      <section className="flex flex-wrap gap-3">
        {availableTabs.map((tabId) => {
          const selected = tabId === activeTab;
          const label =
            tabId === "overview"
              ? "Overview"
              : tabId === "conditional"
                ? "If Winner..."
                : "Tournament";
          return (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTab(tabId)}
              className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                selected
                  ? "border-violet-400 bg-violet-50 text-violet-950 shadow-md shadow-violet-900/10 dark:border-violet-500 dark:bg-violet-950/40 dark:text-violet-100"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200"
              }`}
            >
              {label}
            </button>
          );
        })}
      </section>

      {activeTab === "overview" ? (
        <OverviewPanel snapshot={snapshot} />
      ) : activeTab === "conditional" ? (
        <ConditionalAnalysisPanel
          snapshot={snapshot}
          selectedWinnerId={selectedWinnerId}
          onSelectedWinnerIdChange={setSelectedWinnerId}
        />
      ) : (
        <TournamentInsights snapshot={snapshot} />
      )}
    </div>
  );
}

type MetricHighlightCardProps = {
  label: string;
  value: string;
  hint: string;
};

function MetricHighlightCard({
  label,
  value,
  hint,
}: MetricHighlightCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-inner shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-slate-950/40">
      <p className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-200">
        {label}
      </p>
      <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {value}
      </p>
      <p className="mt-2 text-xs font-normal text-slate-500 dark:text-slate-500">{hint}</p>
    </div>
  );
}
