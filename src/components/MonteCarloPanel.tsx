import { useState } from "react";
import { ACTIVE_BASIC_DANGO_COUNT } from "@/constants/ids";
import { useTranslation } from "@/i18n/useTranslation";
import type { DangoId } from "@/types/game";

export type MonteCarloScenarioOption = {
  id: string;
  label: string;
  description: string;
};

type MonteCarloPanelProps = {
  heading: string;
  title: string;
  description: string;
  lineupBasicIds: DangoId[];
  runDisabled: boolean;
  progress: { completedGames: number; totalGames: number } | null;
  isStopping: boolean;
  scenarioOptions: MonteCarloScenarioOption[];
  selectedScenarioId: string;
  onSelectedScenarioChange: (scenarioId: string) => void;
  onRunBatch: (scenarioId: string, totalGames: number) => void;
  onAbortRun: () => void;
};

const PRESET_BATCH_SIZES = [100, 1_000, 10_000] as const;
const DEFAULT_CUSTOM_BATCH_SIZE = "5000";

export function MonteCarloPanel({
  heading,
  title,
  description,
  lineupBasicIds,
  runDisabled,
  progress,
  isStopping,
  scenarioOptions,
  selectedScenarioId,
  onSelectedScenarioChange,
  onRunBatch,
  onAbortRun,
}: MonteCarloPanelProps) {
  const { getCharacterName, t } = useTranslation();
  const [customBatchSizeText, setCustomBatchSizeText] = useState(
    DEFAULT_CUSTOM_BATCH_SIZE
  );
  const [showCustomControls, setShowCustomControls] = useState(false);
  const lineupComplete = lineupBasicIds.length === ACTIVE_BASIC_DANGO_COUNT;
  const isRunning = Boolean(progress);
  const progressRatio =
    progress && progress.totalGames > 0
      ? progress.completedGames / progress.totalGames
      : 0;
  const progressPercentRounded = Math.round(progressRatio * 1000) / 10;
  const parsedCustomBatchSize = Number.parseInt(customBatchSizeText, 10);
  const customBatchSizeValid =
    Number.isSafeInteger(parsedCustomBatchSize) && parsedCustomBatchSize > 0;
  const customRunsHint =
    customBatchSizeText.length > 0 && !customBatchSizeValid
      ? t("monteCarlo.customRunsInvalid")
      : t("monteCarlo.customRunsHint");
  const canRunCustom =
    lineupComplete && !runDisabled && !isRunning && customBatchSizeValid;

  const submitCustomBatch = () => {
    if (!canRunCustom) {
      return;
    }
    onRunBatch(selectedScenarioId, parsedCustomBatchSize);
  };

  return (
    <section className="w-full border-b border-slate-200/90 bg-gradient-to-r from-slate-50/95 via-white/90 to-slate-50/95 px-4 py-6 dark:border-slate-800/80 dark:from-slate-950/90 dark:via-slate-900/80 dark:to-slate-950/90 sm:px-6 md:px-10 lg:px-14 xl:px-16 2xl:px-24">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="grid gap-6 rounded-[2.5rem] border border-slate-200/80 bg-white/75 p-5 shadow-[0_10px_32px_-18px_rgba(15,23,42,0.32)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/45 dark:shadow-[0_10px_32px_-18px_rgba(2,6,23,0.55)] md:p-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:gap-8">
   
          <div className="min-w-0">
            <div className="flex h-full flex-col justify-between gap-8 rounded-[2rem] bg-gradient-to-br from-white/55 via-white/15 to-slate-100/60 p-2 dark:from-white/[0.04] dark:via-transparent dark:to-slate-900/35 md:p-3">
              <div className="space-y-4 px-1 py-1 md:px-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  {heading}
                </p>
                <div className="space-y-3">
                  <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-[2rem]">
                    {title}
                  </h2>
                  <p className="max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400 md:text-[15px]">
                    {description}
                  </p>
                </div>
              </div>
              <div className="rounded-[1.75rem] bg-white/72 p-4 ring-1 ring-slate-200/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:bg-slate-900/55 dark:ring-slate-800/80 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:p-5">
                <div className="flex flex-wrap gap-2.5">
                  {lineupComplete ? (
                    lineupBasicIds.map((basicId) => {
                      const label = getCharacterName(basicId);
                      return (
                        <span
                          key={basicId}
                          className="rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm shadow-slate-900/5 ring-1 ring-slate-200/80 dark:bg-slate-950/80 dark:text-slate-200 dark:ring-slate-800 dark:shadow-slate-950/30"
                        >
                          {label}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-sm leading-6 text-amber-700 dark:text-amber-400/85">
                      {t("monteCarlo.lineupIncomplete", {
                        count: ACTIVE_BASIC_DANGO_COUNT,
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="min-w-0">
            <div className="grid gap-4 md:gap-5">
              {scenarioOptions.length > 1 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {scenarioOptions.map((scenario) => {
                    const selected = scenario.id === selectedScenarioId;
                    return (
                      <button
                        key={scenario.id}
                        type="button"
                        disabled={isRunning}
                        aria-pressed={selected}
                        onClick={() => onSelectedScenarioChange(scenario.id)}
                        className={`relative overflow-hidden rounded-[1.65rem] border px-5 py-4 text-left transition ${
                          selected
                            ? "border-violet-300/90 bg-gradient-to-br from-violet-500/18 via-white to-fuchsia-500/12 text-violet-950 shadow-lg shadow-violet-900/10 ring-1 ring-violet-300/70 dark:border-violet-500/70 dark:from-violet-500/22 dark:via-slate-950 dark:to-fuchsia-500/18 dark:text-violet-100 dark:ring-violet-500/40"
                            : "border-slate-200/85 bg-white/78 text-slate-800 shadow-sm shadow-slate-900/5 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-950/65 dark:text-slate-100 dark:hover:border-slate-700 dark:hover:bg-slate-950/80"
                        }`}
                      >
                        <span
                          className={`absolute inset-x-5 top-0 h-px ${
                            selected
                              ? "bg-gradient-to-r from-violet-400/20 via-violet-500 to-fuchsia-400/30 dark:from-violet-300/10 dark:via-violet-400/80 dark:to-fuchsia-400/20"
                              : "bg-gradient-to-r from-transparent via-slate-300/70 to-transparent dark:via-slate-700/70"
                          }`}
                        />
                        <div className="space-y-1.5">
                          <p className="text-base font-semibold tracking-tight">
                            {scenario.label}
                          </p>
                          <p
                            className={`text-sm leading-6 ${
                              selected
                                ? "text-violet-900/70 dark:text-violet-200/75"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {scenario.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
              <div className="rounded-[1.9rem] bg-slate-100/70 p-4 ring-1 ring-slate-200/80 dark:bg-slate-900/45 dark:ring-slate-800/80 md:p-5">
                <div className="grid gap-4">
                  <div className="flex flex-wrap items-center justify-end gap-2.5">
                    {PRESET_BATCH_SIZES.map((batchSize) => (
                      <button
                        key={batchSize}
                        type="button"
                        disabled={runDisabled || isRunning}
                        onClick={() => onRunBatch(selectedScenarioId, batchSize)}
                        className="inline-flex min-h-[2.9rem] items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-950/25 transition hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:from-slate-700 dark:disabled:to-slate-700"
                      >
                        {t("monteCarlo.runBatch", {
                          count: batchSize.toLocaleString(),
                        })}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={runDisabled || isRunning}
                      aria-pressed={showCustomControls}
                      onClick={() =>
                        setShowCustomControls((current) => !current)
                      }
                      className={`inline-flex min-h-[2.9rem] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:shadow-none ${
                        showCustomControls
                          ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-950/25 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 dark:disabled:from-slate-700 dark:disabled:to-slate-700"
                          : "bg-white/90 text-slate-700 ring-1 ring-slate-200 hover:bg-white hover:text-slate-900 dark:bg-slate-950/70 dark:text-slate-200 dark:ring-slate-800 dark:hover:bg-slate-950 dark:hover:text-slate-50 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 dark:disabled:ring-slate-800"
                      }`}
                    >
                      {t("monteCarlo.useCustomNumber")}
                    </button>
                  </div>
                  {showCustomControls || isRunning ? (
                    <div
                      className={`grid gap-3 rounded-[1.6rem] bg-white/88 p-3.5 ring-1 ring-slate-200/80 dark:bg-slate-950/72 dark:ring-slate-800/80 ${
                        showCustomControls
                          ? "lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
                          : ""
                      }`}
                    >
                      {showCustomControls ? (
                        <label className="grid gap-2.5">
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            {t("monteCarlo.customRunsLabel")}
                          </span>
                          <div
                            className={`flex items-center gap-3 rounded-[1.25rem] px-4 py-3 ring-1 transition ${
                              customBatchSizeText.length > 0 &&
                              !customBatchSizeValid
                                ? "bg-rose-50/95 ring-rose-300 dark:bg-rose-950/25 dark:ring-rose-500/40"
                                : "bg-slate-50/90 ring-slate-200 dark:bg-slate-900/70 dark:ring-slate-800"
                            }`}
                          >
                            <input
                              type="text"
                              inputMode="numeric"
                              value={customBatchSizeText}
                              onChange={(event) =>
                                setCustomBatchSizeText(
                                  event.target.value.replace(/[^0-9]/g, "")
                                )
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  submitCustomBatch();
                                }
                              }}
                              disabled={runDisabled || isRunning}
                              placeholder={t(
                                "monteCarlo.customRunsPlaceholder"
                              )}
                              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400 dark:text-slate-50 dark:placeholder:text-slate-500 dark:disabled:text-slate-500"
                            />
                            <span className="shrink-0 text-xs font-medium uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                              {t("monteCarlo.customRunsUnit")}
                            </span>
                          </div>
                          <p
                            className={`text-sm ${
                              customBatchSizeText.length > 0 &&
                              !customBatchSizeValid
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {customRunsHint}
                          </p>
                        </label>
                      ) : null}
                      {isRunning ? (
                        <button
                          type="button"
                          onClick={onAbortRun}
                          disabled={isStopping}
                          className="inline-flex min-h-[3.25rem] items-center justify-center rounded-[1.25rem] bg-rose-600 px-5 py-3 text-sm font-semibold text-rose-50 shadow-lg shadow-rose-950/30 transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400 lg:min-w-[11rem]"
                        >
                          {isStopping
                            ? t("monteCarlo.stopping")
                            : t("monteCarlo.stop")}
                        </button>
                      ) : showCustomControls ? (
                        <button
                          type="button"
                          onClick={submitCustomBatch}
                          disabled={!canRunCustom}
                          className="inline-flex min-h-[3.25rem] items-center justify-center rounded-[1.25rem] bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-950/30 transition hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:from-slate-700 dark:disabled:to-slate-700 dark:disabled:text-slate-400 lg:min-w-[11rem]"
                        >
                          {customBatchSizeValid
                            ? t("monteCarlo.runBatch", {
                                count: parsedCustomBatchSize.toLocaleString(),
                              })
                            : t("monteCarlo.customRunsLabel")}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          {progress ? (
            <div className="xl:col-span-2">
              <div className="rounded-[1.9rem] bg-slate-100/70 px-5 py-4 ring-1 ring-slate-200/80 dark:bg-slate-900/45 dark:ring-slate-800/80 md:px-6 md:py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-semibold tracking-tight text-slate-700 dark:text-slate-200">
                    {t("monteCarlo.progress")}
                  </span>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400 md:text-sm">
                    {`${progress.completedGames.toLocaleString()} / ${progress.totalGames.toLocaleString()} (${progressPercentRounded}%)${isStopping ? ` · ${t("monteCarlo.stopping")}` : ""}`}
                  </span>
                </div>
                <div className="relative mt-4 h-2.5 overflow-hidden rounded-full bg-white ring-1 ring-slate-200/90 dark:bg-slate-950/70 dark:ring-slate-800/90">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_24px_rgba(52,211,153,0.35)] transition-[width] duration-150 ease-out"
                    style={{ width: `${progressRatio * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
