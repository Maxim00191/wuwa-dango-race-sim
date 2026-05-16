import { useTranslation } from "@/i18n/useTranslation";
import { useMonteCarloProgress } from "@/hooks/useMonteCarloProgress";

export function MonteCarloProgressStats() {
  const { t } = useTranslation();
  const { progress, progressRatio } = useMonteCarloProgress();

  if (!progress) {
    return null;
  }

  const { completedGames, totalGames, timeRemainingLabel, isStopping } = progress;
  const progressPercentRounded = Math.round(progressRatio * 1000) / 10;

  return (
    <div className="flex flex-col items-end gap-0.5 text-right sm:items-end">
      <span className="font-mono text-xs text-slate-500 dark:text-slate-400 md:text-sm">
        {`${completedGames.toLocaleString()} / ${totalGames.toLocaleString()} (${progressPercentRounded}%)${isStopping ? ` · ${t("monteCarlo.stopping")}` : ""}`}
      </span>
      {timeRemainingLabel && !isStopping ? (
        <span className="font-mono text-[11px] font-medium tabular-nums text-teal-700 dark:text-teal-300/90 md:text-xs">
          {t("monteCarlo.timeRemaining", {
            value: timeRemainingLabel,
          })}
        </span>
      ) : null}
    </div>
  );
}

export function MonteCarloProgressBar({
  extremePerformanceEnabled,
}: {
  extremePerformanceEnabled: boolean;
}) {
  const { progress, progressRatio } = useMonteCarloProgress();

  if (!progress) {
    return null;
  }

  return (
    <div className="relative mt-4 h-2.5 overflow-hidden rounded-full bg-white ring-1 ring-slate-200/90 dark:bg-slate-950/70 dark:ring-slate-800/90">
      <div
        className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 ease-out ${
          extremePerformanceEnabled
            ? "transition-[width] duration-150"
            : "transition-[width] duration-500"
        }`}
        style={{ width: `${progressRatio * 100}%` }}
      >
        <div className="absolute inset-0 bg-[length:200%_100%] bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
      </div>
    </div>
  );
}

export function MonteCarloProgressContainer({
  children,
}: {
  children: (isRunning: boolean) => React.ReactNode;
}) {
  const { isRunning } = useMonteCarloProgress();

  return <>{children(isRunning)}</>;
}
