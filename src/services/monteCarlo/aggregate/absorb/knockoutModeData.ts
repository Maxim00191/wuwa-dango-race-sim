import { absorbTransitionCounts } from "@/services/monteCarlo/aggregate/absorb/transition";
import type { HeadlessSimulationOutcome, MonteCarloAggregateSnapshot } from "@/types/monteCarlo";

export function absorbKnockoutModeData(
  aggregate: MonteCarloAggregateSnapshot,
  outcome: HeadlessSimulationOutcome
): void {
  if (outcome.modeMetrics.kind !== "knockout") {
    return;
  }
  absorbTransitionCounts(
    aggregate,
    aggregate.preliminaryToFinalCountsByBasicId,
    outcome.modeMetrics.groupPlacementByBasicId,
    outcome.finalPlacements
  );
  absorbTransitionCounts(
    aggregate,
    aggregate.startingToFinalCountsByBasicId,
    outcome.modeMetrics.bracketPlacementByBasicId,
    outcome.finalPlacements
  );
  for (const basicId of aggregate.selectedBasicIds) {
    if (outcome.modeMetrics.groupPlacementByBasicId[basicId] !== undefined) {
      aggregate.knockoutGroupEntryCountByBasicId[basicId] =
        (aggregate.knockoutGroupEntryCountByBasicId[basicId] ?? 0) + 1;
    }
    const lane = outcome.modeMetrics.bracketLaneByBasicId[basicId];
    const reachedFinals =
      outcome.modeMetrics.reachedFinalsByBasicId[basicId] === true;
    const champion = outcome.winnerBasicId === basicId;
    if (lane === "winnersBracket") {
      aggregate.knockoutWinnersBracketEntryCountByBasicId[basicId] =
        (aggregate.knockoutWinnersBracketEntryCountByBasicId[basicId] ?? 0) + 1;
      if (reachedFinals) {
        aggregate.knockoutWinnersBracketToFinalCountByBasicId[basicId] =
          (aggregate.knockoutWinnersBracketToFinalCountByBasicId[basicId] ?? 0) +
          1;
      }
      if (champion) {
        aggregate.knockoutWinnersBracketChampionCountByBasicId[basicId] =
          (aggregate.knockoutWinnersBracketChampionCountByBasicId[basicId] ?? 0) +
          1;
      }
    }
    if (lane === "losersBracket") {
      aggregate.knockoutLosersBracketEntryCountByBasicId[basicId] =
        (aggregate.knockoutLosersBracketEntryCountByBasicId[basicId] ?? 0) + 1;
      if (reachedFinals) {
        aggregate.knockoutLosersBracketToFinalCountByBasicId[basicId] =
          (aggregate.knockoutLosersBracketToFinalCountByBasicId[basicId] ?? 0) + 1;
      }
      if (champion) {
        aggregate.knockoutLosersBracketChampionCountByBasicId[basicId] =
          (aggregate.knockoutLosersBracketChampionCountByBasicId[basicId] ?? 0) + 1;
      }
    }
    if (reachedFinals) {
      aggregate.knockoutFinalsEntryCountByBasicId[basicId] =
        (aggregate.knockoutFinalsEntryCountByBasicId[basicId] ?? 0) + 1;
    }
  }
}
