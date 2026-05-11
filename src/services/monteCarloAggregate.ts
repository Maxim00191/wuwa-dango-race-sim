import type { LocalizedText } from "@/i18n";
import type { HeadlessSimulationOutcome } from "@/services/gameEngine";
import type { DangoId } from "@/types/game";
import type {
  ConditionalPlacementSnapshot,
  MonteCarloAggregateSnapshot,
  MonteCarloScenarioKind,
  PlacementCountMatrix,
  PlacementCountVector,
} from "@/types/monteCarlo";

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
    preliminaryToFinalCountsByBasicId: createTransitionMatrixRecord(
      selectedBasicIds,
      participantCount
    ),
    sumTurns: 0,
    sumPreliminaryTurns: 0,
    sumFinalTurns: 0,
    minTurns: Number.POSITIVE_INFINITY,
    maxTurns: 0,
    stackCarrierObservationSumByBasicId: createNumberRecord(selectedBasicIds),
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
  if (outcome.preliminaryPlacements && outcome.preliminaryPlacements.length > 0) {
    const preliminaryPlacementIndexByBasicId = createPlacementIndexByBasicId(
      outcome.preliminaryPlacements
    );
    const finalPlacementIndexByBasicId = createPlacementIndexByBasicId(
      outcome.finalPlacements
    );
    for (const basicId of aggregate.selectedBasicIds) {
      const preliminaryPlacementIndex =
        preliminaryPlacementIndexByBasicId[basicId];
      const finalPlacementIndex = finalPlacementIndexByBasicId[basicId];
      if (
        preliminaryPlacementIndex === undefined ||
        finalPlacementIndex === undefined
      ) {
        continue;
      }
      const transitionCounts =
        aggregate.preliminaryToFinalCountsByBasicId[basicId];
      transitionCounts[preliminaryPlacementIndex]![finalPlacementIndex] += 1;
    }
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
