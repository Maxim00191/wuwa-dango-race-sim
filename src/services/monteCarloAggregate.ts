import type { HeadlessSimulationOutcome } from "@/services/gameEngine";
import type { DangoId } from "@/types/game";
import type { MonteCarloAggregateSnapshot } from "@/types/monteCarlo";

export function createEmptyMonteCarloAggregate(
  selectedBasicIds: DangoId[]
): MonteCarloAggregateSnapshot {
  return {
    totalRuns: 0,
    selectedBasicIds: [...selectedBasicIds],
    winsByBasicId: {},
    sumTurns: 0,
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
  aggregate.sumTurns += outcome.turnsAtFinish;
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
