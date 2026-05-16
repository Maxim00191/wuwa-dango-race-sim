import {
  CELL_EFFECT_KEYS,
  STACK_ROLE_KEYS,
  createCellEffectCounts,
  ensureSkillActivationTotals,
} from "@/services/monteCarlo/aggregate/builders";
import {
  absorbPlacementsIntoCounts,
  createPlacementIndexByBasicId,
  createPlacementVector,
} from "@/services/monteCarlo/aggregate/placement";
import type { RaceMode } from "@/types/game";
import type {
  HeadlessRaceDeepMetrics,
  HeadlessSimulationOutcome,
  MonteCarloAggregateSnapshot,
  MonteCarloBasicMetricTotals,
  MonteCarloRaceContext,
  OneTimeSkillKey,
} from "@/types/monteCarlo";

export function contextForRaceMode(mode: RaceMode): MonteCarloRaceContext {
  if (mode === "normal") {
    return "sprint";
  }
  if (mode === "tournamentPreliminary") {
    return "preliminary";
  }
  if (mode === "knockoutGroup") {
    return "knockoutGroup";
  }
  if (mode === "knockoutBracket") {
    return "knockoutBracket";
  }
  if (mode === "knockoutFinal") {
    return "knockoutFinal";
  }
  return "final";
}

export function absorbRaceMetricsIntoBasicTotals(
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
      totals.cellEffectTriggerSums[effectKey] +=
        metrics.cellEffectTriggerCounts[effectKey];
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

export function absorbRaceLevelCorrelationsIntoBasicTotals(
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

export function absorbScenarioLevelCorrelations(
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
      ...(outcome.knockoutPhases?.map((phaseResult) => phaseResult.metrics) ?? []),
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
      totals.hindranceTriggerCountInWinningScenarios +=
        combinedCounts.hindranceDevice;
    }
  }
}

export function absorbPerRaceContextMetrics(
  aggregate: MonteCarloAggregateSnapshot,
  outcome: HeadlessSimulationOutcome
): void {
  const raceMetricsToAbsorb = [
    outcome.raceMetrics.preliminary,
    outcome.raceMetrics.final,
    ...(outcome.knockoutPhases?.map((phaseResult) => phaseResult.metrics) ?? []),
  ];
  for (const raceMetrics of raceMetricsToAbsorb) {
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
}
