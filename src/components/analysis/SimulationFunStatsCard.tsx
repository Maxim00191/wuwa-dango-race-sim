import { useMemo } from "react";
import {
  formatBatchWallClockMs,
  FULL_MARATHON_METERS,
  sumAggregateForwardDisplacementCells,
} from "@/components/analysis/analytics";
import { useTranslation } from "@/i18n/useTranslation";
import type { MonteCarloAggregateSnapshot } from "@/types/monteCarlo";

type SimulationFunStatsCardProps = {
  snapshot: MonteCarloAggregateSnapshot;
};

export function SimulationFunStatsCard({
  snapshot,
}: SimulationFunStatsCardProps) {
  const { t } = useTranslation();
  const forwardCells = useMemo(
    () =>
      sumAggregateForwardDisplacementCells(
        snapshot.selectedBasicIds,
        snapshot.basicMetricTotalsByBasicId
      ),
    [snapshot.basicMetricTotalsByBasicId, snapshot.selectedBasicIds]
  );
  const wallClockMs = snapshot.totalRuntimeMs;
  const hasValidRuntime =
    wallClockMs !== undefined &&
    Number.isFinite(wallClockMs) &&
    wallClockMs > 0;
  const runtimeSeconds = hasValidRuntime ? wallClockMs / 1000 : 0;
  const matchesPerDangoPerSecond = hasValidRuntime
    ? snapshot.totalRuns / runtimeSeconds
    : null;
  const marathonEquivalents = forwardCells / FULL_MARATHON_METERS;
  const wallClockDisplay =
    wallClockMs !== undefined && Number.isFinite(wallClockMs) && wallClockMs >= 0
      ? formatBatchWallClockMs(wallClockMs)
      : t("analysis.funStats.runtimeUnavailable");
  const throughputDisplay =
    matchesPerDangoPerSecond !== null
      ? matchesPerDangoPerSecond.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : t("analysis.funStats.unavailable");

  return (
    <section
      aria-label={t("analysis.funStats.title")}
      className="relative overflow-hidden rounded-3xl border border-violet-200/80 bg-gradient-to-br from-white via-slate-50/90 to-violet-50/60 p-5 shadow-lg shadow-violet-950/5 ring-1 ring-violet-100/60 dark:border-violet-900/50 dark:from-slate-950 dark:via-slate-950 dark:to-violet-950/30 dark:ring-violet-900/40 sm:p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-500/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-500/10"
      />
      <div className="relative space-y-5">
        <header className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
            {t("analysis.funStats.eyebrow")}
          </p>
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
            {t("analysis.funStats.title")}
          </h3>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {t("analysis.funStats.intro")}
          </p>
        </header>
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white/80 p-4 shadow-sm shadow-slate-900/5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t("analysis.funStats.runtimeLabel")}
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
              {wallClockDisplay}
            </p>
            <p className="mt-2 text-xs leading-snug text-slate-500 dark:text-slate-400">
              {t("analysis.funStats.runtimeHint")}
            </p>
          </div>
          <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white/80 p-4 shadow-sm shadow-slate-900/5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t("analysis.funStats.throughputLabel")}
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums tracking-tight text-emerald-800 dark:text-emerald-300">
              {throughputDisplay}
            </p>
            <p className="mt-2 text-xs leading-snug text-slate-500 dark:text-slate-400">
              {t("analysis.funStats.throughputHint")}
            </p>
          </div>
          <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white/80 p-4 shadow-sm shadow-slate-900/5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t("analysis.funStats.marathonLabel")}
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums tracking-tight text-amber-900 dark:text-amber-200">
              {marathonEquivalents.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="mt-2 text-xs leading-snug text-slate-500 dark:text-slate-400">
              {t("analysis.funStats.marathonHint", {
                cells: forwardCells.toLocaleString(),
              })}
            </p>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-500">
          {t("analysis.funStats.methodology")}
        </p>
      </div>
    </section>
  );
}
