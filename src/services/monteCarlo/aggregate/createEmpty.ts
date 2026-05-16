import {
  createBasicAnalyticsRecord,
  createBasicMetricTotalsRecord,
  createConditionalPlacementRecord,
  createContextAnalyticsRecords,
  createContextBasicMetricTotalsRecords,
  createContextNumberRecords,
  createContextPlacementRecords,
  createModeAnalytics,
  createNumberRecord,
  createRaceCountByContext,
  createRaceCountByMode,
} from "@/services/monteCarlo/aggregate/builders";
import {
  createPlacementRecord,
  createPlacementVector,
  createTransitionMatrixRecord,
} from "@/services/monteCarlo/aggregate/placement";
import type { LocalizedText } from "@/i18n";
import type { DangoId } from "@/types/game";
import type {
  MonteCarloAggregateSnapshot,
  MonteCarloScenarioKind,
} from "@/types/monteCarlo";

export function createEmptyMonteCarloAggregate(
  selectedBasicIds: DangoId[],
  scenarioKind: MonteCarloScenarioKind,
  scenarioLabel: LocalizedText
): MonteCarloAggregateSnapshot {
  const participantCount = selectedBasicIds.length;
  return {
    totalRuns: 0,
    selectedBasicIds: [...selectedBasicIds],
    participantCount,
    scenarioKind,
    scenarioLabel,
    winsByBasicId: createNumberRecord(selectedBasicIds),
    preliminaryWinsByBasicId: createNumberRecord(selectedBasicIds),
    finalPlacementCountsByBasicId: createPlacementRecord(
      selectedBasicIds,
      participantCount
    ),
    preliminaryPlacementCountsByBasicId: createPlacementRecord(
      selectedBasicIds,
      participantCount
    ),
    conditionalPlacementCountsByWinnerId: createConditionalPlacementRecord(
      selectedBasicIds,
      participantCount
    ),
    raceCountByMode: createRaceCountByMode(),
    startingToFinalCountsByBasicId: createTransitionMatrixRecord(
      selectedBasicIds,
      participantCount
    ),
    preliminaryToFinalCountsByBasicId: createTransitionMatrixRecord(
      selectedBasicIds,
      participantCount
    ),
    sumTurns: 0,
    sumPreliminaryTurns: 0,
    sumFinalTurns: 0,
    minTurns: Number.POSITIVE_INFINITY,
    maxTurns: 0,
    preliminaryWinnerFinalPlacementCounts: createPlacementVector(participantCount),
    basicMetricTotalsByBasicId: createBasicMetricTotalsRecord(selectedBasicIds),
    startedFinalWithMaxDebtCountByBasicId: createNumberRecord(selectedBasicIds),
    wonFinalFromMaxDebtCountByBasicId: createNumberRecord(selectedBasicIds),
    basicAnalyticsByBasicId: createBasicAnalyticsRecord(selectedBasicIds),
    raceCountByContext: createRaceCountByContext(),
    winsByContext: createContextNumberRecords(selectedBasicIds),
    placementCountsByContext: createContextPlacementRecords(
      selectedBasicIds,
      participantCount
    ),
    basicMetricTotalsByContext:
      createContextBasicMetricTotalsRecords(selectedBasicIds),
    basicAnalyticsByContext: createContextAnalyticsRecords(
      selectedBasicIds,
      participantCount
    ),
    tournamentRankShiftSumByBasicId: createNumberRecord(selectedBasicIds),
    tournamentRankShiftCountByBasicId: createNumberRecord(selectedBasicIds),
    tournamentChokeOpportunityCountByBasicId: createNumberRecord(selectedBasicIds),
    tournamentChokeCountByBasicId: createNumberRecord(selectedBasicIds),
    tournamentClutchOpportunityCountByBasicId: createNumberRecord(selectedBasicIds),
    tournamentClutchCountByBasicId: createNumberRecord(selectedBasicIds),
    knockoutGroupEntryCountByBasicId: createNumberRecord(selectedBasicIds),
    knockoutWinnersBracketEntryCountByBasicId: createNumberRecord(selectedBasicIds),
    knockoutLosersBracketEntryCountByBasicId: createNumberRecord(selectedBasicIds),
    knockoutFinalsEntryCountByBasicId: createNumberRecord(selectedBasicIds),
    knockoutWinnersBracketToFinalCountByBasicId:
      createNumberRecord(selectedBasicIds),
    knockoutLosersBracketToFinalCountByBasicId:
      createNumberRecord(selectedBasicIds),
    knockoutWinnersBracketChampionCountByBasicId:
      createNumberRecord(selectedBasicIds),
    knockoutLosersBracketChampionCountByBasicId:
      createNumberRecord(selectedBasicIds),
    modeAnalytics: createModeAnalytics(
      scenarioKind,
      selectedBasicIds,
      participantCount
    ),
  };
}
