import { absorbKnockoutModeData } from "@/services/monteCarlo/aggregate/absorb/knockoutModeData";
import {
  absorbPerRaceContextMetrics,
  absorbScenarioLevelCorrelations,
} from "@/services/monteCarlo/aggregate/absorb/raceMetrics";
import { absorbTournamentModeData } from "@/services/monteCarlo/aggregate/absorb/tournamentModeData";
import { absorbTransitionCounts } from "@/services/monteCarlo/aggregate/absorb/transition";
import { absorbPlacementsIntoCounts } from "@/services/monteCarlo/aggregate/placement";
import type { HeadlessSimulationOutcome, MonteCarloAggregateSnapshot } from "@/types/monteCarlo";

export function absorbHeadlessOutcomeIntoAggregate(
  aggregate: MonteCarloAggregateSnapshot,
  outcome: HeadlessSimulationOutcome
): void {
  aggregate.totalRuns += 1;
  absorbPlacementsIntoCounts(
    outcome.finalPlacements,
    aggregate.finalPlacementCountsByBasicId
  );
  if (outcome.winnerBasicId) {
    aggregate.winsByBasicId[outcome.winnerBasicId] =
      (aggregate.winsByBasicId[outcome.winnerBasicId] ?? 0) + 1;
    const conditionalPlacementSnapshot =
      aggregate.conditionalPlacementCountsByWinnerId[outcome.winnerBasicId];
    if (conditionalPlacementSnapshot) {
      conditionalPlacementSnapshot.sampleSize += 1;
      absorbPlacementsIntoCounts(
        outcome.finalPlacements,
        conditionalPlacementSnapshot.placementCountsByBasicId
      );
    }
  }
  if (outcome.preliminaryPlacements) {
    absorbPlacementsIntoCounts(
      outcome.preliminaryPlacements,
      aggregate.preliminaryPlacementCountsByBasicId
    );
  }
  if (outcome.preliminaryWinnerBasicId) {
    aggregate.preliminaryWinsByBasicId[outcome.preliminaryWinnerBasicId] =
      (aggregate.preliminaryWinsByBasicId[outcome.preliminaryWinnerBasicId] ??
        0) + 1;
  }
  if ("finalStartingPlacementByBasicId" in outcome.modeMetrics) {
    absorbTransitionCounts(
      aggregate,
      aggregate.startingToFinalCountsByBasicId,
      outcome.modeMetrics.finalStartingPlacementByBasicId,
      outcome.finalPlacements
    );
  }
  absorbKnockoutModeData(aggregate, outcome);
  absorbTournamentModeData(aggregate, outcome);
  absorbPerRaceContextMetrics(aggregate, outcome);
  if (outcome.knockoutPhases) {
    for (const phaseResult of outcome.knockoutPhases) {
      if (phaseResult.phase === "groupA" || phaseResult.phase === "groupB") {
        absorbPlacementsIntoCounts(
          phaseResult.placements,
          aggregate.preliminaryPlacementCountsByBasicId
        );
      }
    }
  }
  absorbScenarioLevelCorrelations(aggregate, outcome);
  for (const basicId of outcome.raceMetrics.final.startedWithMaxProgressDebtBasicIds) {
    aggregate.startedFinalWithMaxDebtCountByBasicId[basicId] =
      (aggregate.startedFinalWithMaxDebtCountByBasicId[basicId] ?? 0) + 1;
    if (outcome.winnerBasicId === basicId) {
      aggregate.wonFinalFromMaxDebtCountByBasicId[basicId] =
        (aggregate.wonFinalFromMaxDebtCountByBasicId[basicId] ?? 0) + 1;
    }
  }
  aggregate.sumTurns += outcome.turnsAtFinish;
  aggregate.sumPreliminaryTurns += outcome.preliminaryTurnsAtFinish;
  aggregate.sumFinalTurns += outcome.finalTurnsAtFinish;
  aggregate.minTurns = Math.min(aggregate.minTurns, outcome.turnsAtFinish);
  aggregate.maxTurns = Math.max(aggregate.maxTurns, outcome.turnsAtFinish);
}
