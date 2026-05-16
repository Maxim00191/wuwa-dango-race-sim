import { RACE_CONTEXTS } from "@/services/monteCarlo/config/domainCatalog";
import {
  CELL_EFFECT_KEYS,
  STACK_ROLE_KEYS,
  createNumberRecord,
} from "@/services/monteCarlo/aggregate/builders";
import {
  meanPlacementFromCounts,
  sumCounts,
  toPercent,
  toRatio,
} from "@/services/monteCarlo/aggregate/math";
import { createPlacementMatrix } from "@/services/monteCarlo/aggregate/placement";
import type { RaceMode } from "@/types/game";
import type {
  CellEffectTriggerCounts,
  MonteCarloAggregateSnapshot,
  MonteCarloBasicAnalytics,
  MonteCarloBasicMetricTotals,
  MonteCarloContextAnalytics,
  MonteCarloKnockoutTransitionCounts,
  MonteCarloModeAnalytics,
  MonteCarloRaceContext,
  MonteCarloRankShiftDynamics,
  MonteCarloSeedDynamics,
  PlacementCountMatrix,
  SkillActivationAggregateTotals,
  StackRoleObservationCounts,
} from "@/types/monteCarlo";

function finalizeSkillTimingSummary(
  skillTotals: SkillActivationAggregateTotals,
  raceCount: number
) {
  let bestActivationTurn: number | null = null;
  let bestActivationTurnTitleConversionRate = 0;
  let bestSampleSize = 0;
  const titleConversionRateByActivationTurn: Record<string, number> = {};
  const averagePlacementByActivationTurn: Record<string, number | null> = {};
  for (const [turnKey, placementCounts] of Object.entries(
    skillTotals.placementCountsByActivationTurn
  )) {
    const sampleSize = sumCounts(placementCounts);
    const titleConversionRate = toPercent(
      placementCounts[0] ?? 0,
      sampleSize
    );
    titleConversionRateByActivationTurn[turnKey] = titleConversionRate;
    averagePlacementByActivationTurn[turnKey] =
      meanPlacementFromCounts(placementCounts);
    const activationTurn = Number(turnKey);
    if (!Number.isFinite(activationTurn) || sampleSize <= 0) {
      continue;
    }
    if (
      bestActivationTurn === null ||
      titleConversionRate > bestActivationTurnTitleConversionRate ||
      (titleConversionRate === bestActivationTurnTitleConversionRate &&
        sampleSize > bestSampleSize) ||
      (titleConversionRate === bestActivationTurnTitleConversionRate &&
        sampleSize === bestSampleSize &&
        activationTurn < bestActivationTurn)
    ) {
      bestActivationTurn = activationTurn;
      bestActivationTurnTitleConversionRate = titleConversionRate;
      bestSampleSize = sampleSize;
    }
  }
  return {
    activationCount: skillTotals.activationCount,
    activationRate: toPercent(skillTotals.activationCount, raceCount),
    averageActivationTurn:
      skillTotals.activationCount > 0
        ? skillTotals.activationTurnSum / skillTotals.activationCount
        : null,
    titleConversionRate: toPercent(
      skillTotals.activationWinCount,
      skillTotals.activationCount
    ),
    averageWinningActivationTurn:
      skillTotals.activationWinCount > 0
        ? skillTotals.winningActivationTurnSum / skillTotals.activationWinCount
        : null,
    bestActivationTurn,
    bestActivationTurnTitleConversionRate:
      bestActivationTurn === null ? 0 : bestActivationTurnTitleConversionRate,
    titleConversionRateByActivationTurn,
    averagePlacementByActivationTurn,
    placementCountsByActivationTurn: skillTotals.placementCountsByActivationTurn,
  };
}

function finalizeBasicAnalyticsById(
  aggregate: MonteCarloAggregateSnapshot,
  totalsByBasicId: Record<string, MonteCarloBasicMetricTotals> =
    aggregate.basicMetricTotalsByBasicId,
  raceCount = aggregate.totalRuns,
  winsByBasicId: Record<string, number> = aggregate.winsByBasicId,
  raceCountByMode: Partial<Record<RaceMode, number>> = aggregate.raceCountByMode
): Record<string, MonteCarloBasicAnalytics> {
  return Object.fromEntries(
    aggregate.selectedBasicIds.map((basicId) => {
      const totals = totalsByBasicId[basicId];
      const totalProgress =
        totals.ownTurnProgressSum + totals.passiveProgressSum;
      const totalWins = winsByBasicId[basicId] ?? 0;
      const roleObservationTotal = sumCounts(
        STACK_ROLE_KEYS.map((roleKey) => totals.roleObservationSums[roleKey])
      );
      const carriedObservationTotal =
        totals.roleObservationSums.passenger + totals.roleObservationSums.crown;
      const skillTimingByMode = Object.fromEntries(
        Object.entries(totals.oncePerRaceSkillTotalsByMode).map(
          ([mode, skillTotalsByKey]) => [
            mode,
            Object.fromEntries(
              Object.entries(skillTotalsByKey ?? {}).map(
                ([skillKey, skillTotals]) => [
                  skillKey,
                  finalizeSkillTimingSummary(
                    skillTotals,
                    raceCountByMode[mode as RaceMode] ?? 0
                  ),
                ]
              )
            ),
          ]
        )
      ) as MonteCarloBasicAnalytics["skillTimingByMode"];
      return [
        basicId,
        {
          progressTopography: {
            averageOwnTurnProgress:
              raceCount > 0
                ? totals.ownTurnProgressSum / raceCount
                : 0,
            averagePassiveProgress:
              raceCount > 0
                ? totals.passiveProgressSum / raceCount
                : 0,
            averageCarriedProgress:
              raceCount > 0
                ? totals.carriedProgressSum / raceCount
                : 0,
            averageTotalProgress:
              raceCount > 0 ? totalProgress / raceCount : 0,
            averageOwnTurnProgressPerTurn:
              totals.activeTurnCountSum > 0
                ? totals.ownTurnProgressSum / totals.activeTurnCountSum
                : 0,
            averagePassiveProgressPerCarriedTurn:
              carriedObservationTotal > 0
                ? totals.passiveProgressSum / carriedObservationTotal
                : 0,
            averageCarriedProgressPerRideTurn:
              totals.passengerRideTurnCountSum > 0
                ? totals.carriedProgressSum / totals.passengerRideTurnCountSum
                : 0,
            passiveProgressShare: toPercent(
              totals.passiveProgressSum,
              totalProgress
            ),
            carriedProgressShare: toPercent(
              totals.carriedProgressSum,
              totalProgress
            ),
            passiveToOwnProgressRatio: toRatio(
              totals.passiveProgressSum,
              totals.ownTurnProgressSum
            ),
            carriedToOwnProgressRatio: toRatio(
              totals.carriedProgressSum,
              totals.ownTurnProgressSum
            ),
            passiveLeadRate: toPercent(
              totals.scenariosWithPassiveLeadCount,
              raceCount
            ),
            passiveLeadTitleConversionRate: toPercent(
              totals.winsWithPassiveLeadCount,
              totals.scenariosWithPassiveLeadCount
            ),
            carriedLeadRate: toPercent(
              totals.scenariosWithCarriedLeadCount,
              raceCount
            ),
            carriedLeadTitleConversionRate: toPercent(
              totals.winsWithCarriedLeadCount,
              totals.scenariosWithCarriedLeadCount
            ),
          },
          stackEcosystem: {
            roleRates: Object.fromEntries(
              STACK_ROLE_KEYS.map((roleKey) => [
                roleKey,
                toPercent(
                  totals.roleObservationSums[roleKey],
                  roleObservationTotal
                ),
              ])
            ) as StackRoleObservationCounts,
            carriedRoleRate: toPercent(
              carriedObservationTotal,
              roleObservationTotal
            ),
          },
          trapAffinity: {
            averageTriggers: Object.fromEntries(
              CELL_EFFECT_KEYS.map((effectKey) => [
                effectKey,
                raceCount > 0
                  ? totals.cellEffectTriggerSums[effectKey] / raceCount
                  : 0,
              ])
            ) as CellEffectTriggerCounts,
            triggerRates: Object.fromEntries(
              CELL_EFFECT_KEYS.map((effectKey) => [
                effectKey,
                toPercent(
                  totals.racesWithCellEffectTriggerCounts[effectKey],
                  raceCount
                ),
              ])
            ) as CellEffectTriggerCounts,
            titleConversionRates: Object.fromEntries(
              CELL_EFFECT_KEYS.map((effectKey) => [
                effectKey,
                toPercent(
                  totals.winsWithCellEffectTriggerCounts[effectKey],
                  totals.racesWithCellEffectTriggerCounts[effectKey]
                ),
              ])
            ) as CellEffectTriggerCounts,
            hindranceResilienceRate: toPercent(
              totals.winsWithCellEffectTriggerCounts.hindranceDevice,
              totals.racesWithCellEffectTriggerCounts.hindranceDevice
            ),
            highHindranceRate: toPercent(
              totals.scenariosWithHighHindranceCount,
              raceCount
            ),
            highHindranceTitleConversionRate: toPercent(
              totals.winsWithHighHindranceCount,
              totals.scenariosWithHighHindranceCount
            ),
            averageHindranceTriggersWhenWinning:
              totalWins > 0
                ? totals.hindranceTriggerCountInWinningScenarios / totalWins
                : 0,
          },
          skillTimingByMode,
        },
      ];
    })
  );
}

function buildSeedDynamics(
  aggregate: MonteCarloAggregateSnapshot,
  transitionCountsByBasicId: Record<string, PlacementCountMatrix>
): MonteCarloSeedDynamics {
  const transitionMatrix = createPlacementMatrix(aggregate.participantCount);
  for (const basicId of aggregate.selectedBasicIds) {
    const sourceMatrix = transitionCountsByBasicId[basicId] ?? [];
    for (let rowIndex = 0; rowIndex < aggregate.participantCount; rowIndex += 1) {
      const targetRow = transitionMatrix[rowIndex];
      const sourceRow = sourceMatrix[rowIndex] ?? [];
      if (!targetRow) {
        continue;
      }
      for (
        let columnIndex = 0;
        columnIndex < aggregate.participantCount;
        columnIndex += 1
      ) {
        targetRow[columnIndex] += sourceRow[columnIndex] ?? 0;
      }
    }
  }
  const titleCountsByStartingPlacement = transitionMatrix.map(
    (row) => row[0] ?? 0
  );
  const titleRatesByStartingPlacement = transitionMatrix.map((row) =>
    toPercent(row[0] ?? 0, sumCounts(row))
  );
  const averageFinalPlacementByStartingPlacement = transitionMatrix.map((row) =>
    meanPlacementFromCounts(row)
  );
  const averagePlacementDeltaByStartingPlacement =
    averageFinalPlacementByStartingPlacement.map((averagePlacement, index) =>
      averagePlacement === null ? null : averagePlacement - (index + 1)
    );
  return {
    transitionMatrix,
    titleCountsByStartingPlacement,
    titleRatesByStartingPlacement,
    averageFinalPlacementByStartingPlacement,
    averagePlacementDeltaByStartingPlacement,
  };
}

function finalizeContextAnalytics(
  aggregate: MonteCarloAggregateSnapshot
): Record<MonteCarloRaceContext, MonteCarloContextAnalytics> {
  return Object.fromEntries(
    RACE_CONTEXTS.map((context) => [
      context,
      {
        raceCount: aggregate.raceCountByContext[context],
        winsByBasicId: aggregate.winsByContext[context],
        placementCountsByBasicId: aggregate.placementCountsByContext[context],
        basicAnalyticsByBasicId: finalizeBasicAnalyticsById(
          aggregate,
          aggregate.basicMetricTotalsByContext[context],
          aggregate.raceCountByContext[context],
          aggregate.winsByContext[context],
          aggregate.raceCountByMode
        ),
      },
    ])
  ) as Record<MonteCarloRaceContext, MonteCarloContextAnalytics>;
}

function finalizeRankShiftDynamics(
  aggregate: MonteCarloAggregateSnapshot
): MonteCarloRankShiftDynamics {
  const averageFinalMinusPreliminaryRankByBasicId = Object.fromEntries(
    aggregate.selectedBasicIds.map((basicId) => {
      const count = aggregate.tournamentRankShiftCountByBasicId[basicId] ?? 0;
      const sum = aggregate.tournamentRankShiftSumByBasicId[basicId] ?? 0;
      return [basicId, count > 0 ? sum / count : null];
    })
  ) as Record<string, number | null>;
  const chokeRateByBasicId = createNumberRecord(aggregate.selectedBasicIds);
  const clutchRateByBasicId = createNumberRecord(aggregate.selectedBasicIds);
  let totalShiftSum = 0;
  let totalShiftCount = 0;
  let totalChokeOpportunities = 0;
  let totalChokes = 0;
  let totalClutchOpportunities = 0;
  let totalClutches = 0;
  for (const basicId of aggregate.selectedBasicIds) {
    const shiftCount = aggregate.tournamentRankShiftCountByBasicId[basicId] ?? 0;
    totalShiftSum += aggregate.tournamentRankShiftSumByBasicId[basicId] ?? 0;
    totalShiftCount += shiftCount;
    const chokeOpportunities =
      aggregate.tournamentChokeOpportunityCountByBasicId[basicId] ?? 0;
    const chokes = aggregate.tournamentChokeCountByBasicId[basicId] ?? 0;
    const clutchOpportunities =
      aggregate.tournamentClutchOpportunityCountByBasicId[basicId] ?? 0;
    const clutches = aggregate.tournamentClutchCountByBasicId[basicId] ?? 0;
    chokeRateByBasicId[basicId] = toPercent(chokes, chokeOpportunities);
    clutchRateByBasicId[basicId] = toPercent(clutches, clutchOpportunities);
    totalChokeOpportunities += chokeOpportunities;
    totalChokes += chokes;
    totalClutchOpportunities += clutchOpportunities;
    totalClutches += clutches;
  }
  return {
    averageFinalMinusPreliminaryRankByBasicId,
    chokeRateByBasicId,
    clutchRateByBasicId,
    chokeOpportunityCountByBasicId:
      aggregate.tournamentChokeOpportunityCountByBasicId,
    clutchOpportunityCountByBasicId:
      aggregate.tournamentClutchOpportunityCountByBasicId,
    overallAverageFinalMinusPreliminaryRank:
      totalShiftCount > 0 ? totalShiftSum / totalShiftCount : null,
    overallChokeRate: toPercent(totalChokes, totalChokeOpportunities),
    overallClutchRate: toPercent(totalClutches, totalClutchOpportunities),
  };
}

function finalizeKnockoutModeAnalytics(
  aggregate: MonteCarloAggregateSnapshot
): Extract<MonteCarloModeAnalytics, { kind: "knockout" }> {
  const transitionCounts: MonteCarloKnockoutTransitionCounts = {
    groupEntryCountByBasicId: aggregate.knockoutGroupEntryCountByBasicId,
    winnersBracketEntryCountByBasicId:
      aggregate.knockoutWinnersBracketEntryCountByBasicId,
    losersBracketEntryCountByBasicId:
      aggregate.knockoutLosersBracketEntryCountByBasicId,
    finalsEntryCountByBasicId: aggregate.knockoutFinalsEntryCountByBasicId,
    winnersBracketToFinalCountByBasicId:
      aggregate.knockoutWinnersBracketToFinalCountByBasicId,
    losersBracketToFinalCountByBasicId:
      aggregate.knockoutLosersBracketToFinalCountByBasicId,
    winnersBracketChampionCountByBasicId:
      aggregate.knockoutWinnersBracketChampionCountByBasicId,
    losersBracketChampionCountByBasicId:
      aggregate.knockoutLosersBracketChampionCountByBasicId,
  };
  const groupToWinnersBracketRateByBasicId = createNumberRecord(
    aggregate.selectedBasicIds
  );
  const groupToLosersBracketRateByBasicId = createNumberRecord(
    aggregate.selectedBasicIds
  );
  const winnersBracketToFinalRateByBasicId = createNumberRecord(
    aggregate.selectedBasicIds
  );
  const losersBracketToFinalRateByBasicId = createNumberRecord(
    aggregate.selectedBasicIds
  );
  const finalistToChampionRateByBasicId = createNumberRecord(
    aggregate.selectedBasicIds
  );
  const winnersBracketChampionRateByBasicId = createNumberRecord(
    aggregate.selectedBasicIds
  );
  const losersBracketChampionRateByBasicId = createNumberRecord(
    aggregate.selectedBasicIds
  );
  const groupTopThreeToFinalRateByBasicId = createNumberRecord(
    aggregate.selectedBasicIds
  );
  const groupTopThreeToChampionRateByBasicId = createNumberRecord(
    aggregate.selectedBasicIds
  );
  for (const basicId of aggregate.selectedBasicIds) {
    const groupEntries = transitionCounts.groupEntryCountByBasicId[basicId] ?? 0;
    const winnersEntries =
      transitionCounts.winnersBracketEntryCountByBasicId[basicId] ?? 0;
    const losersEntries =
      transitionCounts.losersBracketEntryCountByBasicId[basicId] ?? 0;
    const finalists = transitionCounts.finalsEntryCountByBasicId[basicId] ?? 0;
    const winnersToFinals =
      transitionCounts.winnersBracketToFinalCountByBasicId[basicId] ?? 0;
    const losersToFinals =
      transitionCounts.losersBracketToFinalCountByBasicId[basicId] ?? 0;
    const winnersChampions =
      transitionCounts.winnersBracketChampionCountByBasicId[basicId] ?? 0;
    const losersChampions =
      transitionCounts.losersBracketChampionCountByBasicId[basicId] ?? 0;
    const totalChampions = winnersChampions + losersChampions;
    groupToWinnersBracketRateByBasicId[basicId] = toPercent(
      winnersEntries,
      groupEntries
    );
    groupToLosersBracketRateByBasicId[basicId] = toPercent(
      losersEntries,
      groupEntries
    );
    winnersBracketToFinalRateByBasicId[basicId] = toPercent(
      winnersToFinals,
      winnersEntries
    );
    losersBracketToFinalRateByBasicId[basicId] = toPercent(
      losersToFinals,
      losersEntries
    );
    finalistToChampionRateByBasicId[basicId] = toPercent(
      totalChampions,
      finalists
    );
    winnersBracketChampionRateByBasicId[basicId] = toPercent(
      winnersChampions,
      winnersEntries
    );
    losersBracketChampionRateByBasicId[basicId] = toPercent(
      losersChampions,
      losersEntries
    );
    groupTopThreeToFinalRateByBasicId[basicId] = toPercent(
      winnersToFinals,
      winnersEntries
    );
    groupTopThreeToChampionRateByBasicId[basicId] = toPercent(
      winnersChampions,
      winnersEntries
    );
  }
  return {
    kind: "knockout",
    groupStageDynamics: buildSeedDynamics(
      aggregate,
      aggregate.preliminaryToFinalCountsByBasicId
    ),
    bracketStageDynamics: buildSeedDynamics(
      aggregate,
      aggregate.startingToFinalCountsByBasicId
    ),
    finalsDynamics: buildSeedDynamics(
      aggregate,
      aggregate.preliminaryToFinalCountsByBasicId
    ),
    transitionCounts,
    groupToWinnersBracketRateByBasicId,
    groupToLosersBracketRateByBasicId,
    winnersBracketToFinalRateByBasicId,
    losersBracketToFinalRateByBasicId,
    finalistToChampionRateByBasicId,
    winnersBracketChampionRateByBasicId,
    losersBracketChampionRateByBasicId,
    groupTopThreeToFinalRateByBasicId,
    groupTopThreeToChampionRateByBasicId,
  };
}

function finalizeModeAnalyticsInternal(
  aggregate: MonteCarloAggregateSnapshot
): MonteCarloModeAnalytics {
  if (aggregate.scenarioKind === "normalRace") {
    return { kind: "normalRace" };
  }
  if (aggregate.scenarioKind === "knockoutTournament") {
    return finalizeKnockoutModeAnalytics(aggregate);
  }
  const startedWithMaxDebtRateByBasicId = createNumberRecord(
    aggregate.selectedBasicIds
  );
  const maxDebtComebackRateByBasicId = createNumberRecord(
    aggregate.selectedBasicIds
  );
  let totalMaxDebtWins = 0;
  for (const basicId of aggregate.selectedBasicIds) {
    const startCount =
      aggregate.startedFinalWithMaxDebtCountByBasicId[basicId] ?? 0;
    const winCount = aggregate.wonFinalFromMaxDebtCountByBasicId[basicId] ?? 0;
    startedWithMaxDebtRateByBasicId[basicId] = toPercent(
      startCount,
      aggregate.totalRuns
    );
    maxDebtComebackRateByBasicId[basicId] = toPercent(winCount, startCount);
    totalMaxDebtWins += winCount;
  }
  if (aggregate.scenarioKind === "final") {
    return {
      kind: "final",
      startingPlacementDynamics: buildSeedDynamics(
        aggregate,
        aggregate.startingToFinalCountsByBasicId
      ),
      finalStartingPlacementDynamics: buildSeedDynamics(
        aggregate,
        aggregate.startingToFinalCountsByBasicId
      ),
      maxDebtComebackRate: toPercent(totalMaxDebtWins, aggregate.totalRuns),
      maxDebtComebackRateByBasicId,
      startedWithMaxDebtRateByBasicId,
    };
  }
  const preliminaryWinnerRetainedTitleRateByBasicId = createNumberRecord(
    aggregate.selectedBasicIds
  );
  let retainedTitleCount = 0;
  for (const basicId of aggregate.selectedBasicIds) {
    const matrix = aggregate.preliminaryToFinalCountsByBasicId[basicId] ?? [];
    const preliminaryWinnerSample = sumCounts(matrix[0] ?? []);
    const retainedTitleWins = matrix[0]?.[0] ?? 0;
    preliminaryWinnerRetainedTitleRateByBasicId[basicId] = toPercent(
      retainedTitleWins,
      preliminaryWinnerSample
    );
    retainedTitleCount += retainedTitleWins;
  }
  return {
    kind: "tournament",
    preliminaryPlacementDynamics: buildSeedDynamics(
      aggregate,
      aggregate.preliminaryToFinalCountsByBasicId
    ),
    finalStartingPlacementDynamics: buildSeedDynamics(
      aggregate,
      aggregate.startingToFinalCountsByBasicId
    ),
    preliminaryToFinalRankShift: finalizeRankShiftDynamics(aggregate),
    preliminaryWinnerRetainedTitleRate: toPercent(
      retainedTitleCount,
      aggregate.totalRuns
    ),
    preliminaryWinnerRetainedTitleRateByBasicId,
    preliminaryWinnerFinalPlacementRates:
      aggregate.preliminaryWinnerFinalPlacementCounts.map((count) =>
        toPercent(count, aggregate.totalRuns)
      ),
    maxDebtComebackRate: toPercent(totalMaxDebtWins, aggregate.totalRuns),
    maxDebtComebackRateByBasicId,
    startedWithMaxDebtRateByBasicId,
  };
}
export function finalizeMonteCarloAggregate(
  aggregate: MonteCarloAggregateSnapshot
): MonteCarloAggregateSnapshot {
  return {
    ...aggregate,
    basicAnalyticsByBasicId: finalizeBasicAnalyticsById(aggregate),
    basicAnalyticsByContext: finalizeContextAnalytics(aggregate),
    modeAnalytics: finalizeModeAnalyticsInternal(aggregate),
  };
}
