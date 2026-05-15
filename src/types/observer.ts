import type { KnockoutPhaseId } from "@/services/knockout/bracket";
import type { DangoId } from "@/types/game";
import type { HeadlessSimulationOutcome } from "@/types/monteCarlo";
import type { MatchRecord } from "@/types/replay";

export type ObserverRuleId = "shortestMatch" | "longestMatch";

export type ObserverMetricPolarity = "lowerWins" | "higherWins";

export type ObserverReplayPayload =
  | { kind: "single"; record: MatchRecord }
  | {
      kind: "tournamentPair";
      preliminary: MatchRecord;
      final: MatchRecord;
    }
  | {
      kind: "knockoutSeries";
      phases: Partial<Record<KnockoutPhaseId, MatchRecord>>;
    };

export type ObserverCapturedRecord = {
  metric: number;
  turnsAtFinish: number;
  preliminaryTurnsAtFinish: number;
  finalTurnsAtFinish: number;
  winnerBasicId: DangoId | null;
  preliminaryWinnerBasicId: DangoId | null;
  replay: ObserverReplayPayload;
};

export type MonteCarloObserverRecords = Partial<
  Record<ObserverRuleId, ObserverCapturedRecord>
>;

export type ObserverCriterion = {
  readonly id: ObserverRuleId;
  readonly polarity: ObserverMetricPolarity;
  readonly extractMetric: (outcome: HeadlessSimulationOutcome) => number;
};
