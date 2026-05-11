import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/i18n/LanguageContext";
import type { DangoId } from "@/types/game";
import type { MonteCarloAggregateSnapshot } from "@/types/monteCarlo";
import {
  colorWithAlpha,
  derivePlacementRows,
  formatPercent,
  sumCounts,
  sumMatrixRow,
} from "@/components/analysis/analytics";

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
  totalChampionships: number;
};

function createConversionRows(
  snapshot: MonteCarloAggregateSnapshot,
  getCharacterName: (basicId: DangoId) => string
): TournamentConversionRow[] {
  const finalRows = derivePlacementRows(
    snapshot.selectedBasicIds,
    snapshot.finalPlacementCountsByBasicId,
    getCharacterName
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
    return {
      basicId,
      label: getCharacterName(basicId),
      accentHex: finalRowById[basicId]?.accentHex ?? "#8b5cf6",
      topSeedSample,
      topSeedTitleRate,
      underdogSample,
      underdogTitleRate,
      totalChampionships: snapshot.winsByBasicId[basicId] ?? 0,
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
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-200">
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
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
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {t("analysis.tournament.titles", {
                    count: row.totalChampionships.toLocaleString(),
                  })}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
                    {t("analysis.tournament.ifFirstInPrelims")}
                  </p>
                  <p className="mt-2 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    {formatPercent(row.topSeedTitleRate)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {t("analysis.tournament.matchingPrelimRuns", {
                      count: row.topSeedSample.toLocaleString(),
                    })}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500">
                    {t("analysis.tournament.ifFourthToSixthInPrelims")}
                  </p>
                  <p className="mt-2 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    {formatPercent(row.underdogTitleRate)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {t("analysis.tournament.underdogEntries", {
                      count: row.underdogSample.toLocaleString(),
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
  const matrix = snapshot.preliminaryToFinalCountsByBasicId[focusedBasicId] ?? [];
  const totalFocusTitles = snapshot.winsByBasicId[focusedBasicId] ?? 0;
  const accentHex =
    derivePlacementRows([focusedBasicId], {
      [focusedBasicId]: snapshot.finalPlacementCountsByBasicId[focusedBasicId] ?? [],
    }, getCharacterName)[0]?.accentHex ?? "#8b5cf6";

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
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        {t("analysis.tournament.transitionDescription")}
      </p>
      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-950/70">
        <div className="grid grid-cols-[minmax(8rem,0.9fr)_repeat(6,minmax(0,1fr))] border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
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
              className="grid grid-cols-[minmax(8rem,0.9fr)_repeat(6,minmax(0,1fr))] border-b border-slate-200 last:border-b-0 dark:border-slate-800"
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
                  const textColor = rate >= 42 ? "#f8fafc" : "#0f172a";
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
                        <p className="text-base font-bold tracking-tight">
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
    </section>
  );
}

export function TournamentInsights({ snapshot }: TournamentInsightsProps) {
  const { getCharacterName, language, t } = useTranslation();
  const conversionRows = useMemo(
    () => createConversionRows(snapshot, getCharacterName),
    [getCharacterName, language, snapshot]
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
  const [focusedBasicId, setFocusedBasicId] = useState<DangoId>(
    snapshot.selectedBasicIds[0] ?? ""
  );

  useEffect(() => {
    if (snapshot.selectedBasicIds.includes(focusedBasicId)) {
      return;
    }
    setFocusedBasicId(bestComeback?.basicId ?? snapshot.selectedBasicIds[0] ?? "");
  }, [bestComeback?.basicId, focusedBasicId, snapshot.selectedBasicIds]);

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-slate-950/60">
        <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
          {t("analysis.tournament.eyebrow")}
        </p>
        <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {t("analysis.tournament.title")}
        </h3>
        <p className="mt-3 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          {t("analysis.tournament.description")}
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
        </div>
      </section>
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
