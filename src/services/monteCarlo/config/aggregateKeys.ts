import type { MonteCarloAggregateSnapshot } from "@/types/monteCarlo";

export const NON_ADDITIVE_AGGREGATE_KEYS = new Set<
  keyof MonteCarloAggregateSnapshot
>([
  "selectedBasicIds",
  "participantCount",
  "scenarioKind",
  "scenarioLabel",
  "basicAnalyticsByBasicId",
  "basicAnalyticsByContext",
  "modeAnalytics",
  "observerRecords",
  "totalRuntimeMs",
]);

export const NON_TRANSFERRED_AGGREGATE_KEYS = NON_ADDITIVE_AGGREGATE_KEYS;
