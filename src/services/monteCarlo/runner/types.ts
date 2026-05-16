import type { HeadlessSimulationScenario } from "@/services/gameEngine";
import type { LocalizedText } from "@/i18n";
import type { DangoId } from "@/types/game";
import type {
  MonteCarloAggregateSnapshot,
  MonteCarloScenarioKind,
} from "@/types/monteCarlo";

export type MonteCarloRunnerControls = {
  totalRuns: number;
  scenario: HeadlessSimulationScenario;
  selectedBasicIds: DangoId[];
  scenarioKind: MonteCarloScenarioKind;
  scenarioLabel: LocalizedText;
  boardEffectByCellIndex: Map<number, string | null>;
  onProgress: (completedGames: number, totalGames: number) => void;
  signal?: AbortSignal;
  shouldAbort?: () => boolean;
  extremePerformance?: boolean;
};

export type MonteCarloExecutionStrategy = "worker" | "timeSlice";

export type MonteCarloBatchResult = {
  completedRuns: number;
  aborted: boolean;
  strategy: MonteCarloExecutionStrategy;
  snapshot: MonteCarloAggregateSnapshot | null;
};
