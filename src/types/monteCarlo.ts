import type { LocalizedText } from "@/i18n";
import type { DangoId } from "@/types/game";

export type MonteCarloScenarioKind =
  | "normalRace"
  | "tournament"
  | "final";

export type PlacementCountVector = number[];

export type PlacementCountMatrix = PlacementCountVector[];

export type ConditionalPlacementSnapshot = {
  sampleSize: number;
  placementCountsByBasicId: Record<string, PlacementCountVector>;
};

export type MonteCarloAggregateSnapshot = {
  totalRuns: number;
  selectedBasicIds: DangoId[];
  participantCount: number;
  scenarioKind: MonteCarloScenarioKind;
  scenarioLabel: LocalizedText;
  winsByBasicId: Record<string, number>;
  preliminaryWinsByBasicId: Record<string, number>;
  finalPlacementCountsByBasicId: Record<string, PlacementCountVector>;
  preliminaryPlacementCountsByBasicId: Record<string, PlacementCountVector>;
  conditionalPlacementCountsByWinnerId: Record<
    string,
    ConditionalPlacementSnapshot
  >;
  preliminaryToFinalCountsByBasicId: Record<string, PlacementCountMatrix>;
  sumTurns: number;
  sumPreliminaryTurns: number;
  sumFinalTurns: number;
  minTurns: number;
  maxTurns: number;
  stackCarrierObservationSumByBasicId: Record<string, number>;
};
