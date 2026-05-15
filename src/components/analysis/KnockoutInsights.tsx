import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useSafeDangoColors } from "@/services/dangoColors";
import type { DangoId } from "@/types/game";
import type { MonteCarloAggregateSnapshot } from "@/types/monteCarlo";
import {
  colorWithAlpha,
  derivePlacementRows,
  formatPercent,
} from "@/components/analysis/analytics";
import { TournamentFlowGraph } from "@/components/analysis/TournamentFlowGraph";

type KnockoutInsightsProps = {
  snapshot: MonteCarloAggregateSnapshot;
};

type KnockoutInsightTab = "flow" | "competitors" | "drilldown";

type KnockoutCompetitorRow = {
  basicId: DangoId;
  label: string;
  accentHex: string;
  accentInkHex: string;
  titles: number;
  championshipRate: number;
  groupWinRate: number;
  bracketWinRate: number;
  finalWinRate: number;
  groupToWinnersRate: number;
  groupToLosersRate: number;
  winnersToFinalRate: number;
  losersToFinalRate: number;
  finalistToChampionRate: number;
  winnersChampionRate: number;
  losersChampionRate: number;
  groupEntries: number;
  winnersEntries: number;
  losersEntries: number;
  finalsEntries: number;
  winnersToFinals: number;
  losersToFinals: number;
  winnersChampions: number;
  losersChampions: number;
};

function rate(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return (numerator / denominator) * 100;
}

function sortByTitlePressure(rows: KnockoutCompetitorRow[]): KnockoutCompetitorRow[] {
  return [...rows].sort((left, right) => {
    if (right.championshipRate !== left.championshipRate) {
      return right.championshipRate - left.championshipRate;
    }
    if (right.finalistToChampionRate !== left.finalistToChampionRate) {
      return right.finalistToChampionRate - left.finalistToChampionRate;
    }
    return right.finalsEntries - left.finalsEntries;
  });
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="min-h-0 rounded-2xl border border-slate-200 bg-white/90 p-2.5 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60 sm:rounded-3xl sm:p-3">
      <p className="truncate text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 truncate text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-xl">
        {value}
      </p>
      <p className="mt-1 line-clamp-2 text-xs leading-tight text-slate-500 dark:text-slate-400">
        {hint}
      </p>
    </div>
  );
}

function ProgressRail({
  value,
  accentHex,
}: {
  value: number;
  accentHex: string;
}) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-300/70 dark:bg-slate-950/80 dark:ring-slate-700/80">
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: accentHex,
          boxShadow: `0 0 18px ${colorWithAlpha(accentHex, 0.35)}`,
        }}
      />
    </div>
  );
}

function routeAppearanceFloor(totalRuns: number): number {
  if (totalRuns <= 0) {
    return 1;
  }
  return Math.max(40, Math.floor(totalRuns * 0.004));
}

function finalsAppearanceFloor(totalRuns: number): number {
  if (totalRuns <= 0) {
    return 1;
  }
  return Math.max(30, Math.floor(totalRuns * 0.003));
}

function InsightSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">{eyebrow}</p>
      <h4 className="mt-2 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">{title}</h4>
      <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DualRouteBar({
  winnerShare,
  loserShare,
}: {
  winnerShare: number;
  loserShare: number;
}) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-300/70 dark:bg-slate-950/80 dark:ring-slate-700/80">
      <div className="flex h-full w-full">
        <div
          className="h-full bg-emerald-500 transition-[width] duration-300 dark:bg-emerald-400"
          style={{ width: `${Math.min(100, Math.max(0, winnerShare))}%` }}
        />
        <div
          className="h-full bg-amber-500 transition-[width] duration-300 dark:bg-amber-400"
          style={{ width: `${Math.min(100, Math.max(0, loserShare))}%` }}
        />
      </div>
    </div>
  );
}

function CompetitorButton({
  row,
  selected,
  onSelect,
}: {
  row: KnockoutCompetitorRow;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-3xl border p-4 text-left transition ${
        selected
          ? "border-violet-400 bg-violet-50 shadow-md shadow-violet-900/10 dark:border-violet-500 dark:bg-violet-950/35"
          : "border-slate-200 bg-slate-50/80 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/50"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="inline-flex h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: row.accentHex }}
          />
          <p className="truncate text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {row.label}
          </p>
        </div>
        <span className="font-mono text-sm font-bold" style={{ color: row.accentHex }}>
          {formatPercent(row.championshipRate)}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="min-h-0 rounded-xl bg-white px-2 py-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <p className="line-clamp-2 text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500 dark:text-slate-400">
            {t("analysis.knockout.reachFinal")}
          </p>
          <p className="mt-1.5 truncate text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50">
            {formatPercent(rate(row.finalsEntries, row.groupEntries))}
          </p>
        </div>
        <div className="min-h-0 rounded-xl bg-white px-2 py-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <p className="line-clamp-2 text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500 dark:text-slate-400">
            {t("analysis.knockout.finalConversion")}
          </p>
          <p className="mt-1.5 truncate text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50">
            {formatPercent(row.finalistToChampionRate)}
          </p>
        </div>
        <div className="min-h-0 rounded-xl bg-white px-2 py-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <p className="line-clamp-2 text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500 dark:text-slate-400">
            {t("analysis.knockout.titles")}
          </p>
          <p className="mt-1.5 truncate text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50">
            {row.titles.toLocaleString()}
          </p>
        </div>
      </div>
    </button>
  );
}

function CompetitorDetail({ row }: { row: KnockoutCompetitorRow }) {
  const { t } = useTranslation();
  const phaseRows = [
    {
      key: "group",
      title: t("analysis.knockout.phaseGroup"),
      sample: row.groupEntries,
      primaryLabel: t("analysis.knockout.toWinners"),
      primaryRate: row.groupToWinnersRate,
      secondaryLabel: t("analysis.knockout.toLosers"),
      secondaryRate: row.groupToLosersRate,
    },
    row.winnersEntries > 0
      ? {
          key: "winners",
          title: t("analysis.knockout.phaseWinners"),
          sample: row.winnersEntries,
          primaryLabel: t("analysis.knockout.toFinal"),
          primaryRate: row.winnersToFinalRate,
          secondaryLabel: t("analysis.knockout.toChampion"),
          secondaryRate: row.winnersChampionRate,
        }
      : null,
    row.losersEntries > 0
      ? {
          key: "losers",
          title: t("analysis.knockout.phaseLosers"),
          sample: row.losersEntries,
          primaryLabel: t("analysis.knockout.toFinal"),
          primaryRate: row.losersToFinalRate,
          secondaryLabel: t("analysis.knockout.toChampion"),
          secondaryRate: row.losersChampionRate,
        }
      : null,
    row.finalsEntries > 0
      ? {
          key: "final",
          title: t("analysis.knockout.phaseFinal"),
          sample: row.finalsEntries,
          primaryLabel: t("analysis.knockout.finalConversion"),
          primaryRate: row.finalistToChampionRate,
          secondaryLabel: t("analysis.knockout.titleShare"),
          secondaryRate: row.championshipRate,
        }
      : null,
  ].filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-slate-950/60">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {t("analysis.knockout.drilldownEyebrow")}
          </p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {row.label}
          </h3>
          <p className="mt-3 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            {t("analysis.knockout.drilldownDescription")}
          </p>
        </div>
        <span
          className="rounded-full px-4 py-2 text-sm font-bold ring-1 ring-black/10"
          style={{
            backgroundColor: colorWithAlpha(row.accentHex, 0.18),
            color: row.accentHex,
          }}
        >
          {formatPercent(row.finalistToChampionRate)}
        </span>
      </div>
      <div className="mt-6 grid gap-3">
        {phaseRows.map((phase) => (
          <article
            key={phase.key}
            className="rounded-3xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-950/50"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-50">
                  {phase.title}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {t("analysis.conditional.runs", {
                    count: phase.sample.toLocaleString(),
                  })}
                </p>
              </div>
              <div className="grid min-w-[15rem] grid-cols-2 gap-2">
                <div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {phase.primaryLabel}
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-slate-50">
                    {formatPercent(phase.primaryRate)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {phase.secondaryLabel}
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-slate-50">
                    {formatPercent(phase.secondaryRate)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <ProgressRail value={phase.primaryRate} accentHex={row.accentHex} />
              <ProgressRail value={phase.secondaryRate} accentHex={row.accentHex} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function KnockoutInsights({ snapshot }: KnockoutInsightsProps) {
  const { getCharacterName, t } = useTranslation();
  const getSafeDangoColors = useSafeDangoColors();
  const modeAnalytics =
    snapshot.modeAnalytics.kind === "knockout" ? snapshot.modeAnalytics : null;
  const [activeTab, setActiveTab] = useState<KnockoutInsightTab>("flow");

  const championshipRows = useMemo(
    () =>
      derivePlacementRows(
        snapshot.selectedBasicIds,
        snapshot.finalPlacementCountsByBasicId,
        getCharacterName,
        (basicId) => {
          const { chartHex, chartInkHex } = getSafeDangoColors(basicId);
          return { accentHex: chartHex, accentInkHex: chartInkHex };
        }
      ).sort((left, right) => right.winRate - left.winRate),
    [getCharacterName, getSafeDangoColors, snapshot]
  );

  const contextRowsById = useMemo(() => {
    const resolveColors = (basicId: DangoId) => {
      const { chartHex, chartInkHex } = getSafeDangoColors(basicId);
      return { accentHex: chartHex, accentInkHex: chartInkHex };
    };
    const groupRows = derivePlacementRows(
      snapshot.selectedBasicIds,
      snapshot.placementCountsByContext.knockoutGroup,
      getCharacterName,
      resolveColors
    );
    const bracketRows = derivePlacementRows(
      snapshot.selectedBasicIds,
      snapshot.placementCountsByContext.knockoutBracket,
      getCharacterName,
      resolveColors
    );
    const finalRows = derivePlacementRows(
      snapshot.selectedBasicIds,
      snapshot.placementCountsByContext.knockoutFinal,
      getCharacterName,
      resolveColors
    );
    return {
      group: Object.fromEntries(groupRows.map((row) => [row.basicId, row])),
      bracket: Object.fromEntries(bracketRows.map((row) => [row.basicId, row])),
      final: Object.fromEntries(finalRows.map((row) => [row.basicId, row])),
    };
  }, [getCharacterName, getSafeDangoColors, snapshot]
  );

  const competitorRows = useMemo<KnockoutCompetitorRow[]>(() => {
    if (!modeAnalytics) {
      return [];
    }
    return sortByTitlePressure(
      snapshot.selectedBasicIds.map((basicId) => {
        const { chartHex, chartInkHex } = getSafeDangoColors(basicId);
        const counts = modeAnalytics.transitionCounts;
        const winnersChampions =
          counts.winnersBracketChampionCountByBasicId[basicId] ?? 0;
        const losersChampions =
          counts.losersBracketChampionCountByBasicId[basicId] ?? 0;
        const titles = winnersChampions + losersChampions;
        return {
          basicId,
          label: getCharacterName(basicId),
          accentHex: chartHex,
          accentInkHex: chartInkHex,
          titles,
          championshipRate: rate(titles, snapshot.totalRuns),
          groupWinRate: contextRowsById.group[basicId]?.winRate ?? 0,
          bracketWinRate: contextRowsById.bracket[basicId]?.winRate ?? 0,
          finalWinRate: contextRowsById.final[basicId]?.winRate ?? 0,
          groupToWinnersRate:
            modeAnalytics.groupToWinnersBracketRateByBasicId[basicId] ?? 0,
          groupToLosersRate:
            modeAnalytics.groupToLosersBracketRateByBasicId[basicId] ?? 0,
          winnersToFinalRate:
            modeAnalytics.winnersBracketToFinalRateByBasicId[basicId] ?? 0,
          losersToFinalRate:
            modeAnalytics.losersBracketToFinalRateByBasicId[basicId] ?? 0,
          finalistToChampionRate:
            modeAnalytics.finalistToChampionRateByBasicId[basicId] ?? 0,
          winnersChampionRate:
            modeAnalytics.winnersBracketChampionRateByBasicId[basicId] ?? 0,
          losersChampionRate:
            modeAnalytics.losersBracketChampionRateByBasicId[basicId] ?? 0,
          groupEntries: counts.groupEntryCountByBasicId[basicId] ?? 0,
          winnersEntries: counts.winnersBracketEntryCountByBasicId[basicId] ?? 0,
          losersEntries: counts.losersBracketEntryCountByBasicId[basicId] ?? 0,
          finalsEntries: counts.finalsEntryCountByBasicId[basicId] ?? 0,
          winnersToFinals:
            counts.winnersBracketToFinalCountByBasicId[basicId] ?? 0,
          losersToFinals:
            counts.losersBracketToFinalCountByBasicId[basicId] ?? 0,
          winnersChampions,
          losersChampions,
        };
      })
    );
  }, [
    contextRowsById,
    getCharacterName,
    getSafeDangoColors,
    modeAnalytics,
    snapshot.selectedBasicIds,
    snapshot.totalRuns,
  ]);

  const bracketSampleFloor = useMemo(
    () => routeAppearanceFloor(snapshot.totalRuns),
    [snapshot.totalRuns]
  );

  const finalsSampleFloor = useMemo(
    () => finalsAppearanceFloor(snapshot.totalRuns),
    [snapshot.totalRuns]
  );

  const comebackKingRows = useMemo(
    () =>
      competitorRows
        .filter((row) => row.losersEntries >= bracketSampleFloor)
        .slice()
        .sort((left, right) => {
          if (right.losersChampionRate !== left.losersChampionRate) {
            return right.losersChampionRate - left.losersChampionRate;
          }
          return right.losersEntries - left.losersEntries;
        })
        .slice(0, 8),
    [bracketSampleFloor, competitorRows]
  );

  const championPathSplits = useMemo(
    () =>
      competitorRows
        .filter((row) => row.titles > 0)
        .slice()
        .sort((left, right) => {
          if (right.titles !== left.titles) {
            return right.titles - left.titles;
          }
          return right.losersChampions - left.losersChampions;
        })
        .slice(0, 10),
    [competitorRows]
  );

  const premiumLaneFriction = useMemo(
    () =>
      competitorRows
        .filter((row) => row.winnersEntries >= bracketSampleFloor)
        .map((row) => {
          const occupancy = rate(row.winnersEntries, snapshot.totalRuns);
          const crownShare = rate(row.titles, snapshot.totalRuns);
          return {
            row,
            occupancy,
            crownShare,
            spread: occupancy - crownShare,
          };
        })
        .sort((left, right) => {
          if (right.spread !== left.spread) {
            return right.spread - left.spread;
          }
          return right.occupancy - left.occupancy;
        })
        .slice(0, 8),
    [bracketSampleFloor, competitorRows, snapshot.totalRuns]
  );

  const finalsChokers = useMemo(() => {
    const rows = competitorRows.filter((row) => row.finalsEntries >= finalsSampleFloor);
    const sorted = rows.slice().sort((left, right) => {
      if (left.finalistToChampionRate !== right.finalistToChampionRate) {
        return left.finalistToChampionRate - right.finalistToChampionRate;
      }
      return right.finalsEntries - left.finalsEntries;
    });
    return sorted.slice(0, 6);
  }, [competitorRows, finalsSampleFloor]);

  const [focusedBasicId, setFocusedBasicId] = useState<DangoId>(
    snapshot.selectedBasicIds[0] ?? ""
  );

  useEffect(() => {
    if (competitorRows.some((row) => row.basicId === focusedBasicId)) {
      return;
    }
    setFocusedBasicId(competitorRows[0]?.basicId ?? snapshot.selectedBasicIds[0] ?? "");
  }, [competitorRows, focusedBasicId, snapshot.selectedBasicIds]);

  if (!modeAnalytics) {
    return null;
  }

  const focusedRow =
    competitorRows.find((row) => row.basicId === focusedBasicId) ??
    competitorRows[0] ??
    null;
  const totalWinnersChampions = competitorRows.reduce(
    (sum, row) => sum + row.winnersChampions,
    0
  );
  const totalLosersChampions = competitorRows.reduce(
    (sum, row) => sum + row.losersChampions,
    0
  );
  const strongestFinalist = competitorRows.reduce<KnockoutCompetitorRow | null>(
    (best, row) => {
      if (row.finalsEntries <= 0) {
        return best;
      }
      if (!best || row.finalistToChampionRate > best.finalistToChampionRate) {
        return row;
      }
      return best;
    },
    null
  );
  const tabOptions: KnockoutInsightTab[] = ["flow", "competitors", "drilldown"];

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {t("analysis.knockout.eyebrow")}
            </p>
            <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {t("analysis.knockout.title")}
            </h3>
            <p className="mt-3 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              {t("analysis.knockout.description")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100/80 p-1.5 dark:bg-slate-950/70">
            {tabOptions.map((tab) => {
              const selected = tab === activeTab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`min-h-10 rounded-xl border px-4 py-2 text-sm font-bold tracking-tight shadow-sm transition ${
                    selected
                      ? "border-violet-400 bg-violet-50 text-violet-950 shadow-md shadow-violet-900/10 dark:border-violet-500 dark:bg-violet-950/40 dark:text-violet-100"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  }`}
                >
                  {t(`analysis.knockout.tabs.${tab}`)}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
          <MetricCard
            label={t("analysis.knockout.winnersPathChampion")}
            value={formatPercent(rate(totalWinnersChampions, snapshot.totalRuns))}
            hint={t("analysis.knockout.winnersPathChampionHint")}
          />
          <MetricCard
            label={t("analysis.knockout.losersPathChampion")}
            value={formatPercent(rate(totalLosersChampions, snapshot.totalRuns))}
            hint={t("analysis.knockout.losersPathChampionHint")}
          />
          <MetricCard
            label={t("analysis.knockout.finalistConversionLeader")}
            value={strongestFinalist?.label ?? "—"}
            hint={
              strongestFinalist
                ? t("analysis.knockout.finalistConversionLeaderHint", {
                    rate: formatPercent(strongestFinalist.finalistToChampionRate),
                  })
                : t("analysis.knockout.noFinalistData")
            }
          />
          <MetricCard
            label={t("analysis.knockout.comebackShareOfCups")}
            value={formatPercent(rate(totalLosersChampions, snapshot.totalRuns))}
            hint={t("analysis.knockout.comebackShareOfCupsHint")}
          />
        </div>
      </section>

      {activeTab === "flow" ? (
        <div className="grid gap-6">
          <TournamentFlowGraph
            totalRuns={snapshot.totalRuns}
            rows={competitorRows}
            selectedBasicId={focusedBasicId}
            onSelectBasicId={setFocusedBasicId}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <InsightSection
              eyebrow={t("analysis.knockout.tabs.flow")}
              title={t("analysis.knockout.flowComebackKingTitle")}
              description={t("analysis.knockout.flowComebackKingDescription")}
            >
              <div className="space-y-3">
                {comebackKingRows.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t("analysis.knockout.flowEmptySample")}</p>
                ) : (
                  comebackKingRows.map((row) => (
                    <div key={row.basicId} className="space-y-2 rounded-2xl bg-slate-50/90 p-3 ring-1 ring-slate-200 dark:bg-slate-950/50 dark:ring-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-bold" style={{ color: row.accentHex }}>
                          {row.label}
                        </span>
                        <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {formatPercent(row.losersChampionRate)}
                        </span>
                      </div>
                      <ProgressRail value={row.losersChampionRate} accentHex={row.accentHex} />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t("analysis.knockout.comebackKingSample", {
                          count: row.losersEntries.toLocaleString(),
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </InsightSection>

            <InsightSection
              eyebrow={t("analysis.knockout.tabs.flow")}
              title={t("analysis.knockout.flowPremiumLaneTitle")}
              description={t("analysis.knockout.flowPremiumLaneDescription")}
            >
              <div className="space-y-3">
                {premiumLaneFriction.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t("analysis.knockout.flowEmptySample")}</p>
                ) : (
                  premiumLaneFriction.map(({ row, occupancy, crownShare, spread }) => (
                    <div key={row.basicId} className="space-y-3 rounded-2xl bg-slate-50/90 p-3 ring-1 ring-slate-200 dark:bg-slate-950/50 dark:ring-slate-700">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span className="text-sm font-bold" style={{ color: row.accentHex }}>
                          {row.label}
                        </span>
                        <span className="font-mono text-sm font-semibold text-rose-700 dark:text-rose-300">
                          {formatPercent(spread)}
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            {t("analysis.knockout.premiumLaneOccupancy")}
                          </p>
                          <ProgressRail value={occupancy} accentHex={row.accentHex} />
                          <p className="mt-1 font-mono text-xs font-bold text-slate-800 dark:text-slate-100">
                            {formatPercent(occupancy)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            {t("analysis.knockout.premiumLaneTitles")}
                          </p>
                          <ProgressRail value={crownShare} accentHex="#10b981" />
                          <p className="mt-1 font-mono text-xs font-bold text-slate-800 dark:text-slate-100">
                            {formatPercent(crownShare)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white/80 px-3 py-2 ring-1 ring-slate-200 dark:bg-slate-900/60 dark:ring-slate-700">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            {t("analysis.knockout.premiumLaneSpread")}
                          </p>
                          <p className="mt-1 font-mono text-lg font-bold text-rose-700 dark:text-rose-300">{formatPercent(spread)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </InsightSection>
          </div>

          <InsightSection
            eyebrow={t("analysis.knockout.tabs.flow")}
            title={t("analysis.knockout.flowPathSplitTitle")}
            description={t("analysis.knockout.flowPathSplitDescription")}
          >
            <div className="space-y-5">
              {championPathSplits.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("analysis.knockout.flowEmptySample")}</p>
              ) : (
                championPathSplits.map((row) => (
                  <div key={row.basicId} className="space-y-2 rounded-2xl bg-slate-50/90 p-4 ring-1 ring-slate-200 dark:bg-slate-950/45 dark:ring-slate-700">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-bold" style={{ color: row.accentHex }}>
                        {row.label}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {t("analysis.knockout.pathSplitTitles", { count: row.titles })}
                      </span>
                    </div>
                    <DualRouteBar winnerShare={rate(row.winnersChampions, row.titles)} loserShare={rate(row.losersChampions, row.titles)} />
                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <span style={{ color: "#10b981" }}>
                        {t("analysis.knockout.pathSplitWinnerShare", {
                          rate: formatPercent(rate(row.winnersChampions, row.titles)),
                        })}
                      </span>
                      <span style={{ color: "#f59e0b" }}>
                        {t("analysis.knockout.pathSplitLoserShare", {
                          rate: formatPercent(rate(row.losersChampions, row.titles)),
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </InsightSection>

          <InsightSection
            eyebrow={t("analysis.knockout.tabs.flow")}
            title={t("analysis.knockout.flowFinalChokeTitle")}
            description={t("analysis.knockout.flowFinalChokeDescription")}
          >
            <div className="space-y-3">
              {finalsChokers.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("analysis.knockout.flowEmptySample")}</p>
              ) : (
                finalsChokers.map((row) => (
                  <div key={row.basicId} className="space-y-2 rounded-2xl bg-slate-50/90 p-3 ring-1 ring-slate-200 dark:bg-slate-950/50 dark:ring-slate-700">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold" style={{ color: row.accentHex }}>
                        {row.label}
                      </span>
                      <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {formatPercent(row.finalistToChampionRate)}
                      </span>
                    </div>
                    <ProgressRail value={row.finalistToChampionRate} accentHex={row.accentHex} />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("analysis.conditional.runs", { count: row.finalsEntries.toLocaleString() })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </InsightSection>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {t("analysis.knockout.championshipTitle")}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t("analysis.knockout.championshipDescription")}
            </p>
            <div className="mt-6 space-y-4">
              {championshipRows.slice(0, 8).map((row) => (
                <div key={row.basicId} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-bold" style={{ color: row.accentHex }}>
                      {row.label}
                    </span>
                    <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {formatPercent(row.winRate)}
                    </span>
                  </div>
                  <ProgressRail value={row.winRate} accentHex={row.accentHex} />
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : activeTab === "competitors" ? (
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {t("analysis.knockout.competitorTitle")}
          </p>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            {t("analysis.knockout.competitorDescription")}
          </p>
          <div className="mt-6 grid gap-3 xl:grid-cols-2">
            {competitorRows.map((row) => (
              <CompetitorButton
                key={row.basicId}
                row={row}
                selected={row.basicId === focusedBasicId}
                onSelect={() => {
                  setFocusedBasicId(row.basicId);
                  setActiveTab("drilldown");
                }}
              />
            ))}
          </div>
        </section>
      ) : focusedRow ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {t("analysis.knockout.selectCompetitor")}
            </p>
            <div className="mt-5 grid gap-3">
              {competitorRows.map((row) => (
                <CompetitorButton
                  key={row.basicId}
                  row={row}
                  selected={row.basicId === focusedRow.basicId}
                  onSelect={() => setFocusedBasicId(row.basicId)}
                />
              ))}
            </div>
          </section>
          <CompetitorDetail row={focusedRow} />
        </div>
      ) : null}
    </div>
  );
}
