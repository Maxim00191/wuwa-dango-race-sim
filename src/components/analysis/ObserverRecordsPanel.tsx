import { useTranslation } from "@/i18n/useTranslation";
import { encodeMatchRecordJson } from "@/services/matchReplay";
import {
  KNOCKOUT_PHASE_SEQUENCE,
  type KnockoutPhaseId,
} from "@/services/knockout/bracket";
import { DEFAULT_OBSERVER_CRITERIA } from "@/services/observerSession";
import type { MonteCarloAggregateSnapshot } from "@/types/monteCarlo";
import type { ObserverCapturedRecord, ObserverRuleId } from "@/types/observer";
import type { MatchRecord } from "@/types/replay";

type ObserverRecordsPanelProps = {
  snapshot: MonteCarloAggregateSnapshot;
  onWatchReplayJson: (json: string) => void;
};

const OBSERVER_RULE_ORDER: ObserverRuleId[] = DEFAULT_OBSERVER_CRITERIA.map(
  (criterion) => criterion.id
);

const KNOCKOUT_REPLAY_BUTTON_BASE =
  "inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold shadow-md transition";

const KNOCKOUT_REPLAY_BUTTON_CLASSES = {
  groupA: `${KNOCKOUT_REPLAY_BUTTON_BASE} bg-sky-500 text-sky-950 shadow-sky-900/25 hover:bg-sky-400 dark:shadow-sky-950/40`,
  groupB: `${KNOCKOUT_REPLAY_BUTTON_BASE} bg-violet-500 text-violet-950 shadow-violet-900/25 hover:bg-violet-400 dark:shadow-violet-950/40`,
  winnersBracket: `${KNOCKOUT_REPLAY_BUTTON_BASE} bg-emerald-500 text-emerald-950 shadow-emerald-900/25 hover:bg-emerald-400 dark:shadow-emerald-950/40`,
  losersBracket: `${KNOCKOUT_REPLAY_BUTTON_BASE} bg-amber-500 text-amber-950 shadow-amber-900/25 hover:bg-amber-400 dark:shadow-amber-950/40`,
  finals: `${KNOCKOUT_REPLAY_BUTTON_BASE} bg-rose-500 text-rose-950 shadow-rose-900/25 hover:bg-rose-400 dark:shadow-rose-950/40`,
} satisfies Record<KnockoutPhaseId, string>;

function ruleTitleKey(ruleId: ObserverRuleId): string {
  return `analysis.observer.ruleTitles.${ruleId}`;
}

function RecordCard({
  title,
  record,
  snapshot,
  onWatchReplayJson,
}: {
  title: string;
  record: ObserverCapturedRecord;
  snapshot: MonteCarloAggregateSnapshot;
  onWatchReplayJson: (json: string) => void;
}) {
  const { getCharacterName, t } = useTranslation();
  const winnerLabel = record.winnerBasicId
    ? getCharacterName(record.winnerBasicId)
    : t("analysis.observer.unknownChampion");
  const prelimWinnerLabel =
    record.preliminaryWinnerBasicId &&
    snapshot.scenarioKind === "tournament"
      ? getCharacterName(record.preliminaryWinnerBasicId)
      : null;
  const launch = (payload: MatchRecord) => {
    onWatchReplayJson(encodeMatchRecordJson(payload));
  };
  const replay = record.replay;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-inner shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-slate-950/40 sm:p-6">
      <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {title}
      </h3>
      <dl className="mt-4 grid gap-3 text-sm text-slate-700 dark:text-slate-200 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("analysis.observer.totalEngineTurns")}
          </dt>
          <dd className="mt-1 font-mono text-base font-semibold text-slate-900 dark:text-slate-50">
            {record.turnsAtFinish}
          </dd>
        </div>
        {snapshot.scenarioKind === "tournament" ? (
          <>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("analysis.observer.preliminaryTurns")}
              </dt>
              <dd className="mt-1 font-mono text-base font-semibold text-slate-900 dark:text-slate-50">
                {record.preliminaryTurnsAtFinish}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("analysis.observer.finalTurns")}
              </dt>
              <dd className="mt-1 font-mono text-base font-semibold text-slate-900 dark:text-slate-50">
                {record.finalTurnsAtFinish}
              </dd>
            </div>
          </>
        ) : null}
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("analysis.observer.champion")}
          </dt>
          <dd className="mt-1 font-medium text-slate-900 dark:text-slate-50">
            {winnerLabel}
          </dd>
        </div>
        {prelimWinnerLabel ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t("analysis.observer.preliminaryChampion")}
            </dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-50">
              {prelimWinnerLabel}
            </dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        {replay.kind === "single" ? (
          <button
            type="button"
            onClick={() => launch(replay.record)}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-violet-500 px-5 py-2 text-sm font-semibold text-violet-950 shadow-md shadow-violet-900/25 transition hover:bg-violet-400 dark:shadow-violet-950/40"
          >
            {t("analysis.observer.watchReplay")}
          </button>
        ) : replay.kind === "tournamentPair" ? (
          <>
            <button
              type="button"
              onClick={() => launch(replay.preliminary)}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-violet-500 px-5 py-2 text-sm font-semibold text-violet-950 shadow-md shadow-violet-900/25 transition hover:bg-violet-400 dark:shadow-violet-950/40"
            >
              {t("analysis.observer.watchPreliminaryReplay")}
            </button>
            <button
              type="button"
              onClick={() => launch(replay.final)}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-950 shadow-md shadow-emerald-900/25 transition hover:bg-emerald-400 dark:shadow-emerald-950/40"
            >
              {t("analysis.observer.watchFinalReplay")}
            </button>
          </>
        ) : replay.kind === "knockoutSeries" ? (
          KNOCKOUT_PHASE_SEQUENCE.flatMap((phaseId) => {
            const payload = replay.phases[phaseId];
            if (!payload) {
              return [];
            }
            return [
              <button
                key={phaseId}
                type="button"
                onClick={() => launch(payload)}
                className={KNOCKOUT_REPLAY_BUTTON_CLASSES[phaseId]}
              >
                {t(`analysis.observer.knockoutPhaseReplay.${phaseId}`)}
              </button>,
            ];
          })
        ) : null}
      </div>
    </div>
  );
}

export function ObserverRecordsPanel({
  snapshot,
  onWatchReplayJson,
}: ObserverRecordsPanelProps) {
  const { t } = useTranslation();
  const records = snapshot.observerRecords;
  const orderedEntries = OBSERVER_RULE_ORDER.flatMap((ruleId) => {
    const entry = records?.[ruleId];
    return entry ? [{ ruleId, entry }] : [];
  });
  if (orderedEntries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center dark:border-slate-700 dark:bg-slate-950/40">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {t("analysis.observer.empty")}
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
        {t("analysis.observer.intro")}
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        {orderedEntries.map(({ ruleId, entry }) => (
          <RecordCard
            key={ruleId}
            title={t(ruleTitleKey(ruleId))}
            record={entry}
            snapshot={snapshot}
            onWatchReplayJson={onWatchReplayJson}
          />
        ))}
      </div>
    </div>
  );
}
