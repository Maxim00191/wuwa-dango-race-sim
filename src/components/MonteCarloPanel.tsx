import { ACTIVE_BASIC_DANGO_COUNT } from "@/constants/ids";
import { CHARACTER_BY_ID } from "@/services/characters";
import type { DangoId } from "@/types/game";

type MonteCarloPanelProps = {
  lineupBasicIds: DangoId[];
  runDisabled: boolean;
  progress: { completedGames: number; totalGames: number } | null;
  onRunBatch: (totalGames: number) => void;
};

const PRESET_BATCH_SIZES = [100, 1_000, 10_000] as const;

export function MonteCarloPanel({
  lineupBasicIds,
  runDisabled,
  progress,
  onRunBatch,
}: MonteCarloPanelProps) {
  const lineupComplete = lineupBasicIds.length === ACTIVE_BASIC_DANGO_COUNT;
  const progressRatio =
    progress && progress.totalGames > 0
      ? progress.completedGames / progress.totalGames
      : 0;
  const progressPercentRounded = Math.round(progressRatio * 1000) / 10;

  return (
    <section className="w-full border-b border-slate-200/90 bg-gradient-to-r from-slate-50/95 via-white/90 to-slate-50/95 px-4 py-6 dark:border-slate-800/80 dark:from-slate-950/90 dark:via-slate-900/80 dark:to-slate-950/90 sm:px-6 md:px-10 lg:px-14 xl:px-16 2xl:px-24">
      <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-xl">
            Lots of practice laps
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">
            Run today's lineup over and over (in memory, nice and snappy)
          </h2>
          <p className="max-w-2xl text-sm font-normal text-slate-500 dark:text-slate-400">
            We crunch games in gentle batches so the UI never freezes—pile up
            thousands of tiny races and scoop up cute stats at the end.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {lineupComplete ? (
              lineupBasicIds.map((basicId) => {
                const character = CHARACTER_BY_ID[basicId];
                const label = character?.displayName ?? basicId;
                return (
                  <span
                    key={basicId}
                    className="rounded-full border border-slate-300 bg-white/90 px-3 py-1 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-200"
                  >
                    {label}
                  </span>
                );
              })
            ) : (
              <span className="text-sm font-normal text-amber-700 dark:text-amber-400/85">
                Choose all {ACTIVE_BASIC_DANGO_COUNT} dangos first—then we can
                spam races together!
              </span>
            )}
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-3 lg:w-auto lg:min-w-[min(100%,380px)]">
          <div className="flex flex-wrap gap-2">
            {PRESET_BATCH_SIZES.map((batchSize) => (
              <button
                key={batchSize}
                type="button"
                disabled={runDisabled || Boolean(progress)}
                onClick={() => onRunBatch(batchSize)}
                className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-950/40 transition hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:from-slate-700 dark:disabled:to-slate-700"
              >
                Run {batchSize.toLocaleString()}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-200">
                How far along
              </span>
              <span className="font-mono font-normal text-slate-500 dark:text-slate-400">
                {progress
                  ? `${progress.completedGames.toLocaleString()} / ${progress.totalGames.toLocaleString()} (${progressPercentRounded}%)`
                  : "Standing by"}
              </span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-300/90 dark:bg-slate-800 dark:ring-slate-700/80">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_24px_rgba(52,211,153,0.35)] transition-[width] duration-150 ease-out"
                style={{ width: `${progressRatio * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
