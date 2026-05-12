import { useMemo, type ReactNode } from "react";
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
} from "@/components/analysis/analytics";

type MetaInsightsPanelProps = {
  snapshot: MonteCarloAggregateSnapshot;
  selectedContext: MonteCarloRaceContext;
};

type MetaRow = {
  basicId: DangoId;
  label: string;
  accentHex: string;
  winRate: number;
  carriedProgressShare: number;
  averageCarriedProgressPerRideTurn: number;
  carriedLeadRate: number;
  carriedLeadTitleConversionRate: number;
  driverRate: number;
  passengerRate: number;
  crownRate: number;
  soloRate: number;
  propulsionRate: number;
  hindranceRate: number;
  hindranceResilienceRate: number;
  highHindranceTitleConversionRate: number;
  timeRiftRate: number;
};

function buildMetaRows(
  snapshot: MonteCarloAggregateSnapshot,
  selectedContext: MonteCarloRaceContext,
  getCharacterName: (basicId: DangoId) => string,
  resolveRowColors: (
    basicId: DangoId
  ) => {
    accentHex: string;
    accentInkHex: string;
  }
): MetaRow[] {
  const placementRows = derivePlacementRows(
    snapshot.selectedBasicIds,
    snapshot.basicAnalyticsByContext[selectedContext]?.placementCountsByBasicId ??
      snapshot.finalPlacementCountsByBasicId,
    getCharacterName,
    resolveRowColors
  );
  return placementRows.map((placementRow) => {
    const analytics =
      snapshot.basicAnalyticsByContext[selectedContext]?.basicAnalyticsByBasicId[
        placementRow.basicId
      ] ?? snapshot.basicAnalyticsByBasicId[placementRow.basicId];
    const progress = analytics?.progressTopography;
    const stack = analytics?.stackEcosystem;
    const trap = analytics?.trapAffinity;
    return {
      basicId: placementRow.basicId,
      label: placementRow.label,
      accentHex: placementRow.accentHex,
      winRate: placementRow.winRate,
      carriedProgressShare: progress?.carriedProgressShare ?? 0,
      averageCarriedProgressPerRideTurn:
        progress?.averageCarriedProgressPerRideTurn ?? 0,
      carriedLeadRate: progress?.carriedLeadRate ?? 0,
      carriedLeadTitleConversionRate:
        progress?.carriedLeadTitleConversionRate ?? 0,
      driverRate: stack?.roleRates.driver ?? 0,
      passengerRate: stack?.roleRates.passenger ?? 0,
      crownRate: stack?.roleRates.crown ?? 0,
      soloRate: stack?.roleRates.solo ?? 0,
      propulsionRate: trap?.triggerRates.propulsionDevice ?? 0,
      hindranceRate: trap?.triggerRates.hindranceDevice ?? 0,
      hindranceResilienceRate: trap?.hindranceResilienceRate ?? 0,
      highHindranceTitleConversionRate:
        trap?.highHindranceTitleConversionRate ?? 0,
      timeRiftRate: trap?.triggerRates.timeRift ?? 0,
    };
  });
}

function pickPassengerLeader(rows: MetaRow[]): MetaRow | null {
  return rows.reduce<MetaRow | null>((best, row) => {
    if (row.carriedLeadRate <= 0 && row.averageCarriedProgressPerRideTurn <= 0) {
      return best;
    }
    if (!best) {
      return row;
    }
    if (
      row.carriedLeadTitleConversionRate !== best.carriedLeadTitleConversionRate
    ) {
      return row.carriedLeadTitleConversionRate >
        best.carriedLeadTitleConversionRate
        ? row
        : best;
    }
    if (row.averageCarriedProgressPerRideTurn !== best.averageCarriedProgressPerRideTurn) {
      return row.averageCarriedProgressPerRideTurn >
        best.averageCarriedProgressPerRideTurn
        ? row
        : best;
    }
    return row.winRate > best.winRate ? row : best;
  }, null);
}

function pickDriverLeader(rows: MetaRow[]): MetaRow | null {
  return rows.reduce<MetaRow | null>((best, row) => {
    if (!best) {
      return row;
    }
    if (row.driverRate !== best.driverRate) {
      return row.driverRate > best.driverRate ? row : best;
    }
    return row.winRate > best.winRate ? row : best;
  }, null);
}

function pickResilienceLeader(rows: MetaRow[]): MetaRow | null {
  return rows.reduce<MetaRow | null>((best, row) => {
    if (row.hindranceRate <= 0) {
      return best;
    }
    if (!best) {
      return row;
    }
    if (row.hindranceResilienceRate !== best.hindranceResilienceRate) {
      return row.hindranceResilienceRate > best.hindranceResilienceRate
        ? row
        : best;
    }
    if (
      row.highHindranceTitleConversionRate !==
      best.highHindranceTitleConversionRate
    ) {
      return row.highHindranceTitleConversionRate >
        best.highHindranceTitleConversionRate
        ? row
        : best;
    }
    return row.hindranceRate > best.hindranceRate ? row : best;
  }, null);
}

function InsightCard({
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
      <p className="truncate text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-1.5 truncate text-sm font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50 sm:text-base">
        {value}
      </p>
      <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-slate-400 dark:text-slate-500">
        {hint}
      </p>
    </div>
  );
}

function TableShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-slate-950/60">
      <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {title}
      </h3>
      <div className="mt-5 overflow-x-auto">{children}</div>
    </section>
  );
}

function TableNameCell({ row }: { row: MetaRow }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="inline-flex h-3 w-3 rounded-full"
        style={{ backgroundColor: row.accentHex }}
      />
      <span
        className="rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-black/10"
        style={{
          backgroundColor: colorWithAlpha(row.accentHex, 0.16),
          color: row.accentHex,
        }}
      >
        {row.label}
      </span>
    </div>
  );
}

export function MetaInsightsPanel({
  snapshot,
  selectedContext,
}: MetaInsightsPanelProps) {
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
  const rows = useMemo(
    () =>
      buildMetaRows(
        snapshot,
        selectedContext,
        getCharacterName,
        resolveRowColors
      ),
    [getCharacterName, resolveRowColors, selectedContext, snapshot]
  );
  const passengerRows = useMemo(
    () =>
      [...rows].sort((left, right) => {
        if (
          right.carriedLeadTitleConversionRate !==
          left.carriedLeadTitleConversionRate
        ) {
          return (
            right.carriedLeadTitleConversionRate -
            left.carriedLeadTitleConversionRate
          );
        }
        if (
          right.averageCarriedProgressPerRideTurn !==
          left.averageCarriedProgressPerRideTurn
        ) {
          return (
            right.averageCarriedProgressPerRideTurn -
            left.averageCarriedProgressPerRideTurn
          );
        }
        return right.winRate - left.winRate;
      }),
    [rows]
  );
  const stackRows = useMemo(
    () =>
      [...rows].sort((left, right) => {
        if (right.passengerRate !== left.passengerRate) {
          return right.passengerRate - left.passengerRate;
        }
        return right.driverRate - left.driverRate;
      }),
    [rows]
  );
  const trapRows = useMemo(
    () =>
      [...rows].sort((left, right) => {
        if (right.hindranceResilienceRate !== left.hindranceResilienceRate) {
          return right.hindranceResilienceRate - left.hindranceResilienceRate;
        }
        if (
          right.highHindranceTitleConversionRate !==
          left.highHindranceTitleConversionRate
        ) {
          return (
            right.highHindranceTitleConversionRate -
            left.highHindranceTitleConversionRate
          );
        }
        return right.hindranceRate - left.hindranceRate;
      }),
    [rows]
  );
  const passengerLeader = useMemo(() => pickPassengerLeader(rows), [rows]);
  const driverLeader = useMemo(() => pickDriverLeader(rows), [rows]);
  const resilienceLeader = useMemo(() => pickResilienceLeader(rows), [rows]);

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:shadow-slate-950/40">
        <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
          {t("analysis.overview.metaEyebrow")}
        </p>
        <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {t("analysis.overview.metaTitle")}
        </h3>
        <p className="mt-3 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          {t("analysis.overview.metaDescription")}
        </p>
        <div className="mt-6 grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-6">
          <InsightCard
            label={t("analysis.overview.passengerLeader")}
            value={passengerLeader?.label ?? "—"}
            hint={
              passengerLeader
                ? t("analysis.overview.passengerLeaderHint", {
                    rate: formatPercent(
                      passengerLeader.carriedLeadTitleConversionRate
                    ),
                  })
                : t("analysis.metrics.noWinnerData")
            }
          />
          <InsightCard
            label={t("analysis.overview.driverLeader")}
            value={driverLeader?.label ?? "—"}
            hint={
              driverLeader
                ? t("analysis.overview.driverLeaderHint", {
                    rate: formatPercent(driverLeader.driverRate),
                  })
                : t("analysis.metrics.noStabilityData")
            }
          />
          <InsightCard
            label={t("analysis.overview.resilienceLeader")}
            value={resilienceLeader?.label ?? "—"}
            hint={
              resilienceLeader
                ? t("analysis.overview.resilienceLeaderHint", {
                    rate: formatPercent(
                      resilienceLeader.hindranceResilienceRate
                    ),
                  })
                : t("analysis.tournament.noUnderdogData")
            }
          />
        </div>
      </section>

      <TableShell title={t("analysis.overview.passengerEfficiencyTitle")}>
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              <th className="border-b border-slate-200 px-3 py-3 dark:border-slate-700">
                {t("analysis.conditional.tableDango")}
              </th>
              <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-700">
                {t("analysis.overview.winRate")}
              </th>
              <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-700">
                {t("analysis.overview.carriedShare")}
              </th>
              <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-700">
                {t("analysis.overview.carriedPerRide")}
              </th>
              <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-700">
                {t("analysis.overview.carriedLeadConversion")}
              </th>
            </tr>
          </thead>
          <tbody>
            {passengerRows.map((row) => (
              <tr key={`passenger-${row.basicId}`} className="text-sm">
                <td className="border-b border-slate-200 px-3 py-3 dark:border-slate-800">
                  <TableNameCell row={row} />
                </td>
                <td className="border-b border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                  {formatPercent(row.winRate)}
                </td>
                <td className="border-b border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                  {formatPercent(row.carriedProgressShare)}
                </td>
                <td className="border-b border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                  {row.averageCarriedProgressPerRideTurn.toFixed(2)}
                </td>
                <td className="border-b border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                  {formatPercent(row.carriedLeadTitleConversionRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      <div className="grid gap-6 xl:grid-cols-2">
        <TableShell title={t("analysis.overview.stackEcosystemTitle")}>
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                <th className="border-b border-slate-200 px-3 py-3 dark:border-slate-700">
                  {t("analysis.conditional.tableDango")}
                </th>
                <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-700">
                  {t("analysis.overview.driverShare")}
                </th>
                <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-700">
                  {t("analysis.overview.passengerShare")}
                </th>
                <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-700">
                  {t("analysis.overview.crownShare")}
                </th>
                <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-700">
                  {t("analysis.overview.soloShare")}
                </th>
              </tr>
            </thead>
            <tbody>
              {stackRows.map((row) => (
                <tr key={`stack-${row.basicId}`} className="text-sm">
                  <td className="border-b border-slate-200 px-3 py-3 dark:border-slate-800">
                    <TableNameCell row={row} />
                  </td>
                  <td className="border-b border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                    {formatPercent(row.driverRate)}
                  </td>
                  <td className="border-b border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                    {formatPercent(row.passengerRate)}
                  </td>
                  <td className="border-b border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                    {formatPercent(row.crownRate)}
                  </td>
                  <td className="border-b border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                    {formatPercent(row.soloRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>

        <TableShell title={t("analysis.overview.trapAffinityTitle")}>
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                <th className="border-b border-slate-200 px-3 py-3 dark:border-slate-700">
                  {t("analysis.conditional.tableDango")}
                </th>
                <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-700">
                  {t("analysis.overview.hindranceRate")}
                </th>
                <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-700">
                  {t("analysis.overview.hindranceResilience")}
                </th>
                <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-700">
                  {t("analysis.overview.highHindranceConversion")}
                </th>
                <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-700">
                  {t("analysis.overview.propulsionRate")}
                </th>
                <th className="border-b border-slate-200 px-3 py-3 text-right dark:border-slate-700">
                  {t("analysis.overview.timeRiftRate")}
                </th>
              </tr>
            </thead>
            <tbody>
              {trapRows.map((row) => (
                <tr key={`trap-${row.basicId}`} className="text-sm">
                  <td className="border-b border-slate-200 px-3 py-3 dark:border-slate-800">
                    <TableNameCell row={row} />
                  </td>
                  <td className="border-b border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                    {formatPercent(row.hindranceRate)}
                  </td>
                  <td className="border-b border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                    {formatPercent(row.hindranceResilienceRate)}
                  </td>
                  <td className="border-b border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                    {formatPercent(row.highHindranceTitleConversionRate)}
                  </td>
                  <td className="border-b border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                    {formatPercent(row.propulsionRate)}
                  </td>
                  <td className="border-b border-slate-200 px-3 py-3 text-right font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                    {formatPercent(row.timeRiftRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      </div>
    </div>
  );
}
