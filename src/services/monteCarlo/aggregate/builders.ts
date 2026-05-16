import {
  CELL_EFFECT_KEYS,
  RACE_CONTEXTS,
  RACE_MODES,
  STACK_ROLE_KEYS,
} from "@/services/monteCarlo/config/domainCatalog";
import {
  createPlacementMatrix,
  createPlacementRecord,
  createPlacementVector,
} from "@/services/monteCarlo/aggregate/placement";
import type { DangoId, RaceMode } from "@/types/game";
import type {
  CellEffectTriggerCounts,
  ConditionalPlacementSnapshot,
  MonteCarloBasicAnalytics,
  MonteCarloBasicMetricTotals,
  MonteCarloContextAnalytics,
  MonteCarloKnockoutTransitionCounts,
  MonteCarloModeAnalytics,
  MonteCarloRaceContext,
  MonteCarloRankShiftDynamics,
  MonteCarloScenarioKind,
  MonteCarloSeedDynamics,
  PlacementCountVector,
  SkillActivationAggregateTotals,
  StackRoleObservationCounts,
} from "@/types/monteCarlo";
import type { OneTimeSkillKey } from "@/types/monteCarlo";

export function createNumberRecord(
  selectedBasicIds: DangoId[]
): Record<string, number> {
  return Object.fromEntries(selectedBasicIds.map((basicId) => [basicId, 0]));
}

export function createKnockoutTransitionCounts(
  selectedBasicIds: DangoId[]
): MonteCarloKnockoutTransitionCounts {
  return {
    groupEntryCountByBasicId: createNumberRecord(selectedBasicIds),
    winnersBracketEntryCountByBasicId: createNumberRecord(selectedBasicIds),
    losersBracketEntryCountByBasicId: createNumberRecord(selectedBasicIds),
    finalsEntryCountByBasicId: createNumberRecord(selectedBasicIds),
    winnersBracketToFinalCountByBasicId: createNumberRecord(selectedBasicIds),
    losersBracketToFinalCountByBasicId: createNumberRecord(selectedBasicIds),
    winnersBracketChampionCountByBasicId: createNumberRecord(selectedBasicIds),
    losersBracketChampionCountByBasicId: createNumberRecord(selectedBasicIds),
  };
}

export function createRaceCountByMode(): Partial<Record<RaceMode, number>> {
  return Object.fromEntries(RACE_MODES.map((mode) => [mode, 0]));
}

export function createRaceCountByContext(): Record<MonteCarloRaceContext, number> {
  return Object.fromEntries(
    RACE_CONTEXTS.map((context) => [context, 0])
  ) as Record<MonteCarloRaceContext, number>;
}

export function createStackRoleCounts(): StackRoleObservationCounts {
  return {
    solo: 0,
    driver: 0,
    passenger: 0,
    crown: 0,
  };
}

export function createCellEffectCounts(): CellEffectTriggerCounts {
  return {
    propulsionDevice: 0,
    hindranceDevice: 0,
    timeRift: 0,
  };
}

export function createSeedDynamics(participantCount: number): MonteCarloSeedDynamics {
  return {
    transitionMatrix: createPlacementMatrix(participantCount),
    titleCountsByStartingPlacement: createPlacementVector(participantCount),
    titleRatesByStartingPlacement: Array.from(
      { length: participantCount },
      () => 0
    ),
    averageFinalPlacementByStartingPlacement: Array.from(
      { length: participantCount },
      () => null
    ),
    averagePlacementDeltaByStartingPlacement: Array.from(
      { length: participantCount },
      () => null
    ),
  };
}

export function createBasicMetricTotals(): MonteCarloBasicMetricTotals {
  return {
    ownTurnProgressSum: 0,
    passiveProgressSum: 0,
    carriedProgressSum: 0,
    activeTurnCountSum: 0,
    passengerRideTurnCountSum: 0,
    roleObservationSums: createStackRoleCounts(),
    cellEffectTriggerSums: createCellEffectCounts(),
    racesWithCellEffectTriggerCounts: createCellEffectCounts(),
    winsWithCellEffectTriggerCounts: createCellEffectCounts(),
    scenariosWithPassiveLeadCount: 0,
    winsWithPassiveLeadCount: 0,
    scenariosWithCarriedLeadCount: 0,
    winsWithCarriedLeadCount: 0,
    scenariosWithHighHindranceCount: 0,
    winsWithHighHindranceCount: 0,
    hindranceTriggerCountInWinningScenarios: 0,
    oncePerRaceSkillTotalsByMode: {},
  };
}

export function createBasicMetricTotalsRecord(
  selectedBasicIds: DangoId[]
): Record<string, MonteCarloBasicMetricTotals> {
  return Object.fromEntries(
    selectedBasicIds.map((basicId) => [basicId, createBasicMetricTotals()])
  );
}

export function createBasicAnalytics(): MonteCarloBasicAnalytics {
  return {
    progressTopography: {
      averageOwnTurnProgress: 0,
      averagePassiveProgress: 0,
      averageCarriedProgress: 0,
      averageTotalProgress: 0,
      averageOwnTurnProgressPerTurn: 0,
      averagePassiveProgressPerCarriedTurn: 0,
      averageCarriedProgressPerRideTurn: 0,
      passiveProgressShare: 0,
      carriedProgressShare: 0,
      passiveToOwnProgressRatio: null,
      carriedToOwnProgressRatio: null,
      passiveLeadRate: 0,
      passiveLeadTitleConversionRate: 0,
      carriedLeadRate: 0,
      carriedLeadTitleConversionRate: 0,
    },
    stackEcosystem: {
      roleRates: createStackRoleCounts(),
      carriedRoleRate: 0,
    },
    trapAffinity: {
      averageTriggers: createCellEffectCounts(),
      triggerRates: createCellEffectCounts(),
      titleConversionRates: createCellEffectCounts(),
      hindranceResilienceRate: 0,
      highHindranceRate: 0,
      highHindranceTitleConversionRate: 0,
      averageHindranceTriggersWhenWinning: 0,
    },
    skillTimingByMode: {},
  };
}

export function createBasicAnalyticsRecord(
  selectedBasicIds: DangoId[]
): Record<string, MonteCarloBasicAnalytics> {
  return Object.fromEntries(
    selectedBasicIds.map((basicId) => [basicId, createBasicAnalytics()])
  );
}

export function createRankShiftDynamics(
  selectedBasicIds: DangoId[]
): MonteCarloRankShiftDynamics {
  return {
    averageFinalMinusPreliminaryRankByBasicId: Object.fromEntries(
      selectedBasicIds.map((basicId) => [basicId, null])
    ),
    chokeRateByBasicId: createNumberRecord(selectedBasicIds),
    clutchRateByBasicId: createNumberRecord(selectedBasicIds),
    chokeOpportunityCountByBasicId: createNumberRecord(selectedBasicIds),
    clutchOpportunityCountByBasicId: createNumberRecord(selectedBasicIds),
    overallAverageFinalMinusPreliminaryRank: null,
    overallChokeRate: 0,
    overallClutchRate: 0,
  };
}

export function createModeAnalytics(
  scenarioKind: MonteCarloScenarioKind,
  selectedBasicIds: DangoId[],
  participantCount: number
): MonteCarloModeAnalytics {
  if (scenarioKind === "normalRace") {
    return { kind: "normalRace" };
  }
  const zeroes = createNumberRecord(selectedBasicIds);
  if (scenarioKind === "final") {
    return {
      kind: "final",
      startingPlacementDynamics: createSeedDynamics(participantCount),
      finalStartingPlacementDynamics: createSeedDynamics(participantCount),
      maxDebtComebackRate: 0,
      maxDebtComebackRateByBasicId: zeroes,
      startedWithMaxDebtRateByBasicId: { ...zeroes },
    };
  }
  if (scenarioKind === "knockoutTournament") {
    return {
      kind: "knockout",
      groupStageDynamics: createSeedDynamics(participantCount),
      bracketStageDynamics: createSeedDynamics(participantCount),
      finalsDynamics: createSeedDynamics(participantCount),
      transitionCounts: createKnockoutTransitionCounts(selectedBasicIds),
      groupToWinnersBracketRateByBasicId: { ...zeroes },
      groupToLosersBracketRateByBasicId: { ...zeroes },
      winnersBracketToFinalRateByBasicId: { ...zeroes },
      losersBracketToFinalRateByBasicId: { ...zeroes },
      finalistToChampionRateByBasicId: { ...zeroes },
      winnersBracketChampionRateByBasicId: { ...zeroes },
      losersBracketChampionRateByBasicId: { ...zeroes },
      groupTopThreeToFinalRateByBasicId: { ...zeroes },
      groupTopThreeToChampionRateByBasicId: { ...zeroes },
    };
  }
  return {
    kind: "tournament",
    preliminaryPlacementDynamics: createSeedDynamics(participantCount),
    finalStartingPlacementDynamics: createSeedDynamics(participantCount),
    preliminaryToFinalRankShift: createRankShiftDynamics(selectedBasicIds),
    preliminaryWinnerRetainedTitleRate: 0,
    preliminaryWinnerRetainedTitleRateByBasicId: zeroes,
    preliminaryWinnerFinalPlacementRates: Array.from(
      { length: participantCount },
      () => 0
    ),
    maxDebtComebackRate: 0,
    maxDebtComebackRateByBasicId: { ...zeroes },
    startedWithMaxDebtRateByBasicId: { ...zeroes },
  };
}

export function createConditionalPlacementRecord(
  selectedBasicIds: DangoId[],
  participantCount: number
): Record<string, ConditionalPlacementSnapshot> {
  return Object.fromEntries(
    selectedBasicIds.map((winnerBasicId) => [
      winnerBasicId,
      {
        sampleSize: 0,
        placementCountsByBasicId: createPlacementRecord(
          selectedBasicIds,
          participantCount
        ),
      },
    ])
  );
}

export function createContextNumberRecords(
  selectedBasicIds: DangoId[]
): Record<MonteCarloRaceContext, Record<string, number>> {
  return Object.fromEntries(
    RACE_CONTEXTS.map((context) => [context, createNumberRecord(selectedBasicIds)])
  ) as Record<MonteCarloRaceContext, Record<string, number>>;
}

export function createContextPlacementRecords(
  selectedBasicIds: DangoId[],
  participantCount: number
): Record<MonteCarloRaceContext, Record<string, PlacementCountVector>> {
  return Object.fromEntries(
    RACE_CONTEXTS.map((context) => [
      context,
      createPlacementRecord(selectedBasicIds, participantCount),
    ])
  ) as Record<MonteCarloRaceContext, Record<string, PlacementCountVector>>;
}

export function createContextBasicMetricTotalsRecords(
  selectedBasicIds: DangoId[]
): Record<MonteCarloRaceContext, Record<string, MonteCarloBasicMetricTotals>> {
  return Object.fromEntries(
    RACE_CONTEXTS.map((context) => [
      context,
      createBasicMetricTotalsRecord(selectedBasicIds),
    ])
  ) as Record<MonteCarloRaceContext, Record<string, MonteCarloBasicMetricTotals>>;
}

export function createContextAnalyticsRecords(
  selectedBasicIds: DangoId[],
  participantCount: number
): Record<MonteCarloRaceContext, MonteCarloContextAnalytics> {
  return Object.fromEntries(
    RACE_CONTEXTS.map((context) => [
      context,
      {
        raceCount: 0,
        winsByBasicId: createNumberRecord(selectedBasicIds),
        placementCountsByBasicId: createPlacementRecord(
          selectedBasicIds,
          participantCount
        ),
        basicAnalyticsByBasicId: createBasicAnalyticsRecord(selectedBasicIds),
      },
    ])
  ) as Record<MonteCarloRaceContext, MonteCarloContextAnalytics>;
}

export function ensureSkillActivationTotals(
  totals: MonteCarloBasicMetricTotals,
  mode: RaceMode,
  skillKey: OneTimeSkillKey
): SkillActivationAggregateTotals {
  const modeRecord =
    totals.oncePerRaceSkillTotalsByMode[mode] ??
    (totals.oncePerRaceSkillTotalsByMode[mode] = {});
  const existing = modeRecord[skillKey];
  if (existing) {
    return existing;
  }
  const created: SkillActivationAggregateTotals = {
    activationCount: 0,
    activationTurnSum: 0,
    activationWinCount: 0,
    winningActivationTurnSum: 0,
    placementCountsByActivationTurn: {},
  };
  modeRecord[skillKey] = created;
  return created;
}

export { STACK_ROLE_KEYS, CELL_EFFECT_KEYS };
