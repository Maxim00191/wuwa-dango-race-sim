import { useMemo } from "react";
import type { MonteCarloAggregateSnapshot } from "@/types/monteCarlo";
import {
  colorWithAlpha,
  derivePlacementRows,
  formatPercent,
  getPlacementLabel,
  type PlacementRowDatum,
} from "@/components/analysis/analytics";

type OverviewPanelProps = {
  snapshot: MonteCarloAggregateSnapshot;
};

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
}: {
  rows: PlacementRowDatum[];
  scenarioKind: MonteCarloAggregateSnapshot["scenarioKind"];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-slate-950/60">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Win rate overview
          </p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {scenarioKind === "tournament"
              ? "Who lifts the trophy most often"
              : "Who closes the race most often"}
          </h3>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-300">
          Final placements only
        </span>
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
                <span>Avg finish {row.meanPlacement.toFixed(2)}</span>
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
  const highestStability = pickHighestStability(rows);
  const swingiest = pickSwingiest(rows);
  return (
    <section className="grid gap-4">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-slate-50 shadow-md shadow-slate-900/20 dark:border-slate-700 dark:from-slate-900 dark:to-slate-950">
        <p className="text-base font-bold tracking-tight text-slate-100">
          Stability lens
        </p>
        <h3 className="mt-1 text-2xl font-bold tracking-tight text-white">
          How repeatable each dango feels
        </h3>
        <p className="mt-3 text-sm text-slate-300">
          Higher stability means a tighter spread of finishes. Lower stability means
          wider swings between great and poor results.
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
                  {isStableCard ? "Most stable" : "Most volatile"}
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
                  Avg finish
                </p>
                <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {row.meanPlacement.toFixed(2)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/70">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
                  Std dev
                </p>
                <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {row.standardDeviation.toFixed(2)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/70">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
                  Boom or bust
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
  const gradient = stackedBarGradient(row);
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5 dark:border-slate-800 dark:bg-slate-950/50">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ring-1 ring-black/10"
              style={{
                backgroundColor: colorWithAlpha(row.accentHex, 0.18),
                color: row.accentHex,
              }}
            >
              {row.label}
            </span>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Avg finish {row.meanPlacement.toFixed(2)}
            </span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Stability {Math.round(row.stabilityScore)}
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            <div className="grid grid-cols-6 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {row.rates.map((_, placementIndex) => (
                <div
                  key={`${row.basicId}-header-${placementIndex}`}
                  className="px-2 py-2 text-center"
                >
                  {getPlacementLabel(placementIndex)}
                </div>
              ))}
            </div>
            <div
              className="h-12 rounded-b-2xl"
              style={{ background: gradient }}
            />
            <div className="grid grid-cols-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
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
          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm shadow-slate-900/5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
              Win rate
            </p>
            <p className="mt-2 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {formatPercent(row.winRate)}
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm shadow-slate-900/5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
              Podium rate
            </p>
            <p className="mt-2 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {formatPercent(row.podiumRate)}
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm shadow-slate-900/5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
              Bottom-two rate
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
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-slate-950/60">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Rank distribution
          </p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Full 1st-through-6th finish profile
          </h3>
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Each bar reads left to right from first place to last place
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
  const rows = useMemo(
    () =>
      sortRows(
        derivePlacementRows(
          snapshot.selectedBasicIds,
          snapshot.finalPlacementCountsByBasicId
        )
      ),
    [snapshot.finalPlacementCountsByBasicId, snapshot.selectedBasicIds]
  );

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <WinRateOverview rows={rows} scenarioKind={snapshot.scenarioKind} />
        <StabilitySpotlight rows={rows} />
      </div>
      <PlacementDistributionPanel rows={rows} />
    </div>
  );
}
