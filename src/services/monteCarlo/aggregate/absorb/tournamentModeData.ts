import { absorbTransitionCounts } from "@/services/monteCarlo/aggregate/absorb/transition";
import { createPlacementIndexByBasicId } from "@/services/monteCarlo/aggregate/placement";
import type { HeadlessSimulationOutcome, MonteCarloAggregateSnapshot } from "@/types/monteCarlo";

export function absorbTournamentModeData(
  aggregate: MonteCarloAggregateSnapshot,
  outcome: HeadlessSimulationOutcome
): void {
  if (outcome.modeMetrics.kind !== "tournament") {
    return;
  }
  absorbTransitionCounts(
    aggregate,
    aggregate.preliminaryToFinalCountsByBasicId,
    outcome.modeMetrics.preliminaryPlacementByBasicId,
    outcome.finalPlacements
  );
  const preliminaryPlacementIndexByBasicId =
    outcome.modeMetrics.preliminaryPlacementByBasicId;
  const finalPlacementIndexByBasicId = createPlacementIndexByBasicId(
    outcome.finalPlacements
  );
  const bottomTwoStart = Math.max(aggregate.participantCount - 2, 0);
  for (const basicId of aggregate.selectedBasicIds) {
    const preliminaryPlacementIndex = preliminaryPlacementIndexByBasicId[basicId];
    const finalPlacementIndex = finalPlacementIndexByBasicId[basicId];
    if (
      preliminaryPlacementIndex === undefined ||
      finalPlacementIndex === undefined
    ) {
      continue;
    }
    aggregate.tournamentRankShiftSumByBasicId[basicId] =
      (aggregate.tournamentRankShiftSumByBasicId[basicId] ?? 0) +
      finalPlacementIndex -
      preliminaryPlacementIndex;
    aggregate.tournamentRankShiftCountByBasicId[basicId] =
      (aggregate.tournamentRankShiftCountByBasicId[basicId] ?? 0) + 1;
    if (preliminaryPlacementIndex <= 1) {
      aggregate.tournamentChokeOpportunityCountByBasicId[basicId] =
        (aggregate.tournamentChokeOpportunityCountByBasicId[basicId] ?? 0) + 1;
      if (finalPlacementIndex >= bottomTwoStart) {
        aggregate.tournamentChokeCountByBasicId[basicId] =
          (aggregate.tournamentChokeCountByBasicId[basicId] ?? 0) + 1;
      }
    }
    if (preliminaryPlacementIndex >= bottomTwoStart) {
      aggregate.tournamentClutchOpportunityCountByBasicId[basicId] =
        (aggregate.tournamentClutchOpportunityCountByBasicId[basicId] ?? 0) + 1;
      if (finalPlacementIndex <= 2) {
        aggregate.tournamentClutchCountByBasicId[basicId] =
          (aggregate.tournamentClutchCountByBasicId[basicId] ?? 0) + 1;
      }
    }
  }
  const preliminaryWinnerId =
    outcome.preliminaryWinnerBasicId ?? outcome.preliminaryPlacements?.[0] ?? null;
  const preliminaryWinnerFinalPlacement =
    preliminaryWinnerId === null
      ? undefined
      : finalPlacementIndexByBasicId[preliminaryWinnerId];
  if (
    preliminaryWinnerFinalPlacement !== undefined &&
    preliminaryWinnerFinalPlacement >= 0 &&
    preliminaryWinnerFinalPlacement <
      aggregate.preliminaryWinnerFinalPlacementCounts.length
  ) {
    aggregate.preliminaryWinnerFinalPlacementCounts[
      preliminaryWinnerFinalPlacement
    ] += 1;
  }
}
