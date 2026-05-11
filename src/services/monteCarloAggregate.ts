import type { HeadlessSimulationOutcome } from "@/services/gameEngine";
import type { DangoId } from "@/types/game";
import type {
  MonteCarloAggregateSnapshot,
  MonteCarloScenarioKind,
} from "@/types/monteCarlo";

export function createEmptyMonteCarloAggregate(
  selectedBasicIds: DangoId[],
  scenarioKind: MonteCarloScenarioKind,
  scenarioLabel: string
): MonteCarloAggregateSnapshot {
  return {
    totalRuns: 0,
    selectedBasicIds: [...selectedBasicIds],
    scenarioKind,
    scenarioLabel,
    winsByBasicId: {},
    preliminaryWinsByBasicId: {},
    sumTurns: 0,
    sumPreliminaryTurns: 0,
    sumFinalTurns: 0,
    minTurns: Number.POSITIVE_INFINITY,
    maxTurns: 0,
    stackCarrierObservationSumByBasicId: {},
  };
}

export function absorbHeadlessOutcomeIntoAggregate(
  aggregate: MonteCarloAggregateSnapshot,
  outcome: HeadlessSimulationOutcome
): void {
  aggregate.totalRuns += 1;
  if (outcome.winnerBasicId) {
    aggregate.winsByBasicId[outcome.winnerBasicId] =
      (aggregate.winsByBasicId[outcome.winnerBasicId] ?? 0) + 1;
  }
  if (outcome.preliminaryWinnerBasicId) {
    aggregate.preliminaryWinsByBasicId[outcome.preliminaryWinnerBasicId] =
      (aggregate.preliminaryWinsByBasicId[outcome.preliminaryWinnerBasicId] ??
        0) + 1;
  }
  aggregate.sumTurns += outcome.turnsAtFinish;
  aggregate.sumPreliminaryTurns += outcome.preliminaryTurnsAtFinish;
  aggregate.sumFinalTurns += outcome.finalTurnsAtFinish;
  aggregate.minTurns = Math.min(aggregate.minTurns, outcome.turnsAtFinish);
  aggregate.maxTurns = Math.max(aggregate.maxTurns, outcome.turnsAtFinish);
  for (const [basicId, observationCount] of Object.entries(
    outcome.stackCarrierObservationCountByBasicId
  )) {
    aggregate.stackCarrierObservationSumByBasicId[basicId] =
      (aggregate.stackCarrierObservationSumByBasicId[basicId] ?? 0) +
      observationCount;
  }
}
