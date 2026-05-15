import type {
  HeadlessCapturedMatchReplay,
  HeadlessSimulationOutcome,
} from "@/types/monteCarlo";
import type {
  MonteCarloObserverRecords,
  ObserverCapturedRecord,
  ObserverCriterion,
  ObserverReplayPayload,
  ObserverRuleId,
} from "@/types/observer";

export type ObserverSession = {
  champions: Partial<Record<ObserverRuleId, ObserverCapturedRecord>>;
};

export const DEFAULT_OBSERVER_CRITERIA: readonly ObserverCriterion[] = [
  {
    id: "shortestMatch",
    polarity: "lowerWins",
    extractMetric: (outcome) => outcome.turnsAtFinish,
  },
  {
    id: "longestMatch",
    polarity: "higherWins",
    extractMetric: (outcome) => outcome.turnsAtFinish,
  },
];

export function createObserverSession(): ObserverSession {
  return { champions: {} };
}

function headlessCapturedReplayToObserverPayload(
  captured: HeadlessCapturedMatchReplay
): ObserverReplayPayload {
  if (captured.scenarioKind === "singleRace") {
    return { kind: "single", record: captured.record };
  }
  if (captured.scenarioKind === "knockoutTournament") {
    return { kind: "knockoutSeries", phases: captured.phases };
  }
  return {
    kind: "tournamentPair",
    preliminary: captured.preliminary,
    final: captured.final,
  };
}

function isBetterChampion(
  polarity: ObserverCriterion["polarity"],
  candidate: number,
  incumbent: number
): boolean {
  if (polarity === "lowerWins") {
    return candidate < incumbent;
  }
  return candidate > incumbent;
}

export function observeCompletedMatch(
  session: ObserverSession,
  outcome: HeadlessSimulationOutcome,
  replayOutcomeFactory?: () => HeadlessSimulationOutcome,
  criteria: readonly ObserverCriterion[] = DEFAULT_OBSERVER_CRITERIA
): void {
  let replayOutcome = outcome.capturedReplay ? outcome : null;
  for (const rule of criteria) {
    const metric = rule.extractMetric(outcome);
    const incumbent = session.champions[rule.id];
    if (
      incumbent !== undefined &&
      !isBetterChampion(rule.polarity, metric, incumbent.metric)
    ) {
      continue;
    }
    replayOutcome ??= replayOutcomeFactory?.() ?? null;
    const capturedReplay = replayOutcome?.capturedReplay;
    if (!capturedReplay) {
      continue;
    }
    session.champions[rule.id] = {
      metric,
      turnsAtFinish: outcome.turnsAtFinish,
      preliminaryTurnsAtFinish: outcome.preliminaryTurnsAtFinish,
      finalTurnsAtFinish: outcome.finalTurnsAtFinish,
      winnerBasicId: outcome.winnerBasicId,
      preliminaryWinnerBasicId: outcome.preliminaryWinnerBasicId,
      replay: headlessCapturedReplayToObserverPayload(capturedReplay),
    };
  }
}

export function finalizeObserverRecords(
  session: ObserverSession
): MonteCarloObserverRecords {
  return { ...session.champions };
}

export function absorbObserverRecordsIntoSession(
  session: ObserverSession,
  records: MonteCarloObserverRecords,
  criteria: readonly ObserverCriterion[] = DEFAULT_OBSERVER_CRITERIA
): void {
  const criterionById = new Map(criteria.map((criterion) => [criterion.id, criterion]));
  for (const [ruleId, record] of Object.entries(records) as [
    ObserverRuleId,
    ObserverCapturedRecord | undefined,
  ][]) {
    if (!record) {
      continue;
    }
    const rule = criterionById.get(ruleId);
    if (!rule) {
      continue;
    }
    const incumbent = session.champions[ruleId];
    if (
      incumbent !== undefined &&
      !isBetterChampion(rule.polarity, record.metric, incumbent.metric)
    ) {
      continue;
    }
    session.champions[ruleId] = record;
  }
}
