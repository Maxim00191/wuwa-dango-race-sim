import { useMemo } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n/useTranslation";
import { useSafeDangoColors } from "@/services/dangoColors";
import type { DangoId } from "@/types/game";
import type { MonteCarloAggregateSnapshot } from "@/types/monteCarlo";
import {
  colorWithAlpha,
  derivePlacementRows,
  formatPercent,
  type PlacementRowDatum,
} from "@/components/analysis/analytics";
import {
  accessibleTextHexForFill,
  blendHexColors,
  themeSurfaceHex,
} from "@/services/colorUtils";

type ConditionalAnalysisPanelProps = {
  snapshot: MonteCarloAggregateSnapshot;
  selectedWinnerId: DangoId;
  onSelectedWinnerIdChange: (basicId: DangoId) => void;
};

function pickRunnerUp(rows: PlacementRowDatum[]): PlacementRowDatum | null {
  return rows.reduce<PlacementRowDatum | null>((best, row) => {
    const rate = row.rates[1] ?? 0;
    if (!best || rate > (best.rates[1] ?? 0)) {
      return row;
    }
    return best;
  }, null);
}

function pickMostLikelyLast(rows: PlacementRowDatum[]): PlacementRowDatum | null {
  return rows.reduce<PlacementRowDatum | null>((best, row) => {
    const rate = row.rates[row.rates.length - 1] ?? 0;
    const bestRate = best ? best.rates[best.rates.length - 1] ?? 0 : -1;
    if (!best || rate > bestRate) {
      return row;
    }
    return best;
  }, null);
}

function ConditionalHeatmap({
  sampleSize,
  rows,
  selectedWinnerId,
}: {
  sampleSize: number;
  rows: PlacementRowDatum[];
  selectedWinnerId: DangoId;
}) {
  const { t } = useTranslation();
  const { mode } = useTheme();
  const heatmapSurfaceHex = themeSurfaceHex(mode, "panel");
  const orderedRows = useMemo(() => {
    const winnerRow = rows.find((row) => row.basicId === selectedWinnerId);
    const otherRows = rows
      .filter((row) => row.basicId !== selectedWinnerId)
      .sort((left, right) => (right.rates[1] ?? 0) - (left.rates[1] ?? 0));
    return winnerRow ? [winnerRow, ...otherRows] : otherRows;
  }, [rows, selectedWinnerId]);

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-950/70">
      <div className="min-w-[44rem]">
        <div className="grid grid-cols-[minmax(10rem,1.2fr)_repeat(6,minmax(4.5rem,1fr))] border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
          <div className="px-4 py-3">{t("analysis.conditional.tableDango")}</div>
          {rows[0]?.rates.map((_, placementIndex) => (
            <div key={`conditional-header-${placementIndex}`} className="px-2 py-3 text-center">
              {t(`common.placements.${placementIndex}`)}
            </div>
          ))}
        </div>
        {orderedRows.map((row) => (
          <div
            key={`conditional-${row.basicId}`}
            className="grid grid-cols-[minmax(10rem,1.2fr)_repeat(6,minmax(4.5rem,1fr))] border-b border-slate-200 last:border-b-0 dark:border-slate-800"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <span
                className="inline-flex h-3 w-3 rounded-full"
                style={{ backgroundColor: row.accentHex }}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  {row.label}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {t("analysis.conditional.averageFinish", {
                    value: row.meanPlacement.toFixed(2),
                  })}
                </p>
              </div>
            </div>
            {row.rates.map((rate, placementIndex) => {
              const isWinnerCell = row.basicId === selectedWinnerId && placementIndex === 0;
              const alpha = isWinnerCell ? 0.92 : 0.08 + (rate / 100) * 0.72;
              const cellHex = blendHexColors(row.accentHex, heatmapSurfaceHex, alpha);
              const textColor = accessibleTextHexForFill(cellHex);
              return (
                <div
                  key={`${row.basicId}-${placementIndex}`}
                  className="flex min-h-[4.5rem] items-center justify-center border-l border-slate-200 px-2 py-3 text-center dark:border-slate-800"
                  style={{
                    backgroundColor: colorWithAlpha(row.accentHex, alpha),
                    color: textColor,
                  }}
                >
                  <div>
                    <p className="text-sm font-bold tracking-tight sm:text-base">
                      {formatPercent(rate)}
                    </p>
                    <p className="text-[11px] font-semibold tracking-[0.16em] opacity-80">
                      {sampleSize > 0
                        ? t("analysis.conditional.runs", {
                            count: row.counts[placementIndex] ?? 0,
                          })
                        : t("analysis.conditional.runs", { count: 0 })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConditionalSummary({
  sampleSize,
  totalRuns,
  rows,
  selectedWinnerId,
}: {
  sampleSize: number;
  totalRuns: number;
  rows: PlacementRowDatum[];
  selectedWinnerId: DangoId;
}) {
  const { t } = useTranslation();
  const otherRows = rows.filter((row) => row.basicId !== selectedWinnerId);
  const likelyRunnerUp = pickRunnerUp(otherRows);
  const mostLikelyLast = pickMostLikelyLast(otherRows);
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2 xl:grid-cols-1 xl:gap-3">
      <div className="min-h-0 rounded-2xl border border-slate-200 bg-slate-900 p-2.5 text-slate-50 shadow-md shadow-slate-900/20 dark:border-slate-700 sm:rounded-3xl sm:p-3">
        <p className="text-[10px] font-semibold uppercase leading-snug tracking-wide text-slate-300 line-clamp-2">
          {t("analysis.conditional.scenarioSlice")}
        </p>
        <h3 className="mt-1.5 truncate text-lg font-bold leading-tight tracking-tight text-white sm:text-xl">
          {t("analysis.conditional.matchingRuns", {
            count: sampleSize.toLocaleString(),
          })}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-tight text-slate-300">
          {t("analysis.conditional.matchingRunsHint", {
            rate: formatPercent(totalRuns > 0 ? (sampleSize / totalRuns) * 100 : 0),
          })}
        </p>
      </div>
      <div className="min-h-0 rounded-2xl border border-slate-200 bg-white/90 p-2.5 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60 sm:rounded-3xl sm:p-3">
        <p className="text-[10px] font-semibold uppercase leading-snug tracking-wide text-slate-500 dark:text-slate-400 line-clamp-2">
          {t("analysis.conditional.likelyRunnerUp")}
        </p>
        <p className="mt-1.5 truncate text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-xl">
          {likelyRunnerUp?.label ?? "—"}
        </p>
        <p className="mt-1 line-clamp-2 text-xs leading-tight text-slate-500 dark:text-slate-400">
          {(likelyRunnerUp?.rates[1] ?? 0) > 0
            ? t("analysis.conditional.secondPlaceChance", {
                rate: formatPercent(likelyRunnerUp?.rates[1] ?? 0),
              })
            : t("analysis.conditional.noMatchingRuns")}
        </p>
      </div>
      <div className="min-h-0 rounded-2xl border border-slate-200 bg-white/90 p-2.5 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60 sm:rounded-3xl sm:p-3">
        <p className="text-[10px] font-semibold uppercase leading-snug tracking-wide text-slate-500 dark:text-slate-400 line-clamp-2">
          {t("analysis.conditional.likelyLast")}
        </p>
        <p className="mt-1.5 truncate text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-xl">
          {mostLikelyLast?.label ?? "—"}
        </p>
        <p className="mt-1 line-clamp-2 text-xs leading-tight text-slate-500 dark:text-slate-400">
          {(mostLikelyLast?.rates[mostLikelyLast.rates.length - 1] ?? 0) > 0
            ? t("analysis.conditional.sixthPlaceChance", {
                rate: formatPercent(
                  mostLikelyLast?.rates[mostLikelyLast.rates.length - 1] ?? 0
                ),
              })
            : t("analysis.conditional.noMatchingRuns")}
        </p>
      </div>
    </div>
  );
}

export function ConditionalAnalysisPanel({
  snapshot,
  selectedWinnerId,
  onSelectedWinnerIdChange,
}: ConditionalAnalysisPanelProps) {
  const { getCharacterName, t } = useTranslation();
  const getSafeDangoColors = useSafeDangoColors();
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
  const conditionalSnapshot =
    snapshot.conditionalPlacementCountsByWinnerId[selectedWinnerId];
  const sampleSize = conditionalSnapshot?.sampleSize ?? 0;
  const rows = useMemo(
    () =>
      derivePlacementRows(
        snapshot.selectedBasicIds,
        conditionalSnapshot?.placementCountsByBasicId ??
          snapshot.finalPlacementCountsByBasicId,
        getCharacterName,
        resolveRowColors
      ),
    [
      conditionalSnapshot?.placementCountsByBasicId,
      getCharacterName,
      resolveRowColors,
      snapshot.finalPlacementCountsByBasicId,
      snapshot.selectedBasicIds,
    ]
  );

  return (
    <div className="grid gap-6">
      <section className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-4 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-slate-950/60 sm:rounded-3xl sm:p-6">
        <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
          {t("analysis.conditional.eyebrow")}
        </p>
        <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {t("analysis.conditional.title")}
        </h3>
        <p className="mt-3 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          {t("analysis.conditional.description")}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {snapshot.selectedBasicIds.map((basicId) => {
            const selected = basicId === selectedWinnerId;
            const winnerSampleSize =
              snapshot.conditionalPlacementCountsByWinnerId[basicId]?.sampleSize ?? 0;
            return (
              <button
                key={`winner-${basicId}`}
                type="button"
                onClick={() => onSelectedWinnerIdChange(basicId)}
                className={`inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  selected
                    ? "border-violet-400 bg-violet-50 text-violet-950 shadow-md shadow-violet-900/10 dark:border-violet-500 dark:bg-violet-950/40 dark:text-violet-100"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200"
                }`}
              >
                <span>{getCharacterName(basicId)}</span>
                <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">
                  {winnerSampleSize.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,26rem)] xl:items-start">
        <div className="min-w-0">
          <ConditionalHeatmap
            sampleSize={sampleSize}
            rows={rows}
            selectedWinnerId={selectedWinnerId}
          />
        </div>
        <ConditionalSummary
          sampleSize={sampleSize}
          totalRuns={snapshot.totalRuns}
          rows={rows}
          selectedWinnerId={selectedWinnerId}
        />
      </div>
    </div>
  );
}
