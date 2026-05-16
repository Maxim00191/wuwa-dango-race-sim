import {
  createEmptyMonteCarloAggregate,
  finalizeMonteCarloAggregate,
} from "@/services/monteCarlo/aggregate";
import {
  finalizeObserverRecords,
  type ObserverSession,
} from "@/services/observerSession";
import type { MonteCarloRunnerControls } from "@/services/monteCarlo/runner/types";
import type { MonteCarloAggregateSnapshot } from "@/types/monteCarlo";

export function createResultAggregate(
  controls: MonteCarloRunnerControls
): MonteCarloAggregateSnapshot {
  return createEmptyMonteCarloAggregate(
    controls.selectedBasicIds,
    controls.scenarioKind,
    controls.scenarioLabel
  );
}

export function finalizeResultAggregate(
  aggregate: MonteCarloAggregateSnapshot,
  observerSession: ObserverSession
): MonteCarloAggregateSnapshot | null {
  if (aggregate.totalRuns === 0) {
    return null;
  }
  return {
    ...finalizeMonteCarloAggregate(aggregate),
    observerRecords: finalizeObserverRecords(observerSession),
  };
}
