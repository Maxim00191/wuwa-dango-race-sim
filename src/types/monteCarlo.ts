import type { DangoId } from "@/types/game";

export type MonteCarloAggregateSnapshot = {
  totalRuns: number;
  selectedBasicIds: DangoId[];
  winsByBasicId: Record<string, number>;
  sumTurns: number;
  minTurns: number;
  maxTurns: number;
  stackCarrierObservationSumByBasicId: Record<string, number>;
};
