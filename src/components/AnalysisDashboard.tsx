import { CHARACTER_BY_ID } from "@/services/characters";
import { accentFillHexForDango } from "@/services/dangoColors";
import type { MonteCarloAggregateSnapshot } from "@/types/monteCarlo";
import type { DangoId } from "@/types/game";

type AnalysisDashboardProps = {
  snapshot: MonteCarloAggregateSnapshot | null;
  onNavigateSimulation: () => void;
};

function pickDominantBasicId(tallies: Record<string, number>): DangoId | null {
  let bestId: DangoId | null = null;
  let bestWins = -1;
  for (const [basicId, wins] of Object.entries(tallies)) {
    if (wins > bestWins) {
      bestWins = wins;
      bestId = basicId;
    }
  }
  return bestId;
}

export function AnalysisDashboard({
  snapshot,
  onNavigateSimulation,
}: AnalysisDashboardProps) {
  if (!snapshot || snapshot.totalRuns === 0) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <div className="max-w-lg space-y-3">
          <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Results nook
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">
            No cozy batch yet
          </h2>
          <p className="text-sm font-normal text-slate-500 dark:text-slate-400 md:text-base">
            Hop back to Simulation and fire off a bulk run—when the bar fills up,
            we'll tuck all the sweet summaries here for you.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateSimulation}
          className="rounded-full bg-emerald-500 px-8 py-3 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400"
        >
          Back to the race
        </button>
      </div>
    );
  }

  const averageTurnsToWin = snapshot.sumTurns / snapshot.totalRuns;
  const averagePreliminaryTurns =
    snapshot.scenarioKind === "tournament"
      ? snapshot.sumPreliminaryTurns / snapshot.totalRuns
      : null;
  const averageFinalTurns = snapshot.sumFinalTurns / snapshot.totalRuns;
  const dominantWinnerId = pickDominantBasicId(snapshot.winsByBasicId);
  const dominantPreliminaryWinnerId = pickDominantBasicId(
    snapshot.preliminaryWinsByBasicId
  );
  const dominantCarrierId = pickDominantBasicId(
    snapshot.stackCarrierObservationSumByBasicId
  );
  const dominantWinnerLabel = dominantWinnerId
    ? CHARACTER_BY_ID[dominantWinnerId]?.displayName ?? dominantWinnerId
    : "—";
  const dominantPreliminaryWinnerLabel = dominantPreliminaryWinnerId
    ? CHARACTER_BY_ID[dominantPreliminaryWinnerId]?.displayName ??
      dominantPreliminaryWinnerId
    : "—";
  const dominantCarrierLabel = dominantCarrierId
    ? CHARACTER_BY_ID[dominantCarrierId]?.displayName ?? dominantCarrierId
    : "—";
  const minTurnsDisplay =
    snapshot.totalRuns > 0 && Number.isFinite(snapshot.minTurns)
      ? snapshot.minTurns
      : "—";
  const maxTurnsDisplay =
    snapshot.totalRuns > 0 ? snapshot.maxTurns : "—";

  return (
    <div className="flex w-full flex-col gap-10 px-4 py-10 text-slate-900 dark:text-slate-100 sm:px-6 md:px-10 lg:px-14 xl:px-16 2xl:px-24">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-xl">
            After the marathon
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">
            {snapshot.scenarioLabel}
          </h2>
          <p className="max-w-2xl text-sm font-normal text-slate-500 dark:text-slate-400 md:text-base">
            From {snapshot.totalRuns.toLocaleString()} simulated runs with this same
            lineup. Tournament batches include both rounds; final-only batches start
            from the configured finals order.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateSimulation}
          className="self-start rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:text-slate-950 md:self-auto dark:border-slate-600 dark:text-slate-100 dark:hover:text-white"
        >
          Return to simulation
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricHighlightCard
          label={
            snapshot.scenarioKind === "tournament"
              ? "Typical turns per tournament"
              : "Typical turns to a win"
          }
          value={averageTurnsToWin.toFixed(1)}
          hint={
            snapshot.scenarioKind === "tournament"
              ? "Average total turns across preliminaries plus finals"
              : "Average total turns for this race setup"
          }
        />
        <MetricHighlightCard
          label="Speediest finish"
          value={String(minTurnsDisplay)}
          hint="Shortest complete run in this batch"
        />
        <MetricHighlightCard
          label="Longest slog"
          value={String(maxTurnsDisplay)}
          hint="Longest complete run in this batch"
        />
        <MetricHighlightCard
          label="How many scrumbles"
          value={snapshot.totalRuns.toLocaleString()}
          hint="Total simulated runs in this snapshot"
        />
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-slate-950/60 md:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
                {snapshot.scenarioKind === "tournament"
                  ? "Championships per dango"
                  : "Wins per dango"}
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Final winners across the batch
              </p>
            </div>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-500">
              Title share from the selected scenario
            </span>
          </div>
          <div className="space-y-5">
            {snapshot.selectedBasicIds.map((basicId) => {
              const wins = snapshot.winsByBasicId[basicId] ?? 0;
              const ratePercent =
                (wins / snapshot.totalRuns) * 100;
              const character = CHARACTER_BY_ID[basicId];
              const label = character?.displayName ?? basicId;
              const accentHex = accentFillHexForDango(basicId);
              return (
                <div key={basicId} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                      {label}
                    </span>
                    <span className="font-mono text-xs font-normal text-slate-500 dark:text-slate-400">
                      {wins.toLocaleString()} wins ·{" "}
                      {Math.round(ratePercent * 10) / 10}%
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-300 dark:bg-slate-950/80 dark:ring-slate-800">
                    <div
                      className="h-full rounded-full transition-[width] duration-300"
                      style={{
                        width: `${ratePercent}%`,
                        backgroundColor: accentHex,
                        boxShadow: `0 0 18px ${accentHex}55`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:from-slate-900/90 dark:to-slate-950/90 dark:shadow-xl md:p-8">
            <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Pace split
            </p>
            <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {snapshot.scenarioKind === "tournament"
                ? "Where tournament time went"
                : "Winner share donut"}
            </p>
            {snapshot.scenarioKind === "tournament" ? (
              <div className="mt-6 space-y-5">
                <TimelineMetric
                  label="Preliminary share"
                  value={averagePreliminaryTurns?.toFixed(1) ?? "0.0"}
                  percent={
                    snapshot.sumTurns > 0
                      ? (snapshot.sumPreliminaryTurns / snapshot.sumTurns) * 100
                      : 0
                  }
                  accentClass="from-emerald-400 to-teal-400"
                />
                <TimelineMetric
                  label="Final share"
                  value={averageFinalTurns.toFixed(1)}
                  percent={
                    snapshot.sumTurns > 0
                      ? (snapshot.sumFinalTurns / snapshot.sumTurns) * 100
                      : 0
                  }
                  accentClass="from-violet-500 to-fuchsia-500"
                />
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center">
                <WinShareDonut
                  basicIds={snapshot.selectedBasicIds}
                  winsByBasicId={snapshot.winsByBasicId}
                  totalRuns={snapshot.totalRuns}
                />
                <ul className="w-full space-y-3 text-sm sm:max-w-xs">
                  {snapshot.selectedBasicIds.map((basicId) => {
                    const wins = snapshot.winsByBasicId[basicId] ?? 0;
                    const slicePercent =
                      snapshot.totalRuns > 0
                        ? (wins / snapshot.totalRuns) * 100
                        : 0;
                    const character = CHARACTER_BY_ID[basicId];
                    const accentHex = accentFillHexForDango(basicId);
                    return (
                      <li
                        key={`legend-${basicId}`}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-slate-900/10 dark:ring-white/10"
                            style={{ backgroundColor: accentHex }}
                          />
                          <span className="font-normal text-slate-600 dark:text-slate-400">
                            {character?.displayName ?? basicId}
                          </span>
                        </span>
                        <span className="font-mono text-xs font-normal text-slate-500 dark:text-slate-500">
                          {Math.round(slicePercent * 10) / 10}%
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-fuchsia-200/70 bg-fuchsia-50/95 p-6 shadow-md shadow-fuchsia-900/10 dark:border-fuchsia-900/40 dark:bg-fuchsia-950/25 dark:shadow-lg md:p-8">
            <p className="text-base font-bold tracking-tight text-fuchsia-900 dark:text-fuchsia-100">
              Tea-time trivia
            </p>
            <ul className="mt-4 space-y-4 text-sm font-normal leading-relaxed text-fuchsia-950/95 dark:text-fuchsia-50/95">
              <li>
                <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  Champion favorite:
                </span>{" "}
                {dominantWinnerLabel} finished on top most often in this batch.
              </li>
              {snapshot.scenarioKind === "tournament" ? (
                <li>
                  <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Preliminary pace-setter:
                  </span>{" "}
                  {dominantPreliminaryWinnerLabel} topped the opening round more
                  than anyone else.
                </li>
              ) : null}
              <li>
                <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  Stack carrier:
                </span>{" "}
                {dominantCarrierLabel} spent the most observations riding at the top
                of a stack.
              </li>
              <li>
                <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  Pace:
                </span>{" "}
                runs stretched from {minTurnsDisplay} to {maxTurnsDisplay} turns,
                averaging {averageTurnsToWin.toFixed(1)} overall
                {snapshot.scenarioKind === "tournament" &&
                averagePreliminaryTurns !== null
                  ? ` with ${averagePreliminaryTurns.toFixed(1)} in prelims and ${averageFinalTurns.toFixed(1)} in finals`
                  : ""}.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

type TimelineMetricProps = {
  label: string;
  value: string;
  percent: number;
  accentClass: string;
};

function TimelineMetric({
  label,
  value,
  percent,
  accentClass,
}: TimelineMetricProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {label}
        </span>
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
          {value} avg turns · {Math.round(percent * 10) / 10}%
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-300 dark:bg-slate-950/80 dark:ring-slate-800">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${accentClass}`}
          style={{ width: `${Math.max(0, Math.min(percent, 100))}%` }}
        />
      </div>
    </div>
  );
}

type MetricHighlightCardProps = {
  label: string;
  value: string;
  hint: string;
};

function MetricHighlightCard({
  label,
  value,
  hint,
}: MetricHighlightCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-inner shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-slate-950/40">
      <p className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-200">
        {label}
      </p>
      <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {value}
      </p>
      <p className="mt-2 text-xs font-normal text-slate-500 dark:text-slate-500">{hint}</p>
    </div>
  );
}

type WinShareDonutProps = {
  basicIds: DangoId[];
  winsByBasicId: Record<string, number>;
  totalRuns: number;
};

function WinShareDonut({
  basicIds,
  winsByBasicId,
  totalRuns,
}: WinShareDonutProps) {
  let cumulative = 0;
  const segments = basicIds.map((basicId) => {
    const wins = winsByBasicId[basicId] ?? 0;
    const percent = totalRuns > 0 ? (wins / totalRuns) * 100 : 0;
    const start = cumulative;
    cumulative += percent;
    const accentHex = accentFillHexForDango(basicId);
    return { basicId, percent, start, accentHex };
  });
  const gradientStops = segments
    .filter((segment) => segment.percent > 0)
    .map((segment) => {
      const startAngle = (segment.start / 100) * 360;
      const endAngle =
        ((segment.start + segment.percent) / 100) * 360;
      return `${segment.accentHex} ${startAngle}deg ${endAngle}deg`;
    })
    .join(", ");
  const background =
    gradientStops.length > 0
      ? `conic-gradient(${gradientStops})`
      : "conic-gradient(var(--donut-empty) 0deg 360deg)";

  return (
    <div
      className="relative h-44 w-44 shrink-0 rounded-full shadow-[0_20px_60px_rgba(148,163,184,0.35)] ring-4 ring-slate-200 dark:shadow-[0_20px_60px_rgba(15,23,42,0.85)] dark:ring-slate-900"
      style={{ background }}
    >
      <div className="absolute inset-[22%] rounded-full bg-white/95 ring-2 ring-slate-200 dark:bg-slate-950/95 dark:ring-slate-800" />
    </div>
  );
}
