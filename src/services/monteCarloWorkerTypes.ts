import type { LocalizedText } from "@/i18n";
import type { HeadlessSimulationScenario } from "@/services/gameEngine";
import type {
  MonteCarloAggregateSnapshot,
  MonteCarloScenarioKind,
} from "@/types/monteCarlo";
import type { MonteCarloObserverRecords } from "@/types/observer";
import type { DangoId } from "@/types/game";

export type SerializedBoardEffects = Array<[number, string | null]>;

export type MonteCarloWorkerRequest = {
  type: "run";
  requestId: number;
  totalRuns: number;
  seedBase: number;
  progressReportInterval: number;
  scenario: HeadlessSimulationScenario;
  selectedBasicIds: DangoId[];
  scenarioKind: MonteCarloScenarioKind;
  scenarioLabel: LocalizedText;
  boardEffects: SerializedBoardEffects;
};

export type MonteCarloWorkerProgressMessage = {
  type: "progress";
  requestId: number;
  completedRuns: number;
};

export type MonteCarloWorkerCompleteMessage = {
  type: "complete";
  requestId: number;
  payload: ArrayBuffer;
};

export type MonteCarloWorkerCompletePayload = {
  aggregate: Partial<MonteCarloAggregateSnapshot>;
  observerRecords: MonteCarloObserverRecords;
};

export type MonteCarloWorkerErrorMessage = {
  type: "error";
  requestId: number;
  message: string;
};

export type MonteCarloWorkerMessage =
  | MonteCarloWorkerProgressMessage
  | MonteCarloWorkerCompleteMessage
  | MonteCarloWorkerErrorMessage;
