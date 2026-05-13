import { useEffect, useMemo, useState } from "react";
import { ConditionalAnalysisPanel } from "@/components/analysis/ConditionalAnalysisPanel";
import { ObserverRecordsPanel } from "@/components/analysis/ObserverRecordsPanel";
import { OverviewPanel } from "@/components/analysis/OverviewPanel";
import { TournamentInsights } from "@/components/analysis/TournamentInsights";
import { useTranslation } from "@/i18n/useTranslation";
import {
  derivePlacementRows,
  formatPercent,
} from "@/components/analysis/analytics";
import type { MonteCarloAggregateSnapshot } from "@/types/monteCarlo";
import type { DangoId } from "@/types/game";

type AnalysisDashboardProps = {
  snapshot: MonteCarloAggregateSnapshot | null;
  onNavigateSimulation: () => void;
  onObserverWatchReplayJson: (json: string) => void;
};

type DashboardTabId = "overview" | "conditional" | "tournament" | "observer";

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
  onObserverWatchReplayJson,
}: AnalysisDashboardProps) {
  const { getCharacterName, t, tText } = useTranslation();
  const availableTabs = useMemo<DashboardTabId[]>(() => {
    const tabs: DashboardTabId[] = ["overview", "conditional"];
    if (
      snapshot?.scenarioKind === "tournament" ||
      snapshot?.scenarioKind === "final"
    ) {
      tabs.push("tournament");
    }
    tabs.push("observer");
    return tabs;
  }, [snapshot?.scenarioKind]);
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
        snapshot?.finalPlacementCountsByBasicId ?? {},
        getCharacterName
      ).sort((left, right) => {
        if (right.winRate !== left.winRate) {
          return right.winRate - left.winRate;
        }
        if (left.meanPlacement !== right.meanPlacement) {
          return left.meanPlacement - right.meanPlacement;
        }
        return right.stabilityScore - left.stabilityScore;
      }),
    [getCharacterName, snapshot?.finalPlacementCountsByBasicId, snapshot?.selectedBasicIds]
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
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <div className="max-w-lg space-y-3">
          <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {t("analysis.empty.eyebrow")}
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">
            {t("analysis.empty.title")}
          </h2>
          <p className="text-sm font-normal text-slate-600 dark:text-slate-300 md:text-base">
            {t("analysis.empty.description")}
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateSimulation}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-500 px-8 py-3 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400"
        >
          {t("analysis.empty.button")}
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
    <div className="flex w-full flex-1 flex-col gap-6 px-3 py-6 text-slate-900 dark:text-slate-100 sm:gap-8 sm:px-6 sm:py-8 md:px-10 lg:gap-10 lg:px-14 xl:px-16 2xl:px-24">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-xl">
            {t("analysis.header.eyebrow")}
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl md:text-4xl">
            {tText(snapshot.scenarioLabel)}
          </h2>
          <p className="max-w-2xl text-sm font-normal text-slate-600 dark:text-slate-300 md:text-base">
            {t("analysis.header.description", {
              runs: snapshot.totalRuns.toLocaleString(),
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateSimulation}
          className="inline-flex min-h-11 items-center justify-center self-start rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:text-slate-950 lg:self-auto dark:border-slate-600 dark:text-slate-100 dark:hover:text-white"
        >
          {t("analysis.header.back")}
        </button>
      </header>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-4">
        <MetricHighlightCard
          label={
            snapshot.scenarioKind === "tournament"
              ? t("analysis.metrics.averageTournamentLength")
              : t("analysis.metrics.averageRaceLength")
          }
          value={averageTurnsToWin.toFixed(1)}
          hint={
            snapshot.scenarioKind === "tournament"
              ? t("analysis.metrics.averageTournamentLengthHint")
              : t("analysis.metrics.averageRaceLengthHint")
          }
        />
        <MetricHighlightCard
          label={t("analysis.metrics.fastestFinish")}
          value={String(minTurnsDisplay)}
          hint={t("analysis.metrics.fastestFinishHint")}
        />
        <MetricHighlightCard
          label={t("analysis.metrics.titleShare")}
          value={
            dominantWinnerRow
              ? formatPercent(dominantWinnerRow.winRate)
              : "0.0%"
          }
          hint={
            dominantWinnerRow
              ? t("analysis.metrics.titleShareHint", {
                  name: dominantWinnerRow.label,
                })
              : t("analysis.metrics.noWinnerData")
          }
        />
        <MetricHighlightCard
          label={
            snapshot.scenarioKind === "tournament"
              ? t("analysis.metrics.bottomHalfComeback")
              : t("analysis.metrics.bestStability")
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
              ? t("analysis.metrics.bottomHalfComebackHint")
              : highestStabilityRow
                ? t("analysis.metrics.stabilityHint", {
                    name: highestStabilityRow.label,
                  })
                : t("analysis.metrics.noStabilityData")
          }
        />
      </section>

      <section className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3">
        {availableTabs.map((tabId) => {
          const selected = tabId === activeTab;
          const label =
            tabId === "overview"
              ? t("analysis.tabs.overview")
              : tabId === "conditional"
                ? t("analysis.tabs.conditional")
                : tabId === "tournament"
                  ? t("analysis.tabs.tournament")
                  : t("analysis.tabs.observer");
          return (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTab(tabId)}
              className={`inline-flex min-h-11 items-center justify-center rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
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
      ) : activeTab === "tournament" ? (
        <TournamentInsights snapshot={snapshot} />
      ) : (
        <ObserverRecordsPanel
          snapshot={snapshot}
          onWatchReplayJson={onObserverWatchReplayJson}
        />
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
    <div className="min-h-0 rounded-2xl border border-slate-200 bg-white/90 p-2.5 shadow-inner shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-slate-950/40 sm:p-3">
      <p className="truncate text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 truncate font-mono text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-xl">
        {value}
      </p>
      <p className="mt-1 line-clamp-2 text-xs font-normal leading-tight text-slate-500 dark:text-slate-400">
        {hint}
      </p>
    </div>
  );
}
