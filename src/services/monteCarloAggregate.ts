import type { LocalizedText } from "@/i18n";
import type { DangoId, RaceMode } from "@/types/game";
import type {
  CellEffectAnalyticsKey,
  CellEffectTriggerCounts,
  ConditionalPlacementSnapshot,
  HeadlessRaceDeepMetrics,
  HeadlessSimulationOutcome,
  MonteCarloAggregateSnapshot,
  MonteCarloBasicAnalytics,
  MonteCarloBasicMetricTotals,
  MonteCarloContextAnalytics,
  MonteCarloModeAnalytics,
  MonteCarloRaceContext,
  MonteCarloRankShiftDynamics,
  MonteCarloScenarioKind,
  MonteCarloSeedDynamics,
  OneTimeSkillKey,
  PlacementCountMatrix,
  PlacementCountVector,
  SkillActivationAggregateTotals,
  StackRoleKey,
  StackRoleObservationCounts,
} from "@/types/monteCarlo";

const STACK_ROLE_KEYS: StackRoleKey[] = ["solo", "driver", "passenger", "crown"];
const CELL_EFFECT_KEYS: CellEffectAnalyticsKey[] = [
  "propulsionDevice",
  "hindranceDevice",
  "timeRift",
];
const RACE_MODES: RaceMode[] = [
  "normal",
  "tournamentPreliminary",
  "tournamentFinal",
  "customFinal",
];
const RACE_CONTEXTS: MonteCarloRaceContext[] = ["sprint", "qualifier", "final"];

function createPlacementVector(participantCount: number): PlacementCountVector {
  return Array.from({ length: participantCount }, () => 0);
}

function createPlacementMatrix(participantCount: number): PlacementCountMatrix {
  return Array.from({ length: participantCount }, () =>
    createPlacementVector(participantCount)
  );
}

function createNumberRecord(selectedBasicIds: DangoId[]): Record<string, number> {
  return Object.fromEntries(selectedBasicIds.map((basicId) => [basicId, 0]));
}

function createRaceCountByMode(): Partial<Record<RaceMode, number>> {
  return Object.fromEntries(RACE_MODES.map((mode) => [mode, 0]));
}

function createRaceCountByContext(): Record<MonteCarloRaceContext, number> {
  return Object.fromEntries(
    RACE_CONTEXTS.map((context) => [context, 0])
  ) as Record<MonteCarloRaceContext, number>;
}

function createStackRoleCounts(): StackRoleObservationCounts {
  return {
    solo: 0,
    driver: 0,
    passenger: 0,
    crown: 0,
  };
}

function createCellEffectCounts(): CellEffectTriggerCounts {
  return {
    propulsionDevice: 0,
    hindranceDevice: 0,
    timeRift: 0,
  };
}

function createSeedDynamics(participantCount: number): MonteCarloSeedDynamics {
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

function createBasicMetricTotals(): MonteCarloBasicMetricTotals {
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

function createBasicMetricTotalsRecord(
  selectedBasicIds: DangoId[]
): Record<string, MonteCarloBasicMetricTotals> {
  return Object.fromEntries(
    selectedBasicIds.map((basicId) => [basicId, createBasicMetricTotals()])
  );
}

function createBasicAnalytics(): MonteCarloBasicAnalytics {
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

function createBasicAnalyticsRecord(
  selectedBasicIds: DangoId[]
): Record<string, MonteCarloBasicAnalytics> {
  return Object.fromEntries(
    selectedBasicIds.map((basicId) => [basicId, createBasicAnalytics()])
  );
}

function createModeAnalytics(
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
  return {
    kind: "tournament",
    qualifierPlacementDynamics: createSeedDynamics(participantCount),
    finalStartingPlacementDynamics: createSeedDynamics(participantCount),
    qualifierToFinalRankShift: createRankShiftDynamics(selectedBasicIds),
    qualifierWinnerRetainedTitleRate: 0,
    qualifierWinnerRetainedTitleRateByBasicId: zeroes,
    qualifierWinnerFinalPlacementRates: Array.from(
      { length: participantCount },
      () => 0
    ),
    maxDebtComebackRate: 0,
    maxDebtComebackRateByBasicId: { ...zeroes },
    startedWithMaxDebtRateByBasicId: { ...zeroes },
  };
}

function createRankShiftDynamics(
  selectedBasicIds: DangoId[]
): MonteCarloRankShiftDynamics {
  return {
    averageFinalMinusQualifierRankByBasicId: Object.fromEntries(
      selectedBasicIds.map((basicId) => [basicId, null])
    ),
    chokeRateByBasicId: createNumberRecord(selectedBasicIds),
    clutchRateByBasicId: createNumberRecord(selectedBasicIds),
    chokeOpportunityCountByBasicId: createNumberRecord(selectedBasicIds),
    clutchOpportunityCountByBasicId: createNumberRecord(selectedBasicIds),
    overallAverageFinalMinusQualifierRank: null,
    overallChokeRate: 0,
    overallClutchRate: 0,
  };
}

function createPlacementRecord(
  selectedBasicIds: DangoId[],
  participantCount: number
): Record<string, PlacementCountVector> {
  return Object.fromEntries(
    selectedBasicIds.map((basicId) => [
      basicId,
      createPlacementVector(participantCount),
    ])
  );
}

function createConditionalPlacementRecord(
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

function createTransitionMatrixRecord(
  selectedBasicIds: DangoId[],
  participantCount: number
): Record<string, PlacementCountMatrix> {
  return Object.fromEntries(
    selectedBasicIds.map((basicId) => [
      basicId,
      createPlacementMatrix(participantCount),
    ])
  );
}

function createContextNumberRecords(
  selectedBasicIds: DangoId[]
): Record<MonteCarloRaceContext, Record<string, number>> {
  return Object.fromEntries(
    RACE_CONTEXTS.map((context) => [context, createNumberRecord(selectedBasicIds)])
  ) as Record<MonteCarloRaceContext, Record<string, number>>;
}

function createContextPlacementRecords(
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

function createContextBasicMetricTotalsRecords(
  selectedBasicIds: DangoId[]
): Record<MonteCarloRaceContext, Record<string, MonteCarloBasicMetricTotals>> {
  return Object.fromEntries(
    RACE_CONTEXTS.map((context) => [
      context,
      createBasicMetricTotalsRecord(selectedBasicIds),
    ])
  ) as Record<MonteCarloRaceContext, Record<string, MonteCarloBasicMetricTotals>>;
}

function createContextAnalyticsRecords(
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

function absorbPlacementsIntoCounts(
  placements: DangoId[],
  placementCountsByBasicId: Record<string, PlacementCountVector>
): void {
  for (const [placementIndex, basicId] of placements.entries()) {
    const placementCounts = placementCountsByBasicId[basicId];
    if (!placementCounts || placementIndex >= placementCounts.length) {
      continue;
    }
    placementCounts[placementIndex] += 1;
  }
}

function createPlacementIndexByBasicId(
  placements: DangoId[]
): Record<string, number> {
  return Object.fromEntries(
    placements.map((basicId, placementIndex) => [basicId, placementIndex])
  );
}

function toPercent(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return (value / total) * 100;
}

function sumCounts(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}

function meanPlacementFromCounts(counts: PlacementCountVector): number | null {
  const total = sumCounts(counts);
  if (total <= 0) {
    return null;
  }
  const weightedPlacementSum = counts.reduce(
    (sum, count, placementIndex) => sum + count * (placementIndex + 1),
    0
  );
  return weightedPlacementSum / total;
}

function toRatio(numerator: number, denominator: number): number | null {
  if (denominator <= 0) {
    return null;
  }
  return numerator / denominator;
}

function ensureSkillActivationTotals(
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

function contextForRaceMode(mode: RaceMode): MonteCarloRaceContext {
  if (mode === "normal") {
    return "sprint";
  }
  if (mode === "tournamentPreliminary") {
    return "qualifier";
  }
  return "final";
}

function absorbTransitionCounts(
  aggregate: MonteCarloAggregateSnapshot,
  transitionCountsByBasicId: Record<string, PlacementCountMatrix>,
  startingPlacementByBasicId: Record<string, number>,
  finalPlacements: DangoId[]
): void {
  const finalPlacementIndexByBasicId = createPlacementIndexByBasicId(
    finalPlacements
  );
  for (const basicId of aggregate.selectedBasicIds) {
    const startPlacementIndex = startingPlacementByBasicId[basicId];
    const finalPlacementIndex = finalPlacementIndexByBasicId[basicId];
    const transitionCounts = transitionCountsByBasicId[basicId];
    if (
      !transitionCounts ||
      startPlacementIndex === undefined ||
      finalPlacementIndex === undefined
    ) {
      continue;
    }
    const row = transitionCounts[startPlacementIndex];
    if (!row || finalPlacementIndex >= row.length) {
      continue;
    }
    row[finalPlacementIndex] += 1;
  }
}

function absorbRaceMetricsIntoBasicTotals(
  aggregate: MonteCarloAggregateSnapshot,
  raceMetrics: HeadlessRaceDeepMetrics,
  totalsByBasicId: Record<string, MonteCarloBasicMetricTotals> =
    aggregate.basicMetricTotalsByBasicId
): void {
  const placementIndexByBasicId = createPlacementIndexByBasicId(
    raceMetrics.finalPlacements
  );
  for (const basicId of aggregate.selectedBasicIds) {
    const totals = totalsByBasicId[basicId];
    const metrics = raceMetrics.basicMetricsById[basicId];
    if (!totals || !metrics) {
      continue;
    }
    totals.ownTurnProgressSum += metrics.ownTurnProgress;
    totals.passiveProgressSum += metrics.passiveProgress;
    totals.carriedProgressSum += metrics.carriedProgress;
    totals.activeTurnCountSum += metrics.activeTurnCount;
    totals.passengerRideTurnCountSum += metrics.passengerRideTurnCount;
    for (const roleKey of STACK_ROLE_KEYS) {
      totals.roleObservationSums[roleKey] += metrics.roleObservationCounts[roleKey];
    }
    for (const effectKey of CELL_EFFECT_KEYS) {
      totals.cellEffectTriggerSums[effectKey] += metrics.cellEffectTriggerCounts[effectKey];
    }
    const placementIndex = placementIndexByBasicId[basicId];
    for (const [skillKey, activationTurn] of Object.entries(
      metrics.oneTimeSkillActivationTurnBySkillKey
    ) as [OneTimeSkillKey, number][]) {
      const skillTotals = ensureSkillActivationTotals(
        totals,
        raceMetrics.mode,
        skillKey
      );
      skillTotals.activationCount += 1;
      skillTotals.activationTurnSum += activationTurn;
      if (raceMetrics.winnerBasicId === basicId) {
        skillTotals.activationWinCount += 1;
        skillTotals.winningActivationTurnSum += activationTurn;
      }
      const turnKey = String(activationTurn);
      const placementCounts =
        skillTotals.placementCountsByActivationTurn[turnKey] ??
        createPlacementVector(aggregate.participantCount);
      if (
        placementIndex !== undefined &&
        placementIndex >= 0 &&
        placementIndex < placementCounts.length
      ) {
        placementCounts[placementIndex] += 1;
      }
      skillTotals.placementCountsByActivationTurn[turnKey] = placementCounts;
    }
  }
}

function absorbRaceLevelCorrelationsIntoBasicTotals(
  aggregate: MonteCarloAggregateSnapshot,
  raceMetrics: HeadlessRaceDeepMetrics,
  totalsByBasicId: Record<string, MonteCarloBasicMetricTotals>
): void {
  for (const basicId of aggregate.selectedBasicIds) {
    const totals = totalsByBasicId[basicId];
    const metrics = raceMetrics.basicMetricsById[basicId];
    if (!totals || !metrics) {
      continue;
    }
    for (const effectKey of CELL_EFFECT_KEYS) {
      if (metrics.cellEffectTriggerCounts[effectKey] <= 0) {
        continue;
      }
      totals.racesWithCellEffectTriggerCounts[effectKey] += 1;
      if (raceMetrics.winnerBasicId === basicId) {
        totals.winsWithCellEffectTriggerCounts[effectKey] += 1;
      }
    }
    if (metrics.cellEffectTriggerCounts.hindranceDevice >= 2) {
      totals.scenariosWithHighHindranceCount += 1;
      if (raceMetrics.winnerBasicId === basicId) {
        totals.winsWithHighHindranceCount += 1;
      }
    }
    if (metrics.passiveProgress > metrics.ownTurnProgress) {
      totals.scenariosWithPassiveLeadCount += 1;
      if (raceMetrics.winnerBasicId === basicId) {
        totals.winsWithPassiveLeadCount += 1;
      }
    }
    if (metrics.carriedProgress > metrics.ownTurnProgress) {
      totals.scenariosWithCarriedLeadCount += 1;
      if (raceMetrics.winnerBasicId === basicId) {
        totals.winsWithCarriedLeadCount += 1;
      }
    }
    if (raceMetrics.winnerBasicId === basicId) {
      totals.hindranceTriggerCountInWinningScenarios +=
        metrics.cellEffectTriggerCounts.hindranceDevice;
    }
  }
}

function absorbScenarioLevelCorrelations(
  aggregate: MonteCarloAggregateSnapshot,
  outcome: HeadlessSimulationOutcome
): void {
  for (const basicId of aggregate.selectedBasicIds) {
    const totals = aggregate.basicMetricTotalsByBasicId[basicId];
    if (!totals) {
      continue;
    }
    const combinedCounts = createCellEffectCounts();
    let combinedOwnTurnProgress = 0;
    let combinedPassiveProgress = 0;
    let combinedCarriedProgress = 0;
    for (const raceMetrics of [
      outcome.raceMetrics.preliminary,
      outcome.raceMetrics.final,
    ]) {
      if (!raceMetrics) {
        continue;
      }
      const metrics = raceMetrics.basicMetricsById[basicId];
      if (!metrics) {
        continue;
      }
      combinedOwnTurnProgress += metrics.ownTurnProgress;
      combinedPassiveProgress += metrics.passiveProgress;
      combinedCarriedProgress += metrics.carriedProgress;
      for (const effectKey of CELL_EFFECT_KEYS) {
        combinedCounts[effectKey] += metrics.cellEffectTriggerCounts[effectKey];
      }
    }
    for (const effectKey of CELL_EFFECT_KEYS) {
      if (combinedCounts[effectKey] <= 0) {
        continue;
      }
      totals.racesWithCellEffectTriggerCounts[effectKey] += 1;
      if (outcome.winnerBasicId === basicId) {
        totals.winsWithCellEffectTriggerCounts[effectKey] += 1;
      }
    }
    if (combinedCounts.hindranceDevice >= 2) {
      totals.scenariosWithHighHindranceCount += 1;
      if (outcome.winnerBasicId === basicId) {
        totals.winsWithHighHindranceCount += 1;
      }
    }
    if (combinedPassiveProgress > combinedOwnTurnProgress) {
      totals.scenariosWithPassiveLeadCount += 1;
      if (outcome.winnerBasicId === basicId) {
        totals.winsWithPassiveLeadCount += 1;
      }
    }
    if (combinedCarriedProgress > combinedOwnTurnProgress) {
      totals.scenariosWithCarriedLeadCount += 1;
      if (outcome.winnerBasicId === basicId) {
        totals.winsWithCarriedLeadCount += 1;
      }
    }
    if (outcome.winnerBasicId === basicId) {
      totals.hindranceTriggerCountInWinningScenarios += combinedCounts.hindranceDevice;
    }
  }
}

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
  const averageFinalMinusQualifierRankByBasicId = Object.fromEntries(
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
    averageFinalMinusQualifierRankByBasicId,
    chokeRateByBasicId,
    clutchRateByBasicId,
    chokeOpportunityCountByBasicId:
      aggregate.tournamentChokeOpportunityCountByBasicId,
    clutchOpportunityCountByBasicId:
      aggregate.tournamentClutchOpportunityCountByBasicId,
    overallAverageFinalMinusQualifierRank:
      totalShiftCount > 0 ? totalShiftSum / totalShiftCount : null,
    overallChokeRate: toPercent(totalChokes, totalChokeOpportunities),
    overallClutchRate: toPercent(totalClutches, totalClutchOpportunities),
  };
}

function finalizeModeAnalytics(
  aggregate: MonteCarloAggregateSnapshot
): MonteCarloModeAnalytics {
  if (aggregate.scenarioKind === "normalRace") {
    return { kind: "normalRace" };
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
  const qualifierWinnerRetainedTitleRateByBasicId = createNumberRecord(
    aggregate.selectedBasicIds
  );
  let retainedTitleCount = 0;
  for (const basicId of aggregate.selectedBasicIds) {
    const matrix = aggregate.preliminaryToFinalCountsByBasicId[basicId] ?? [];
    const qualifierWinnerSample = sumCounts(matrix[0] ?? []);
    const retainedTitleWins = matrix[0]?.[0] ?? 0;
    qualifierWinnerRetainedTitleRateByBasicId[basicId] = toPercent(
      retainedTitleWins,
      qualifierWinnerSample
    );
    retainedTitleCount += retainedTitleWins;
  }
  return {
    kind: "tournament",
    qualifierPlacementDynamics: buildSeedDynamics(
      aggregate,
      aggregate.preliminaryToFinalCountsByBasicId
    ),
    finalStartingPlacementDynamics: buildSeedDynamics(
      aggregate,
      aggregate.startingToFinalCountsByBasicId
    ),
    qualifierToFinalRankShift: finalizeRankShiftDynamics(aggregate),
    qualifierWinnerRetainedTitleRate: toPercent(
      retainedTitleCount,
      aggregate.totalRuns
    ),
    qualifierWinnerRetainedTitleRateByBasicId,
    qualifierWinnerFinalPlacementRates:
      aggregate.qualifierWinnerFinalPlacementCounts.map((count) =>
        toPercent(count, aggregate.totalRuns)
      ),
    maxDebtComebackRate: toPercent(totalMaxDebtWins, aggregate.totalRuns),
    maxDebtComebackRateByBasicId,
    startedWithMaxDebtRateByBasicId,
  };
}

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
    qualifierWinnerFinalPlacementCounts: createPlacementVector(participantCount),
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
    modeAnalytics: createModeAnalytics(
      scenarioKind,
      selectedBasicIds,
      participantCount
    ),
  };
}

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
  absorbTransitionCounts(
    aggregate,
    aggregate.startingToFinalCountsByBasicId,
    outcome.modeMetrics.finalStartingPlacementByBasicId,
    outcome.finalPlacements
  );
  if (outcome.modeMetrics.kind === "tournament") {
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
      const qualifierPlacementIndex = preliminaryPlacementIndexByBasicId[basicId];
      const finalPlacementIndex = finalPlacementIndexByBasicId[basicId];
      if (
        qualifierPlacementIndex === undefined ||
        finalPlacementIndex === undefined
      ) {
        continue;
      }
      aggregate.tournamentRankShiftSumByBasicId[basicId] =
        (aggregate.tournamentRankShiftSumByBasicId[basicId] ?? 0) +
        finalPlacementIndex -
        qualifierPlacementIndex;
      aggregate.tournamentRankShiftCountByBasicId[basicId] =
        (aggregate.tournamentRankShiftCountByBasicId[basicId] ?? 0) + 1;
      if (qualifierPlacementIndex <= 1) {
        aggregate.tournamentChokeOpportunityCountByBasicId[basicId] =
          (aggregate.tournamentChokeOpportunityCountByBasicId[basicId] ?? 0) + 1;
        if (finalPlacementIndex >= bottomTwoStart) {
          aggregate.tournamentChokeCountByBasicId[basicId] =
            (aggregate.tournamentChokeCountByBasicId[basicId] ?? 0) + 1;
        }
      }
      if (qualifierPlacementIndex >= bottomTwoStart) {
        aggregate.tournamentClutchOpportunityCountByBasicId[basicId] =
          (aggregate.tournamentClutchOpportunityCountByBasicId[basicId] ?? 0) + 1;
        if (finalPlacementIndex <= 2) {
          aggregate.tournamentClutchCountByBasicId[basicId] =
            (aggregate.tournamentClutchCountByBasicId[basicId] ?? 0) + 1;
        }
      }
    }
    const qualifierWinnerId =
      outcome.preliminaryWinnerBasicId ?? outcome.preliminaryPlacements?.[0] ?? null;
    const qualifierWinnerFinalPlacement =
      qualifierWinnerId === null
        ? undefined
        : finalPlacementIndexByBasicId[qualifierWinnerId];
    if (
      qualifierWinnerFinalPlacement !== undefined &&
      qualifierWinnerFinalPlacement >= 0 &&
      qualifierWinnerFinalPlacement <
        aggregate.qualifierWinnerFinalPlacementCounts.length
    ) {
      aggregate.qualifierWinnerFinalPlacementCounts[
        qualifierWinnerFinalPlacement
      ] += 1;
    }
  }
  for (const raceMetrics of [
    outcome.raceMetrics.preliminary,
    outcome.raceMetrics.final,
  ]) {
    if (!raceMetrics) {
      continue;
    }
    aggregate.raceCountByMode[raceMetrics.mode] =
      (aggregate.raceCountByMode[raceMetrics.mode] ?? 0) + 1;
    absorbRaceMetricsIntoBasicTotals(aggregate, raceMetrics);
    const context = contextForRaceMode(raceMetrics.mode);
    aggregate.raceCountByContext[context] += 1;
    absorbPlacementsIntoCounts(
      raceMetrics.finalPlacements,
      aggregate.placementCountsByContext[context]
    );
    if (raceMetrics.winnerBasicId) {
      aggregate.winsByContext[context][raceMetrics.winnerBasicId] =
        (aggregate.winsByContext[context][raceMetrics.winnerBasicId] ?? 0) + 1;
    }
    absorbRaceMetricsIntoBasicTotals(
      aggregate,
      raceMetrics,
      aggregate.basicMetricTotalsByContext[context]
    );
    absorbRaceLevelCorrelationsIntoBasicTotals(
      aggregate,
      raceMetrics,
      aggregate.basicMetricTotalsByContext[context]
    );
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

export function finalizeMonteCarloAggregate(
  aggregate: MonteCarloAggregateSnapshot
): MonteCarloAggregateSnapshot {
  return {
    ...aggregate,
    basicAnalyticsByBasicId: finalizeBasicAnalyticsById(aggregate),
    basicAnalyticsByContext: finalizeContextAnalytics(aggregate),
    modeAnalytics: finalizeModeAnalytics(aggregate),
  };
}
