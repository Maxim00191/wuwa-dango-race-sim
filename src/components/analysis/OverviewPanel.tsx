import { useEffect, useMemo, useState } from "react";
import { MetaInsightsPanel } from "@/components/analysis/MetaInsightsPanel";
import { useTranslation } from "@/i18n/useTranslation";
import { useSafeDangoColors } from "@/services/dangoColors";
import type { DangoId } from "@/types/game";
import type {
  MonteCarloAggregateSnapshot,
  MonteCarloRaceContext,
} from "@/types/monteCarlo";
import {
  colorWithAlpha,
  derivePlacementRows,
  formatPercent,
  type PlacementRowDatum,
} from "@/components/analysis/analytics";

type OverviewPanelProps = {
  snapshot: MonteCarloAggregateSnapshot;
};

const RACE_CONTEXT_OPTIONS: MonteCarloRaceContext[] = [
  "sprint",
  "qualifier",
  "final",
];

function sortRows(rows: PlacementRowDatum[]): PlacementRowDatum[] {
  return [...rows].sort((left, right) => {
    if (right.winRate !== left.winRate) {
      return right.winRate - left.winRate;
    }
    if (left.meanPlacement !== right.meanPlacement) {
      return left.meanPlacement - right.meanPlacement;
    }
    return right.stabilityScore - left.stabilityScore;
  });
}

function pickHighestStability(rows: PlacementRowDatum[]): PlacementRowDatum | null {
  return rows.reduce<PlacementRowDatum | null>((best, row) => {
    if (!best || row.stabilityScore > best.stabilityScore) {
      return row;
    }
    return best;
  }, null);
}

function pickSwingiest(rows: PlacementRowDatum[]): PlacementRowDatum | null {
  return rows.reduce<PlacementRowDatum | null>((best, row) => {
    if (!best || row.stabilityScore < best.stabilityScore) {
      return row;
    }
    return best;
  }, null);
}

function segmentAlpha(positionIndex: number, segmentCount: number): number {
  if (segmentCount <= 1) {
    return 0.85;
  }
  return 0.92 - positionIndex * (0.48 / (segmentCount - 1));
}

function stackedBarGradient(row: PlacementRowDatum): string {
  let cursor = 0;
  const stops: string[] = [];
  row.rates.forEach((rate, placementIndex) => {
    const next = cursor + rate;
    const color = colorWithAlpha(
      row.accentHex,
      segmentAlpha(placementIndex, row.rates.length)
    );
    stops.push(`${color} ${cursor}% ${next}%`);
    cursor = next;
  });
  if (stops.length === 0) {
    return "linear-gradient(90deg, rgba(148, 163, 184, 0.16) 0%, rgba(148, 163, 184, 0.16) 100%)";
  }
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

function WinRateOverview({
  rows,
  scenarioKind,
  selectedContext,
  availableContexts,
  onSelectedContextChange,
}: {
  rows: PlacementRowDatum[];
  scenarioKind: MonteCarloAggregateSnapshot["scenarioKind"];
  selectedContext: MonteCarloRaceContext;
  availableContexts: MonteCarloRaceContext[];
  onSelectedContextChange: (context: MonteCarloRaceContext) => void;
}) {
  const { t } = useTranslation();
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-slate-950/60">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {t("analysis.overview.winRateEyebrow")}
          </p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {scenarioKind === "tournament"
              ? t("analysis.overview.winRateTitleTournament")
              : t("analysis.overview.winRateTitleRace")}
          </h3>
        </div>
        <div className="flex flex-wrap gap-3 rounded-2xl bg-slate-100/80 p-1.5 dark:bg-slate-950/70">
          {availableContexts.map((context) => {
            const selected = context === selectedContext;
            return (
              <button
                key={context}
                type="button"
                onClick={() => onSelectedContextChange(context)}
                className={`min-h-11 rounded-xl border px-4 py-2.5 text-sm font-bold tracking-tight shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86efac] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
                  selected
                    ? "border-[#86efac] bg-[#86efac] text-slate-950 shadow-md shadow-emerald-900/15 dark:border-[#86efac] dark:bg-[#86efac] dark:text-slate-950"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                }`}
              >
                {t(`analysis.contexts.${context}`)}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {rows.map((row) => (
          <div key={row.basicId} className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex min-w-[2.5rem] items-center justify-center rounded-full px-2 py-1 text-xs font-bold ring-1 ring-black/10"
                  style={{
                    backgroundColor: colorWithAlpha(row.accentHex, 0.18),
                    color: row.accentHex,
                  }}
                >
                  {row.label}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>{formatPercent(row.winRate)}</span>
                <span>
                  {t("analysis.overview.averageFinish", {
                    value: row.meanPlacement.toFixed(2),
                  })}
                </span>
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-300/70 dark:bg-slate-950/80 dark:ring-slate-700/80">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{
                  width: `${row.winRate}%`,
                  backgroundColor: row.accentHex,
                  boxShadow: `0 0 22px ${colorWithAlpha(row.accentHex, 0.38)}`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StabilitySpotlight({ rows }: { rows: PlacementRowDatum[] }) {
  const { t } = useTranslation();
  const highestStability = pickHighestStability(rows);
  const swingiest = pickSwingiest(rows);
  return (
    <section className="grid gap-4">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 text-slate-900 shadow-md shadow-slate-900/10 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:text-slate-50">
        <p className="text-base font-bold tracking-tight text-slate-700 dark:text-slate-100">
          {t("analysis.overview.stabilityLensEyebrow")}
        </p>
        <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t("analysis.overview.stabilityLensTitle")}
        </h3>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          {t("analysis.overview.stabilityLensDescription")}
        </p>
      </div>
      {[highestStability, swingiest].map((row, index) => {
        if (!row) {
          return null;
        }
        const isStableCard = index === 0;
        return (
          <div
            key={`${row.basicId}-${index}`}
            className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  {isStableCard
                    ? t("analysis.overview.mostStable")
                    : t("analysis.overview.mostVolatile")}
                </p>
                <h4 className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {row.label}
                </h4>
              </div>
              <span
                className="rounded-full px-3 py-1 text-sm font-bold ring-1 ring-black/10"
                style={{
                  backgroundColor: colorWithAlpha(row.accentHex, 0.18),
                  color: row.accentHex,
                }}
              >
                {Math.round(row.stabilityScore)}
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/70">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
                  {t("analysis.overview.averageFinishShort")}
                </p>
                <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {row.meanPlacement.toFixed(2)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/70">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
                  {t("analysis.overview.standardDeviation")}
                </p>
                <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {row.standardDeviation.toFixed(2)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/70">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
                  {t("analysis.overview.boomOrBust")}
                </p>
                <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {formatPercent(row.boomBustRate)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function DistributionRow({ row }: { row: PlacementRowDatum }) {
  const { t } = useTranslation();
  const gradient = stackedBarGradient(row);
  const placementGridStyle = {
    gridTemplateColumns: `repeat(${Math.max(row.rates.length, 1)}, minmax(0, 1fr))`,
  };
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-950/50 dark:shadow-slate-950/30">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 w-full">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold shadow-sm shadow-slate-900/10 ring-1 ring-black/10 dark:shadow-slate-950/20"
              style={{
                backgroundColor: colorWithAlpha(row.accentHex, 0.18),
                color: row.accentHex,
              }}
            >
              {row.label}
            </span>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {t("analysis.overview.averageFinish", {
                value: row.meanPlacement.toFixed(2),
              })}
            </span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {t("analysis.overview.stabilityScore", {
                value: Math.round(row.stabilityScore),
              })}
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm shadow-slate-900/10 ring-1 ring-slate-200 dark:bg-slate-900 dark:shadow-slate-950/25 dark:ring-slate-700">
            <div
              className="grid border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700 dark:text-slate-400"
              style={placementGridStyle}
            >
              {row.rates.map((_, placementIndex) => (
                <div
                  key={`${row.basicId}-header-${placementIndex}`}
                  className="px-2 py-2 text-center"
                >
                  {t(`common.placements.${placementIndex}`)}
                </div>
              ))}
            </div>
            <div
              className="h-12 rounded-b-2xl shadow-inner shadow-slate-900/10 dark:shadow-slate-950/20"
              style={{ background: gradient }}
            />
            <div
              className="grid text-xs font-semibold text-slate-600 dark:text-slate-300"
              style={placementGridStyle}
            >
              {row.rates.map((rate, placementIndex) => (
                <div
                  key={`${row.basicId}-rate-${placementIndex}`}
                  className="px-2 py-3 text-center"
                >
                  {formatPercent(rate)}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid shrink-0 gap-3 sm:grid-cols-3 xl:w-[21rem] xl:grid-cols-1">
          <div className="rounded-2xl bg-white px-4 py-3 shadow-md shadow-slate-900/8 ring-1 ring-slate-200 dark:bg-slate-900 dark:shadow-slate-950/25 dark:ring-slate-700">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
              {t("analysis.overview.winRate")}
            </p>
            <p className="mt-2 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {formatPercent(row.winRate)}
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 shadow-md shadow-slate-900/8 ring-1 ring-slate-200 dark:bg-slate-900 dark:shadow-slate-950/25 dark:ring-slate-700">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
              {t("analysis.overview.podiumRate")}
            </p>
            <p className="mt-2 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {formatPercent(row.podiumRate)}
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 shadow-md shadow-slate-900/8 ring-1 ring-slate-200 dark:bg-slate-900 dark:shadow-slate-950/25 dark:ring-slate-700">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
              {t("analysis.overview.bottomTwoRate")}
            </p>
            <p className="mt-2 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {formatPercent(row.bottomTwoRate)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function PlacementDistributionPanel({ rows }: { rows: PlacementRowDatum[] }) {
  const { t } = useTranslation();
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-slate-950/60">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {t("analysis.overview.distributionEyebrow")}
          </p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {t("analysis.overview.distributionTitle")}
          </h3>
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {t("analysis.overview.distributionHint")}
        </span>
      </div>
      <div className="mt-6 space-y-4">
        {rows.map((row) => (
          <DistributionRow key={row.basicId} row={row} />
        ))}
      </div>
    </section>
  );
}

export function OverviewPanel({ snapshot }: OverviewPanelProps) {
  const { getCharacterName } = useTranslation();
  const getSafeDangoColors = useSafeDangoColors();
  const initialContext: MonteCarloRaceContext =
    snapshot.scenarioKind === "normalRace" ? "sprint" : "final";
  const [selectedContext, setSelectedContext] =
    useState<MonteCarloRaceContext>(initialContext);
  const availableContexts = useMemo(
    () =>
      RACE_CONTEXT_OPTIONS.filter(
        (context) => (snapshot.raceCountByContext[context] ?? 0) > 0
      ),
    [snapshot.raceCountByContext]
  );
  useEffect(() => {
    if (availableContexts.includes(selectedContext)) {
      return;
    }
    setSelectedContext(availableContexts[0] ?? initialContext);
  }, [availableContexts, initialContext, selectedContext]);
  const resolveRowColors = useMemo(
    () => (basicId: DangoId) => {
      const { chartHex, chartInkHex } = getSafeDangoColors(basicId);
      return {
        accentHex: chartHex,
        accentInkHex: chartInkHex,
      };
    },
    [getSafeDangoColors]
  );
  const rows = useMemo(
    () =>
      sortRows(
        derivePlacementRows(
          snapshot.selectedBasicIds,
          snapshot.basicAnalyticsByContext[selectedContext]
            ?.placementCountsByBasicId ?? snapshot.finalPlacementCountsByBasicId,
          getCharacterName,
          resolveRowColors
        )
      ),
    [
      getCharacterName,
      resolveRowColors,
      selectedContext,
      snapshot.basicAnalyticsByContext,
      snapshot.finalPlacementCountsByBasicId,
      snapshot.selectedBasicIds,
    ]
  );

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <WinRateOverview
          rows={rows}
          scenarioKind={snapshot.scenarioKind}
          selectedContext={selectedContext}
          availableContexts={availableContexts}
          onSelectedContextChange={setSelectedContext}
        />
        <StabilitySpotlight rows={rows} />
      </div>
      <PlacementDistributionPanel rows={rows} />
      <MetaInsightsPanel snapshot={snapshot} selectedContext={selectedContext} />
    </div>
  );
}
