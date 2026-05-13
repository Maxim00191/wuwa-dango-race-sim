import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n/useTranslation";
import { useSafeDangoColors } from "@/services/dangoColors";
import type { DangoId } from "@/types/game";
import type { MonteCarloAggregateSnapshot } from "@/types/monteCarlo";
import {
  colorWithAlpha,
  derivePlacementRows,
  formatPercent,
  sumCounts,
  sumMatrixRow,
} from "@/components/analysis/analytics";
import {
  accessibleTextHexForFill,
  blendHexColors,
  themeSurfaceHex,
} from "@/services/colorUtils";

type TournamentInsightsProps = {
  snapshot: MonteCarloAggregateSnapshot;
};

type TournamentConversionRow = {
  basicId: DangoId;
  label: string;
  accentHex: string;
  topSeedSample: number;
  topSeedTitleRate: number;
  underdogSample: number;
  underdogTitleRate: number;
  maxDebtSample: number;
  maxDebtTitleRate: number;
  totalChampionships: number;
};

type TournamentShiftRow = {
  basicId: DangoId;
  label: string;
  accentHex: string;
  preliminaryAverageRank: number;
  finalAverageRank: number;
  rankDelta: number;
  finalWinRate: number;
  chokeRate: number;
  clutchRate: number;
  chokeSample: number;
  clutchSample: number;
};

function createConversionRows(
  snapshot: MonteCarloAggregateSnapshot,
  getCharacterName: (basicId: DangoId) => string,
  resolveRowColors: (
    basicId: DangoId
  ) => {
    accentHex: string;
    accentInkHex: string;
  }
): TournamentConversionRow[] {
  const finalRows = derivePlacementRows(
    snapshot.selectedBasicIds,
    snapshot.basicAnalyticsByContext.final?.placementCountsByBasicId ??
      snapshot.finalPlacementCountsByBasicId,
    getCharacterName,
    resolveRowColors
  );
  const finalRowById = Object.fromEntries(
    finalRows.map((row) => [row.basicId, row])
  ) as Record<string, (typeof finalRows)[number]>;

  return snapshot.selectedBasicIds.map((basicId) => {
    const matrix = snapshot.preliminaryToFinalCountsByBasicId[basicId] ?? [];
    const topSeedSample = sumMatrixRow(matrix, 0);
    const topSeedTitleRate =
      topSeedSample > 0 ? ((matrix[0]?.[0] ?? 0) / topSeedSample) * 100 : 0;
    const underdogRows = matrix.slice(3);
    const underdogSample = underdogRows.reduce(
      (sum, row) => sum + sumCounts(row ?? []),
      0
    );
    const underdogWins = underdogRows.reduce(
      (sum, row) => sum + (row?.[0] ?? 0),
      0
    );
    const underdogTitleRate =
      underdogSample > 0 ? (underdogWins / underdogSample) * 100 : 0;
    const maxDebtSample = snapshot.startedFinalWithMaxDebtCountByBasicId[basicId] ?? 0;
    const maxDebtTitleRate =
      snapshot.modeAnalytics.kind === "tournament"
        ? snapshot.modeAnalytics.maxDebtComebackRateByBasicId[basicId] ?? 0
        : 0;
    return {
      basicId,
      label: getCharacterName(basicId),
      accentHex: finalRowById[basicId]?.accentHex ?? "#8b5cf6",
      topSeedSample,
      topSeedTitleRate,
      underdogSample,
      underdogTitleRate,
      maxDebtSample,
      maxDebtTitleRate,
      totalChampionships: snapshot.winsByBasicId[basicId] ?? 0,
    };
  });
}

function createShiftRows(
  snapshot: MonteCarloAggregateSnapshot,
  getCharacterName: (basicId: DangoId) => string,
  resolveRowColors: (
    basicId: DangoId
  ) => {
    accentHex: string;
    accentInkHex: string;
  }
): TournamentShiftRow[] {
  const preliminaryRows = derivePlacementRows(
    snapshot.selectedBasicIds,
    snapshot.basicAnalyticsByContext.preliminary?.placementCountsByBasicId ??
      snapshot.preliminaryPlacementCountsByBasicId,
    getCharacterName,
    resolveRowColors
  );
  const finalRows = derivePlacementRows(
    snapshot.selectedBasicIds,
    snapshot.basicAnalyticsByContext.final?.placementCountsByBasicId ??
      snapshot.finalPlacementCountsByBasicId,
    getCharacterName,
    resolveRowColors
  );
  const preliminaryRowById = Object.fromEntries(
    preliminaryRows.map((row) => [row.basicId, row])
  ) as Record<string, (typeof preliminaryRows)[number]>;
  const finalRowById = Object.fromEntries(
    finalRows.map((row) => [row.basicId, row])
  ) as Record<string, (typeof finalRows)[number]>;
  const shift =
    snapshot.modeAnalytics.kind === "tournament"
      ? snapshot.modeAnalytics.preliminaryToFinalRankShift
      : null;
  return snapshot.selectedBasicIds.map((basicId) => {
    const preliminaryRow = preliminaryRowById[basicId];
    const finalRow = finalRowById[basicId];
    return {
      basicId,
      label: getCharacterName(basicId),
      accentHex: finalRow?.accentHex ?? "#8b5cf6",
      preliminaryAverageRank: preliminaryRow?.meanPlacement ?? 0,
      finalAverageRank: finalRow?.meanPlacement ?? 0,
      rankDelta:
        shift?.averageFinalMinusPreliminaryRankByBasicId[basicId] ??
        ((finalRow?.meanPlacement ?? 0) - (preliminaryRow?.meanPlacement ?? 0)),
      finalWinRate: finalRow?.winRate ?? 0,
      chokeRate: shift?.chokeRateByBasicId[basicId] ?? 0,
      clutchRate: shift?.clutchRateByBasicId[basicId] ?? 0,
      chokeSample: shift?.chokeOpportunityCountByBasicId[basicId] ?? 0,
      clutchSample: shift?.clutchOpportunityCountByBasicId[basicId] ?? 0,
    };
  });
}

function pickBestByRate(
  rows: TournamentConversionRow[],
  getRate: (row: TournamentConversionRow) => number,
  getSample: (row: TournamentConversionRow) => number
): TournamentConversionRow | null {
  return rows.reduce<TournamentConversionRow | null>((best, row) => {
    if (getSample(row) === 0) {
      return best;
    }
    if (!best) {
      return row;
    }
    const rate = getRate(row);
    const bestRate = getRate(best);
    if (rate !== bestRate) {
      return rate > bestRate ? row : best;
    }
    return getSample(row) > getSample(best) ? row : best;
  }, null);
}

function HighlightCard({
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

function PreliminaryWinnerPlacementStrip({
  rates,
}: {
  rates: number[];
}) {
  const { t } = useTranslation();
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-slate-950/60">
      <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
        {t("analysis.tournament.preliminaryWinnerPlacementEyebrow")}
      </p>
      <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {t("analysis.tournament.preliminaryWinnerPlacementTitle")}
      </h3>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        {t("analysis.tournament.preliminaryWinnerPlacementDescription")}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
        {rates.map((rate, placementIndex) => (
          <div
            key={`preliminary-winner-placement-${placementIndex}`}
            className="min-h-0 rounded-xl bg-slate-50 px-2 py-2 ring-1 ring-slate-200 dark:bg-slate-950/60 dark:ring-slate-700"
          >
            <p className="truncate text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500 dark:text-slate-400">
              {t(`common.placements.${placementIndex}`)}
            </p>
            <p className="mt-1.5 truncate text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-xl">
              {formatPercent(rate)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalSeedDecayPanel({ snapshot }: { snapshot: MonteCarloAggregateSnapshot }) {
  const { getCharacterName, t } = useTranslation();
  const getSafeDangoColors = useSafeDangoColors();
  const dynamics =
    snapshot.modeAnalytics.kind === "normalRace"
      ? null
      : snapshot.modeAnalytics.finalStartingPlacementDynamics;
  const rates = useMemo(
    () => dynamics?.titleRatesByStartingPlacement ?? [],
    [dynamics?.titleRatesByStartingPlacement]
  );
  const maxRate = Math.max(...rates, 0);
  const seedEntries = useMemo(
    () =>
      rates.map((rate, seedIndex) => {
        const count =
          dynamics?.transitionMatrix[seedIndex]?.reduce(
            (sum, value) => sum + value,
            0
          ) ?? 0;
        const leaders = snapshot.selectedBasicIds
          .map((basicId) => {
            const row =
              snapshot.startingToFinalCountsByBasicId[basicId]?.[seedIndex] ?? [];
            const sample = sumCounts(row);
            return {
              basicId,
              label: getCharacterName(basicId),
              accentHex: getSafeDangoColors(basicId).chartHex,
              sample,
              titleRate: sample > 0 ? ((row[0] ?? 0) / sample) * 100 : 0,
            };
          })
          .filter((row) => row.sample > 0)
          .sort((left, right) => {
            if (right.titleRate !== left.titleRate) {
              return right.titleRate - left.titleRate;
            }
            return right.sample - left.sample;
          });
        return {
          seedIndex,
          rate,
          count,
          leaders,
          leader: leaders[0] ?? null,
        };
      }),
    [
      dynamics?.transitionMatrix,
      getCharacterName,
      getSafeDangoColors,
      rates,
      snapshot.selectedBasicIds,
      snapshot.startingToFinalCountsByBasicId,
    ]
  );
  const bestSeedEntry = useMemo(
    () =>
      seedEntries.reduce<(typeof seedEntries)[number] | null>((best, entry) => {
        if (!best) {
          return entry;
        }
        if (entry.rate !== best.rate) {
          return entry.rate > best.rate ? entry : best;
        }
        return entry.count > best.count ? entry : best;
      }, null),
    [seedEntries]
  );
  const worstSeedEntry = useMemo(
    () =>
      seedEntries.reduce<(typeof seedEntries)[number] | null>((worst, entry) => {
        if (!worst) {
          return entry;
        }
        if (entry.rate !== worst.rate) {
          return entry.rate < worst.rate ? entry : worst;
        }
        return entry.count < worst.count ? entry : worst;
      }, null),
    [seedEntries]
  );
  const [selectedSeedIndex, setSelectedSeedIndex] = useState<number>(() => {
    const bestIndex = rates.findIndex((rate) => rate === maxRate);
    return bestIndex >= 0 ? bestIndex : 0;
  });

  useEffect(() => {
    if (seedEntries.length === 0) {
      if (selectedSeedIndex !== 0) {
        setSelectedSeedIndex(0);
      }
      return;
    }
    if (seedEntries[selectedSeedIndex]) {
      return;
    }
    setSelectedSeedIndex(bestSeedEntry?.seedIndex ?? 0);
  }, [bestSeedEntry?.seedIndex, seedEntries, selectedSeedIndex]);

  const activeSeedEntry =
    seedEntries[selectedSeedIndex] ?? bestSeedEntry ?? seedEntries[0] ?? null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-slate-950/60">
      <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
        {t("analysis.tournament.seedDecayEyebrow")}
      </p>
      <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {t("analysis.tournament.seedDecayTitle")}
      </h3>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        {t("analysis.tournament.seedDecayDescription")}
      </p>
      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6 xl:grid-cols-1">
          {seedEntries.map((entry) => {
            const selected = entry.seedIndex === activeSeedEntry?.seedIndex;
            const isBest = entry.seedIndex === bestSeedEntry?.seedIndex;
            const isWorst = entry.seedIndex === worstSeedEntry?.seedIndex;
            return (
              <button
                key={`final-seed-${entry.seedIndex}`}
                type="button"
                onClick={() => setSelectedSeedIndex(entry.seedIndex)}
                className={`rounded-2xl border p-2.5 text-left transition sm:rounded-3xl sm:p-3 ${
                  selected
                    ? "border-violet-400 bg-violet-50 shadow-md shadow-violet-900/10 dark:border-violet-500 dark:bg-violet-950/35"
                    : isBest
                      ? "border-emerald-200 bg-emerald-50/70 hover:border-emerald-300 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                      : isWorst
                        ? "border-rose-200 bg-rose-50/70 hover:border-rose-300 dark:border-rose-900/60 dark:bg-rose-950/20"
                        : "border-slate-200 bg-slate-50/80 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                      {t("analysis.tournament.seedLabel", {
                        value: entry.seedIndex + 1,
                      })}
                    </p>
                    <p className="mt-1.5 truncate text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-xl">
                      {formatPercent(entry.rate)}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                    {t("analysis.conditional.runs", {
                      count: entry.count.toLocaleString(),
                    })}
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/90 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                  <div
                    className={`h-full rounded-full ${
                      selected
                        ? "bg-violet-500"
                        : isBest
                          ? "bg-emerald-500"
                          : isWorst
                            ? "bg-rose-500"
                            : "bg-slate-400 dark:bg-slate-500"
                    }`}
                    style={{ width: `${entry.rate}%` }}
                  />
                </div>
                {entry.leader ? (
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: entry.leader.accentHex }}
                    />
                    <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {entry.leader.label}
                    </span>
                    <span
                      className="ml-auto shrink-0 text-sm font-bold"
                      style={{ color: entry.leader.accentHex }}
                    >
                      {formatPercent(entry.leader.titleRate)}
                    </span>
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>

        {activeSeedEntry ? (
          <div className="rounded-[2rem] border border-violet-200/80 bg-white/95 p-5 shadow-lg shadow-violet-900/10 dark:border-violet-900/70 dark:bg-slate-900/85 dark:shadow-slate-950/50">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
                  {t("analysis.tournament.seedDecayEyebrow")}
                </p>
                <h4 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {t("analysis.tournament.seedLabel", {
                    value: activeSeedEntry.seedIndex + 1,
                  })}
                </h4>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  {t("analysis.tournament.seedDecayDescription")}
                </p>
              </div>
              <div className="min-w-[11rem] rounded-3xl border border-white/80 bg-white/85 px-4 py-4 shadow-md shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900/85">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                  {t("analysis.overview.winRate")}
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {formatPercent(activeSeedEntry.rate)}
                </p>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                  {t("analysis.conditional.runs", {
                    count: activeSeedEntry.count.toLocaleString(),
                  })}
                </p>
              </div>
            </div>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/90 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
              <div
                className="h-full rounded-full bg-violet-500"
                style={{ width: `${activeSeedEntry.rate}%` }}
              />
            </div>

            <div className="mt-6 space-y-3">
              {activeSeedEntry.leaders.map((row, index) => {
                return (
                  <div
                    key={`final-seed-${activeSeedEntry.seedIndex}-${row.basicId}`}
                    className="rounded-3xl border border-white/80 bg-white/85 p-4 shadow-md shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900/80"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: row.accentHex }}
                            />
                            <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {row.label}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                            {t("analysis.conditional.runs", {
                              count: row.sample.toLocaleString(),
                            })}
                          </p>
                        </div>
                      </div>
                      <span
                        className="shrink-0 text-lg font-bold"
                        style={{ color: row.accentHex }}
                      >
                        {formatPercent(row.titleRate)}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${row.titleRate}%`,
                          backgroundColor: row.accentHex,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function VolatilityTable({ rows }: { rows: TournamentShiftRow[] }) {
  const { t } = useTranslation();
  const orderedRows = [...rows].sort((left, right) => {
    if (right.chokeRate !== left.chokeRate) {
      return right.chokeRate - left.chokeRate;
    }
    return right.clutchRate - left.clutchRate;
  });
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-slate-950/60">
      <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
        {t("analysis.tournament.volatilityEyebrow")}
      </p>
      <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {t("analysis.tournament.volatilityTitle")}
      </h3>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
              <th className="border-b border-slate-200 px-3 py-3 dark:border-slate-700">
                {t("analysis.conditional.tableDango")}
              </th>
              <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-700">
                {t("analysis.tournament.rankShift")}
              </th>
              <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-700">
                {t("analysis.tournament.chokeRate")}
              </th>
              <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-700">
                {t("analysis.tournament.clutchRate")}
              </th>
            </tr>
          </thead>
          <tbody>
            {orderedRows.map((row) => (
              <tr key={`volatility-${row.basicId}`} className="text-sm">
                <td className="border-b border-slate-200 px-3 py-3 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-3 w-3 rounded-full"
                      style={{ backgroundColor: row.accentHex }}
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {row.label}
                    </span>
                  </div>
                </td>
                <td className="border-b border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                  {row.rankDelta >= 0 ? "+" : ""}
                  {row.rankDelta.toFixed(2)}
                </td>
                <td className="border-b border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                  {formatPercent(row.chokeRate)}
                  <span className="ml-2 text-xs font-normal text-slate-600 dark:text-slate-400">
                    {row.chokeSample.toLocaleString()}
                  </span>
                </td>
                <td className="border-b border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                  {formatPercent(row.clutchRate)}
                  <span className="ml-2 text-xs font-normal text-slate-600 dark:text-slate-400">
                    {row.clutchSample.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DeprivationDeltaTable({ rows }: { rows: TournamentShiftRow[] }) {
  const { t } = useTranslation();
  const orderedRows = [...rows].sort((left, right) => right.rankDelta - left.rankDelta);
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-slate-950/60">
      <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
        {t("analysis.tournament.deprivationEyebrow")}
      </p>
      <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {t("analysis.tournament.deprivationTitle")}
      </h3>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
              <th className="border-b border-slate-200 px-3 py-3 dark:border-slate-700">
                {t("analysis.conditional.tableDango")}
              </th>
              <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-700">
                {t("analysis.contexts.preliminary")}
              </th>
              <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-700">
                {t("analysis.contexts.final")}
              </th>
              <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-700">
                {t("analysis.tournament.rankShift")}
              </th>
              <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-700">
                {t("analysis.overview.winRate")}
              </th>
            </tr>
          </thead>
          <tbody>
            {orderedRows.map((row) => (
              <tr key={`deprivation-${row.basicId}`} className="text-sm">
                <td className="border-b border-slate-200 px-3 py-3 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-3 w-3 rounded-full"
                      style={{ backgroundColor: row.accentHex }}
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {row.label}
                    </span>
                  </div>
                </td>
                <td className="border-b border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                  {row.preliminaryAverageRank.toFixed(2)}
                </td>
                <td className="border-b border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                  {row.finalAverageRank.toFixed(2)}
                </td>
                <td className="border-b border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                  {row.rankDelta >= 0 ? "+" : ""}
                  {row.rankDelta.toFixed(2)}
                </td>
                <td className="border-b border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                  {formatPercent(row.finalWinRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ConversionTable({
  rows,
  focusedBasicId,
  onFocusedBasicIdChange,
}: {
  rows: TournamentConversionRow[];
  focusedBasicId: DangoId;
  onFocusedBasicIdChange: (basicId: DangoId) => void;
}) {
  const { t } = useTranslation();
  const orderedRows = [...rows].sort((left, right) => {
    if (right.totalChampionships !== left.totalChampionships) {
      return right.totalChampionships - left.totalChampionships;
    }
    return right.topSeedTitleRate - left.topSeedTitleRate;
  });

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-slate-950/60">
      <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
        {t("analysis.tournament.conversionEyebrow")}
      </p>
      <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {t("analysis.tournament.conversionTitle")}
      </h3>
      <div className="mt-5 space-y-3">
        {orderedRows.map((row) => {
          const focused = row.basicId === focusedBasicId;
          return (
            <button
              key={row.basicId}
              type="button"
              onClick={() => onFocusedBasicIdChange(row.basicId)}
              className={`w-full rounded-3xl border p-4 text-left transition ${
                focused
                  ? "border-violet-400 bg-violet-50 shadow-md shadow-violet-900/10 dark:border-violet-500 dark:bg-violet-950/35"
                  : "border-slate-200 bg-slate-50/80 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/50"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex h-3 w-3 rounded-full"
                    style={{ backgroundColor: row.accentHex }}
                  />
                  <p className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    {row.label}
                  </p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                  {t("analysis.tournament.titles", {
                    count: row.totalChampionships.toLocaleString(),
                  })}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="min-h-0 rounded-xl bg-white px-2 py-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                  <p className="line-clamp-2 text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500 dark:text-slate-400">
                    {t("analysis.tournament.ifFirstInPrelims")}
                  </p>
                  <p className="mt-1.5 truncate text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-xl">
                    {formatPercent(row.topSeedTitleRate)}
                  </p>
                  <p className="mt-1 truncate text-xs leading-tight text-slate-500 dark:text-slate-400">
                    {t("analysis.tournament.matchingPrelimRuns", {
                      count: row.topSeedSample.toLocaleString(),
                    })}
                  </p>
                </div>
                <div className="min-h-0 rounded-xl bg-white px-2 py-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                  <p className="line-clamp-2 text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500 dark:text-slate-400">
                    {t("analysis.tournament.ifFourthToSixthInPrelims")}
                  </p>
                  <p className="mt-1.5 truncate text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-xl">
                    {formatPercent(row.underdogTitleRate)}
                  </p>
                  <p className="mt-1 truncate text-xs leading-tight text-slate-500 dark:text-slate-400">
                    {t("analysis.tournament.underdogEntries", {
                      count: row.underdogSample.toLocaleString(),
                    })}
                  </p>
                </div>
                <div className="min-h-0 rounded-xl bg-white px-2 py-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                  <p className="line-clamp-2 text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500 dark:text-slate-400">
                    {t("analysis.tournament.ifStartAtMaxDebt")}
                  </p>
                  <p className="mt-1.5 truncate text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-xl">
                    {formatPercent(row.maxDebtTitleRate)}
                  </p>
                  <p className="mt-1 truncate text-xs leading-tight text-slate-500 dark:text-slate-400">
                    {t("analysis.tournament.maxDebtEntries", {
                      count: row.maxDebtSample.toLocaleString(),
                    })}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TransitionHeatmap({
  snapshot,
  focusedBasicId,
}: {
  snapshot: MonteCarloAggregateSnapshot;
  focusedBasicId: DangoId;
}) {
  const { getCharacterName, t } = useTranslation();
  const { mode } = useTheme();
  const getSafeDangoColors = useSafeDangoColors();
  const matrix = snapshot.preliminaryToFinalCountsByBasicId[focusedBasicId] ?? [];
  const totalFocusTitles = snapshot.winsByBasicId[focusedBasicId] ?? 0;
  const heatmapSurfaceHex = themeSurfaceHex(mode, "panel");
  const accentHex = getSafeDangoColors(focusedBasicId).chartHex;
  const heatmapGridStyle = {
    gridTemplateColumns: `minmax(8rem,0.9fr) repeat(${snapshot.participantCount}, minmax(4.5rem,1fr))`,
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-slate-950/60">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {t("analysis.tournament.transitionEyebrow")}
          </p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {getCharacterName(focusedBasicId)}
          </h3>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-300">
          {t("analysis.tournament.totalTitles", {
            count: totalFocusTitles.toLocaleString(),
          })}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        {t("analysis.tournament.transitionDescription")}
      </p>
      <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-950/70">
        <div className="min-w-[36rem]">
          <div
            className="grid border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
            style={heatmapGridStyle}
          >
            <div className="px-4 py-3">{t("analysis.tournament.prelimHeader")}</div>
            {Array.from({ length: snapshot.participantCount }, (_, placementIndex) => (
              <div key={`final-header-${placementIndex}`} className="px-2 py-3 text-center">
                {t(`common.placements.${placementIndex}`)}
              </div>
            ))}
          </div>
          {Array.from({ length: snapshot.participantCount }, (_, rowIndex) => {
            const row = matrix[rowIndex] ?? [];
            const rowTotal = sumCounts(row);
            return (
              <div
                key={`transition-row-${rowIndex}`}
                className="grid border-b border-slate-200 last:border-b-0 dark:border-slate-800"
                style={heatmapGridStyle}
              >
                <div className="flex items-center px-4 py-3 text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  {t(`common.placements.${rowIndex}`)}
                </div>
                {Array.from(
                  { length: snapshot.participantCount },
                  (_, columnIndex) => {
                    const count = row[columnIndex] ?? 0;
                    const rate = rowTotal > 0 ? (count / rowTotal) * 100 : 0;
                    const alpha = 0.08 + (rate / 100) * 0.76;
                    const cellHex = blendHexColors(accentHex, heatmapSurfaceHex, alpha);
                    const textColor = accessibleTextHexForFill(cellHex);
                    return (
                      <div
                        key={`transition-cell-${rowIndex}-${columnIndex}`}
                        className="flex min-h-[4.5rem] items-center justify-center border-l border-slate-200 px-2 py-3 text-center dark:border-slate-800"
                        style={{
                          backgroundColor: colorWithAlpha(accentHex, alpha),
                          color: textColor,
                        }}
                      >
                        <div>
                          <p className="text-sm font-bold tracking-tight sm:text-base">
                            {formatPercent(rate)}
                          </p>
                          <p className="text-[11px] font-semibold tracking-[0.16em] opacity-80">
                            {t("analysis.conditional.runs", {
                              count: count.toLocaleString(),
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function TournamentInsights({ snapshot }: TournamentInsightsProps) {
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
  const conversionRows = useMemo(
    () => createConversionRows(snapshot, getCharacterName, resolveRowColors),
    [getCharacterName, resolveRowColors, snapshot]
  );
  const shiftRows = useMemo(
    () => createShiftRows(snapshot, getCharacterName, resolveRowColors),
    [getCharacterName, resolveRowColors, snapshot]
  );
  const bestLeader = useMemo(
    () =>
      pickBestByRate(
        conversionRows,
        (row) => row.topSeedTitleRate,
        (row) => row.topSeedSample
      ),
    [conversionRows]
  );
  const bestComeback = useMemo(
    () =>
      pickBestByRate(
        conversionRows,
        (row) => row.underdogTitleRate,
        (row) => row.underdogSample
      ),
    [conversionRows]
  );
  const bestDebtSurvivor = useMemo(
    () =>
      pickBestByRate(
        conversionRows,
        (row) => row.maxDebtTitleRate,
        (row) => row.maxDebtSample
      ),
    [conversionRows]
  );
  const overallTopSeedClosures = useMemo(
    () =>
      conversionRows.reduce((sum, row) => {
        const matrix = snapshot.preliminaryToFinalCountsByBasicId[row.basicId] ?? [];
        return sum + (matrix[0]?.[0] ?? 0);
      }, 0),
    [conversionRows, snapshot.preliminaryToFinalCountsByBasicId]
  );
  const overallUnderdogTitles = useMemo(
    () =>
      conversionRows.reduce((sum, row) => {
        const matrix = snapshot.preliminaryToFinalCountsByBasicId[row.basicId] ?? [];
        return (
          sum +
          matrix.slice(3).reduce(
            (rowSum, transitionRow) => rowSum + (transitionRow?.[0] ?? 0),
            0
          )
        );
      }, 0),
    [conversionRows, snapshot.preliminaryToFinalCountsByBasicId]
  );
  const overallMaxDebtComebackRate =
    snapshot.modeAnalytics.kind === "tournament"
      ? snapshot.modeAnalytics.maxDebtComebackRate
      : 0;
  const preliminaryWinnerFinalPlacementRates =
    snapshot.modeAnalytics.kind === "tournament"
      ? snapshot.modeAnalytics.preliminaryWinnerFinalPlacementRates
      : [];
  const rankShift =
    snapshot.modeAnalytics.kind === "tournament"
      ? snapshot.modeAnalytics.preliminaryToFinalRankShift
      : null;
  const [focusedBasicId, setFocusedBasicId] = useState<DangoId>(
    snapshot.selectedBasicIds[0] ?? ""
  );

  useEffect(() => {
    if (snapshot.selectedBasicIds.includes(focusedBasicId)) {
      return;
    }
    setFocusedBasicId(
      bestDebtSurvivor?.basicId ??
        bestComeback?.basicId ??
        snapshot.selectedBasicIds[0] ??
        ""
    );
  }, [
    bestComeback?.basicId,
    bestDebtSurvivor?.basicId,
    focusedBasicId,
    snapshot.selectedBasicIds,
  ]);

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-slate-950/60">
        <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
          {t("analysis.tournament.eyebrow")}
        </p>
        <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {t("analysis.tournament.title")}
        </h3>
        <p className="mt-3 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          {t("analysis.tournament.description")}
        </p>
        <div className="mt-6 grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-5">
          <HighlightCard
            label={t("analysis.tournament.topSeedConverts")}
            value={formatPercent(
              snapshot.totalRuns > 0
                ? (overallTopSeedClosures / snapshot.totalRuns) * 100
                : 0
            )}
            hint={t("analysis.tournament.topSeedConvertsHint")}
          />
          <HighlightCard
            label={t("analysis.tournament.bottomHalfComeback")}
            value={formatPercent(
              snapshot.totalRuns > 0
                ? (overallUnderdogTitles / snapshot.totalRuns) * 100
                : 0
            )}
            hint={t("analysis.tournament.bottomHalfComebackHint")}
          />
          <HighlightCard
            label={t("analysis.tournament.maxDebtComeback")}
            value={formatPercent(overallMaxDebtComebackRate)}
            hint={t("analysis.tournament.maxDebtComebackHint")}
          />
          {rankShift ? (
            <>
              <HighlightCard
                label={t("analysis.tournament.overallChoke")}
                value={formatPercent(rankShift.overallChokeRate)}
                hint={t("analysis.tournament.overallChokeHint")}
              />
              <HighlightCard
                label={t("analysis.tournament.overallClutch")}
                value={formatPercent(rankShift.overallClutchRate)}
                hint={t("analysis.tournament.overallClutchHint")}
              />
              <HighlightCard
                label={t("analysis.tournament.averageShift")}
                value={
                  rankShift.overallAverageFinalMinusPreliminaryRank === null
                    ? "—"
                    : `${rankShift.overallAverageFinalMinusPreliminaryRank >= 0 ? "+" : ""}${rankShift.overallAverageFinalMinusPreliminaryRank.toFixed(2)}`
                }
                hint={t("analysis.tournament.averageShiftHint")}
              />
            </>
          ) : null}
          <HighlightCard
            label={t("analysis.tournament.bestFrontrunner")}
            value={bestLeader?.label ?? "—"}
            hint={
              bestLeader
                ? t("analysis.tournament.topSeedHint", {
                    rate: formatPercent(bestLeader.topSeedTitleRate),
                  })
                : t("analysis.tournament.noTopSeedData")
            }
          />
          <HighlightCard
            label={t("analysis.tournament.bestRecoveryArtist")}
            value={bestComeback?.label ?? "—"}
            hint={
              bestComeback
                ? t("analysis.tournament.underdogHint", {
                    rate: formatPercent(bestComeback.underdogTitleRate),
                  })
                : t("analysis.tournament.noUnderdogData")
            }
          />
          <HighlightCard
            label={t("analysis.tournament.bestDebtSurvivor")}
            value={bestDebtSurvivor?.label ?? "—"}
            hint={
              bestDebtSurvivor
                ? t("analysis.tournament.maxDebtHint", {
                    rate: formatPercent(bestDebtSurvivor.maxDebtTitleRate),
                  })
                : t("analysis.tournament.noMaxDebtData")
            }
          />
        </div>
      </section>
      <FinalSeedDecayPanel snapshot={snapshot} />
      {rankShift ? (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <VolatilityTable rows={shiftRows} />
            <DeprivationDeltaTable rows={shiftRows} />
          </div>
          <PreliminaryWinnerPlacementStrip rates={preliminaryWinnerFinalPlacementRates} />
        </>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <ConversionTable
          rows={conversionRows}
          focusedBasicId={focusedBasicId}
          onFocusedBasicIdChange={setFocusedBasicId}
        />
        <TransitionHeatmap
          snapshot={snapshot}
          focusedBasicId={focusedBasicId}
        />
      </div>
    </div>
  );
}
