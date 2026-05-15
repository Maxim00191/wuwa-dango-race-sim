import type { ReactNode } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { resolveKnockoutGroupPhaseKey } from "@/constants/knockoutGroups";
import { colorWithAlpha, formatPercent } from "@/components/analysis/analytics";
import type { DangoId } from "@/types/game";

export type TournamentFlowGraphCompetitorRow = {
  basicId: DangoId;
  label: string;
  accentHex: string;
  groupEntries: number;
  winnersEntries: number;
  losersEntries: number;
  finalsEntries: number;
  titles: number;
  championshipRate: number;
  groupToWinnersRate: number;
  groupToLosersRate: number;
  winnersToFinalRate: number;
  losersToFinalRate: number;
  winnersToFinals: number;
  losersToFinals: number;
  winnersChampions: number;
  losersChampions: number;
  finalistToChampionRate: number;
  winnersChampionRate: number;
  losersChampionRate: number;
};

type TournamentFlowGraphProps = {
  totalRuns: number;
  rows: TournamentFlowGraphCompetitorRow[];
  selectedBasicId: DangoId;
  onSelectBasicId: (basicId: DangoId) => void;
};

function sliceRate(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return (numerator / denominator) * 100;
}

type GraphNodeShellProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  accentHex: string;
  emphasize: boolean;
  children?: ReactNode;
};

function GraphNodeShell({
  title,
  subtitle,
  meta,
  accentHex,
  emphasize,
  children,
}: GraphNodeShellProps) {
  return (
    <div
      className={`relative w-full max-w-md rounded-2xl border border-slate-200/90 px-4 py-3 shadow-lg transition-all dark:border-slate-700/90 sm:px-5 sm:py-4 ${
        emphasize ? "shadow-violet-950/30" : ""
      }`}
      style={{
        backgroundColor: emphasize ? colorWithAlpha(accentHex, 0.12) : undefined,
        borderColor: emphasize ? colorWithAlpha(accentHex, 0.45) : undefined,
      }}
    >
      <div
        className={`rounded-xl px-3 py-2.5 dark:bg-slate-950/40 ${
          emphasize ? "bg-white/50" : "bg-white/80"
        }`}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          {title}
        </p>
        {subtitle ? (
          <p className="mt-1.5 font-mono text-xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
            {subtitle}
          </p>
        ) : null}
        {meta ? (
          <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">{meta}</p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

type FlowEdgeProps = {
  label: string;
  sublabel?: string;
  accentHex: string;
  thick: boolean;
  align?: "center" | "left" | "right";
};

function FlowEdge({ label, sublabel, accentHex, thick, align = "center" }: FlowEdgeProps) {
  const justify =
    align === "left" ? "items-start text-left" : align === "right" ? "items-end text-right" : "items-center text-center";
  const barSelf =
    align === "center" ? "self-center" : align === "right" ? "self-end" : "self-start";
  return (
    <div className={`flex w-full flex-col gap-1 py-1 ${justify}`}>
      <div
        className={`rounded-full ${thick ? "min-h-10" : "min-h-8"} ${barSelf}`}
        style={{
          background: `linear-gradient(180deg, ${colorWithAlpha(accentHex, 0.15)} 0%, ${accentHex} 55%, ${colorWithAlpha(accentHex, 0.2)} 100%)`,
          width: thick ? 3 : 2,
        }}
      />
      <div className={justify.includes("center") ? "mx-auto" : ""}>
        <p className="font-mono text-sm font-bold tabular-nums" style={{ color: accentHex }}>
          {label}
        </p>
        {sublabel ? (
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{sublabel}</p>
        ) : null}
      </div>
    </div>
  );
}

export function TournamentFlowGraph({
  totalRuns,
  rows,
  selectedBasicId,
  onSelectBasicId,
}: TournamentFlowGraphProps) {
  const { t } = useTranslation();
  const row =
    rows.find((entry) => entry.basicId === selectedBasicId) ?? rows[0] ?? null;

  if (!row || totalRuns <= 0) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-slate-50/90 p-6 dark:border-slate-800 dark:bg-slate-950/50">
        <p className="text-sm text-slate-600 dark:text-slate-300">{t("analysis.knockout.flowGraphEmpty")}</p>
      </section>
    );
  }

  const phaseKey = resolveKnockoutGroupPhaseKey(row.basicId);
  const groupTitle = phaseKey
    ? t(`knockout.phases.${phaseKey}`)
    : t("analysis.knockout.flowGraphUnknownGroup");

  const pCup = row.groupEntries > 0 ? sliceRate(row.groupEntries, totalRuns) : 0;
  const pWinnersLane = sliceRate(row.winnersEntries, totalRuns);
  const pLosersLane = sliceRate(row.losersEntries, totalRuns);
  const pFinals = sliceRate(row.finalsEntries, totalRuns);
  const pFinalViaWinners = sliceRate(row.winnersToFinals, totalRuns);
  const pFinalViaLosers = sliceRate(row.losersToFinals, totalRuns);
  const pTitleViaWinners = sliceRate(row.winnersChampions, totalRuns);
  const pTitleViaLosers = sliceRate(row.losersChampions, totalRuns);

  const winnersPrimary = row.winnersEntries >= row.losersEntries;

  const emerald = "#10b981";
  const amber = "#f59e0b";
  const violet = "#8b5cf6";

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50/95 via-white/90 to-slate-100/90 p-5 shadow-xl shadow-slate-900/15 dark:border-slate-800 dark:from-slate-950/80 dark:via-slate-900/70 dark:to-slate-950/90 dark:shadow-slate-950/40 sm:p-8">
      <div className="flex flex-col gap-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-violet-600 dark:text-violet-300">
            {t("analysis.knockout.tabs.flow")}
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {t("analysis.knockout.flowGraphTitle")}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {t("analysis.knockout.flowGraphDescription")}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white/60 p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-950/40">
          <p className="px-1 pb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {t("analysis.knockout.flowGraphPicker")}
          </p>
          <div className="flex flex-wrap gap-2">
            {rows.map((entry) => {
              const selected = entry.basicId === row.basicId;
              return (
                <button
                  key={entry.basicId}
                  type="button"
                  onClick={() => onSelectBasicId(entry.basicId)}
                  className={`flex min-w-0 items-center gap-2 rounded-full border px-2.5 py-1.5 text-left text-[11px] font-bold transition ${
                    selected
                      ? "border-violet-500 bg-violet-500/15 text-violet-950 shadow-md shadow-violet-900/10 dark:border-violet-400 dark:bg-violet-950/50 dark:text-violet-100"
                      : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500"
                  }`}
                >
                  <span
                    className="inline-flex h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.accentHex }}
                  />
                  <span className="max-w-[7rem] truncate sm:max-w-[9rem]">{entry.label}</span>
                  <span className="font-mono text-[10px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                    {formatPercent(entry.championshipRate)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-3xl flex-col items-center">
        <GraphNodeShell
          title={t("analysis.knockout.flowGraphNodeCup")}
          subtitle={t("analysis.knockout.flowGraphRuns", { count: totalRuns.toLocaleString() })}
          meta={t("analysis.knockout.flowGraphNodeCupHint")}
          accentHex={row.accentHex}
          emphasize={false}
        />

        <FlowEdge
          label={formatPercent(pCup)}
          sublabel={t("analysis.knockout.flowGraphParticipation")}
          accentHex={row.accentHex}
          thick
        />

        <GraphNodeShell
          title={groupTitle}
          subtitle={formatPercent(pCup)}
          meta={t("analysis.knockout.flowGraphGroupMeta", {
            runs: row.groupEntries.toLocaleString(),
          })}
          accentHex={phaseKey === "groupB" ? "#0ea5e9" : "#f59e0b"}
          emphasize={false}
        />

        <div className="flex w-full flex-col items-center py-1">
          <div
            className="min-h-8 w-px rounded-full bg-gradient-to-b from-slate-300 via-slate-400 to-slate-300 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600"
            aria-hidden
          />
          <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            {t("analysis.knockout.flowGraphBracketPhase")}
          </p>
        </div>

        <div className="relative mt-1 grid w-full max-w-3xl grid-cols-2 items-start gap-4 sm:gap-8">
          <div
            className="pointer-events-none absolute left-1/2 top-0 hidden h-7 w-[58%] -translate-x-1/2 border-b border-l border-r border-slate-400/70 rounded-b-md dark:border-slate-600/80 sm:block"
            aria-hidden
          />
          <div className="flex flex-col items-center">
            <FlowEdge
              label={formatPercent(row.groupToWinnersRate)}
              sublabel={t("analysis.knockout.flowGraphJoint", {
                rate: formatPercent(pWinnersLane),
              })}
              accentHex={emerald}
              thick={winnersPrimary}
              align="center"
            />
            <GraphNodeShell
              title={t("knockout.phases.winnersBracket")}
              subtitle={formatPercent(pWinnersLane)}
              meta={t("analysis.knockout.flowGraphBracketMeta", {
                runs: row.winnersEntries.toLocaleString(),
              })}
              accentHex={emerald}
              emphasize={winnersPrimary}
            />
            <FlowEdge
              label={formatPercent(row.winnersToFinalRate)}
              sublabel={t("analysis.knockout.flowGraphJoint", {
                rate: formatPercent(pFinalViaWinners),
              })}
              accentHex={emerald}
              thick={winnersPrimary && row.winnersEntries > 0}
            />
          </div>
          <div className="flex flex-col items-center">
            <FlowEdge
              label={formatPercent(row.groupToLosersRate)}
              sublabel={t("analysis.knockout.flowGraphJoint", {
                rate: formatPercent(pLosersLane),
              })}
              accentHex={amber}
              thick={!winnersPrimary}
              align="center"
            />
            <GraphNodeShell
              title={t("knockout.phases.losersBracket")}
              subtitle={formatPercent(pLosersLane)}
              meta={t("analysis.knockout.flowGraphBracketMeta", {
                runs: row.losersEntries.toLocaleString(),
              })}
              accentHex={amber}
              emphasize={!winnersPrimary}
            />
            <FlowEdge
              label={formatPercent(row.losersToFinalRate)}
              sublabel={t("analysis.knockout.flowGraphJoint", {
                rate: formatPercent(pFinalViaLosers),
              })}
              accentHex={amber}
              thick={!winnersPrimary && row.losersEntries > 0}
            />
          </div>
        </div>

        <FlowEdge
          label={t("analysis.knockout.flowGraphMerge")}
          sublabel={formatPercent(pFinals)}
          accentHex={violet}
          thick
        />

        <GraphNodeShell
          title={t("knockout.phases.finals")}
          subtitle={formatPercent(pFinals)}
          meta={t("analysis.knockout.flowGraphFinalMeta", {
            runs: row.finalsEntries.toLocaleString(),
          })}
          accentHex={violet}
          emphasize
        >
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/80 px-2 py-2 ring-1 ring-slate-200 dark:bg-slate-900/50 dark:ring-slate-700">
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                {t("analysis.knockout.flowGraphFromWinners")}
              </p>
              <p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-slate-50">
                {formatPercent(pFinalViaWinners)}
              </p>
            </div>
            <div className="rounded-xl bg-white/80 px-2 py-2 ring-1 ring-slate-200 dark:bg-slate-900/50 dark:ring-slate-700">
              <p className="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                {t("analysis.knockout.flowGraphFromLosers")}
              </p>
              <p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-slate-50">
                {formatPercent(pFinalViaLosers)}
              </p>
            </div>
          </div>
        </GraphNodeShell>

        <FlowEdge
          label={formatPercent(row.finalistToChampionRate)}
          sublabel={t("analysis.knockout.flowGraphConditionalFinalToTitle")}
          accentHex={row.accentHex}
          thick
        />

        <GraphNodeShell
          title={t("analysis.knockout.flowGraphChampion")}
          subtitle={formatPercent(row.championshipRate)}
          meta={t("analysis.knockout.flowGraphTitlesMeta", {
            count: row.titles.toLocaleString(),
          })}
          accentHex={row.accentHex}
          emphasize
        >
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-emerald-500/10 px-2 py-2 ring-1 ring-emerald-500/25">
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-200">
                {t("analysis.knockout.flowGraphCupViaWinners")}
              </p>
              <p className="mt-1 font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-slate-50">
                {formatPercent(pTitleViaWinners)}
              </p>
            </div>
            <div className="rounded-xl bg-amber-500/10 px-2 py-2 ring-1 ring-amber-500/25">
              <p className="text-[9px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-100">
                {t("analysis.knockout.flowGraphCupViaLosers")}
              </p>
              <p className="mt-1 font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-slate-50">
                {formatPercent(pTitleViaLosers)}
              </p>
            </div>
          </div>
        </GraphNodeShell>
      </div>
    </section>
  );
}
