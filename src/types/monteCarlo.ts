import type { DangoId } from "@/types/game";

export type MonteCarloScenarioKind =
  | "normalRace"
  | "tournament"
  | "final";

export type MonteCarloAggregateSnapshot = {
  totalRuns: number;
  selectedBasicIds: DangoId[];
  scenarioKind: MonteCarloScenarioKind;
  scenarioLabel: string;
  winsByBasicId: Record<string, number>;
  preliminaryWinsByBasicId: Record<string, number>;
  sumTurns: number;
  sumPreliminaryTurns: number;
  sumFinalTurns: number;
  minTurns: number;
  maxTurns: number;
  stackCarrierObservationSumByBasicId: Record<string, number>;
};
