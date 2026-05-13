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
  criteria: readonly ObserverCriterion[] = DEFAULT_OBSERVER_CRITERIA
): void {
  const replay = headlessCapturedReplayToObserverPayload(outcome.capturedReplay);
  for (const rule of criteria) {
    const metric = rule.extractMetric(outcome);
    const incumbent = session.champions[rule.id];
    if (
      incumbent !== undefined &&
      !isBetterChampion(rule.polarity, metric, incumbent.metric)
    ) {
      continue;
    }
    session.champions[rule.id] = {
      metric,
      turnsAtFinish: outcome.turnsAtFinish,
      preliminaryTurnsAtFinish: outcome.preliminaryTurnsAtFinish,
      finalTurnsAtFinish: outcome.finalTurnsAtFinish,
      winnerBasicId: outcome.winnerBasicId,
      preliminaryWinnerBasicId: outcome.preliminaryWinnerBasicId,
      replay,
    };
  }
}

export function finalizeObserverRecords(
  session: ObserverSession
): MonteCarloObserverRecords {
  return { ...session.champions };
}
