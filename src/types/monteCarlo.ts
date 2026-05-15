import type { LocalizedText } from "@/i18n";
import type { MonteCarloObserverRecords } from "@/types/observer";
import type { DangoId, RaceMode } from "@/types/game";
import type { MatchRecord } from "@/types/replay";

export type MonteCarloScenarioKind =
  | "normalRace"
  | "tournament"
  | "final";

export type MonteCarloRaceContext = "sprint" | "preliminary" | "final";

export type PlacementCountVector = number[];

export type PlacementCountMatrix = PlacementCountVector[];

export type StackRoleKey = "solo" | "driver" | "passenger" | "crown";

export type CellEffectAnalyticsKey =
  | "propulsionDevice"
  | "hindranceDevice"
  | "timeRift";

export type OneTimeSkillKey =
  | "aemeathMidpointLeap"
  | "iunoAnchoredDestiny"
  | "hiyukiMetAbby"
  | "cartethyiaComebackAwaken";

export type StackRoleObservationCounts = Record<StackRoleKey, number>;

export type CellEffectTriggerCounts = Record<CellEffectAnalyticsKey, number>;

export type HeadlessRaceBasicMetrics = {
  startingDisplacement: number;
  ownTurnProgress: number;
  passiveProgress: number;
  carriedProgress: number;
  activeTurnCount: number;
  passengerRideTurnCount: number;
  roleObservationCounts: StackRoleObservationCounts;
  cellEffectTriggerCounts: CellEffectTriggerCounts;
  oneTimeSkillActivationTurnBySkillKey: Partial<
    Record<OneTimeSkillKey, number>
  >;
};

export type HeadlessRaceDeepMetrics = {
  mode: RaceMode;
  winnerBasicId: DangoId | null;
  turnsAtFinish: number;
  finalPlacements: DangoId[];
  startingPlacementByBasicId: Record<string, number>;
  startedWithMaxProgressDebtBasicIds: DangoId[];
  basicMetricsById: Record<string, HeadlessRaceBasicMetrics>;
};

export type HeadlessScenarioModeMetrics =
  | {
      kind: "singleRace";
      finalStartingPlacementByBasicId: Record<string, number>;
    }
  | {
      kind: "tournament";
      preliminaryPlacementByBasicId: Record<string, number>;
      finalStartingPlacementByBasicId: Record<string, number>;
      preliminaryWinnerRetainedTitle: boolean;
    };

export type HeadlessCapturedMatchReplay =
  | { scenarioKind: "singleRace"; record: MatchRecord }
  | {
      scenarioKind: "tournament";
      preliminary: MatchRecord;
      final: MatchRecord;
    };

export type HeadlessSimulationOutcome = {
  scenarioKind: "singleRace" | "tournament";
  winnerBasicId: DangoId | null;
  turnsAtFinish: number;
  preliminaryTurnsAtFinish: number;
  finalTurnsAtFinish: number;
  preliminaryWinnerBasicId: DangoId | null;
  finalPlacements: DangoId[];
  preliminaryPlacements: DangoId[] | null;
  raceMetrics: {
    preliminary: HeadlessRaceDeepMetrics | null;
    final: HeadlessRaceDeepMetrics;
  };
  modeMetrics: HeadlessScenarioModeMetrics;
  capturedReplay?: HeadlessCapturedMatchReplay;
};

export type ConditionalPlacementSnapshot = {
  sampleSize: number;
  placementCountsByBasicId: Record<string, PlacementCountVector>;
};

export type SkillActivationAggregateTotals = {
  activationCount: number;
  activationTurnSum: number;
  activationWinCount: number;
  winningActivationTurnSum: number;
  placementCountsByActivationTurn: Record<string, PlacementCountVector>;
};

export type MonteCarloBasicMetricTotals = {
  ownTurnProgressSum: number;
  passiveProgressSum: number;
  carriedProgressSum: number;
  activeTurnCountSum: number;
  passengerRideTurnCountSum: number;
  roleObservationSums: StackRoleObservationCounts;
  cellEffectTriggerSums: CellEffectTriggerCounts;
  racesWithCellEffectTriggerCounts: CellEffectTriggerCounts;
  winsWithCellEffectTriggerCounts: CellEffectTriggerCounts;
  scenariosWithPassiveLeadCount: number;
  winsWithPassiveLeadCount: number;
  scenariosWithCarriedLeadCount: number;
  winsWithCarriedLeadCount: number;
  scenariosWithHighHindranceCount: number;
  winsWithHighHindranceCount: number;
  hindranceTriggerCountInWinningScenarios: number;
  oncePerRaceSkillTotalsByMode: Partial<
    Record<
      RaceMode,
      Partial<Record<OneTimeSkillKey, SkillActivationAggregateTotals>>
    >
  >;
};

export type MonteCarloSkillTimingSummary = {
  activationCount: number;
  activationRate: number;
  averageActivationTurn: number | null;
  titleConversionRate: number;
  averageWinningActivationTurn: number | null;
  bestActivationTurn: number | null;
  bestActivationTurnTitleConversionRate: number;
  titleConversionRateByActivationTurn: Record<string, number>;
  averagePlacementByActivationTurn: Record<string, number | null>;
  placementCountsByActivationTurn: Record<string, PlacementCountVector>;
};

export type MonteCarloProgressTopography = {
  averageOwnTurnProgress: number;
  averagePassiveProgress: number;
  averageCarriedProgress: number;
  averageTotalProgress: number;
  averageOwnTurnProgressPerTurn: number;
  averagePassiveProgressPerCarriedTurn: number;
  averageCarriedProgressPerRideTurn: number;
  passiveProgressShare: number;
  carriedProgressShare: number;
  passiveToOwnProgressRatio: number | null;
  carriedToOwnProgressRatio: number | null;
  passiveLeadRate: number;
  passiveLeadTitleConversionRate: number;
  carriedLeadRate: number;
  carriedLeadTitleConversionRate: number;
};

export type MonteCarloStackEcosystemSummary = {
  roleRates: StackRoleObservationCounts;
  carriedRoleRate: number;
};

export type MonteCarloTrapAffinitySummary = {
  averageTriggers: CellEffectTriggerCounts;
  triggerRates: CellEffectTriggerCounts;
  titleConversionRates: CellEffectTriggerCounts;
  hindranceResilienceRate: number;
  highHindranceRate: number;
  highHindranceTitleConversionRate: number;
  averageHindranceTriggersWhenWinning: number;
};

export type MonteCarloBasicAnalytics = {
  progressTopography: MonteCarloProgressTopography;
  stackEcosystem: MonteCarloStackEcosystemSummary;
  trapAffinity: MonteCarloTrapAffinitySummary;
  skillTimingByMode: Partial<
    Record<
      RaceMode,
      Partial<Record<OneTimeSkillKey, MonteCarloSkillTimingSummary>>
    >
  >;
};

export type MonteCarloContextAnalytics = {
  raceCount: number;
  winsByBasicId: Record<string, number>;
  placementCountsByBasicId: Record<string, PlacementCountVector>;
  basicAnalyticsByBasicId: Record<string, MonteCarloBasicAnalytics>;
};

export type MonteCarloSeedDynamics = {
  transitionMatrix: PlacementCountMatrix;
  titleCountsByStartingPlacement: PlacementCountVector;
  titleRatesByStartingPlacement: number[];
  averageFinalPlacementByStartingPlacement: Array<number | null>;
  averagePlacementDeltaByStartingPlacement: Array<number | null>;
};

export type MonteCarloRankShiftDynamics = {
  averageFinalMinusPreliminaryRankByBasicId: Record<string, number | null>;
  chokeRateByBasicId: Record<string, number>;
  clutchRateByBasicId: Record<string, number>;
  chokeOpportunityCountByBasicId: Record<string, number>;
  clutchOpportunityCountByBasicId: Record<string, number>;
  overallAverageFinalMinusPreliminaryRank: number | null;
  overallChokeRate: number;
  overallClutchRate: number;
};

export type MonteCarloModeAnalytics =
  | {
      kind: "normalRace";
    }
  | {
      kind: "final";
      startingPlacementDynamics: MonteCarloSeedDynamics;
      finalStartingPlacementDynamics: MonteCarloSeedDynamics;
      maxDebtComebackRate: number;
      maxDebtComebackRateByBasicId: Record<string, number>;
      startedWithMaxDebtRateByBasicId: Record<string, number>;
    }
  | {
      kind: "tournament";
      preliminaryPlacementDynamics: MonteCarloSeedDynamics;
      finalStartingPlacementDynamics: MonteCarloSeedDynamics;
      preliminaryToFinalRankShift: MonteCarloRankShiftDynamics;
      preliminaryWinnerRetainedTitleRate: number;
      preliminaryWinnerRetainedTitleRateByBasicId: Record<string, number>;
      preliminaryWinnerFinalPlacementRates: number[];
      maxDebtComebackRate: number;
      maxDebtComebackRateByBasicId: Record<string, number>;
      startedWithMaxDebtRateByBasicId: Record<string, number>;
    };

export type MonteCarloAggregateSnapshot = {
  totalRuns: number;
  totalRuntimeMs?: number;
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
  raceCountByMode: Partial<Record<RaceMode, number>>;
  startingToFinalCountsByBasicId: Record<string, PlacementCountMatrix>;
  preliminaryToFinalCountsByBasicId: Record<string, PlacementCountMatrix>;
  sumTurns: number;
  sumPreliminaryTurns: number;
  sumFinalTurns: number;
  minTurns: number;
  maxTurns: number;
  preliminaryWinnerFinalPlacementCounts: PlacementCountVector;
  basicMetricTotalsByBasicId: Record<string, MonteCarloBasicMetricTotals>;
  startedFinalWithMaxDebtCountByBasicId: Record<string, number>;
  wonFinalFromMaxDebtCountByBasicId: Record<string, number>;
  basicAnalyticsByBasicId: Record<string, MonteCarloBasicAnalytics>;
  raceCountByContext: Record<MonteCarloRaceContext, number>;
  winsByContext: Record<MonteCarloRaceContext, Record<string, number>>;
  placementCountsByContext: Record<
    MonteCarloRaceContext,
    Record<string, PlacementCountVector>
  >;
  basicMetricTotalsByContext: Record<
    MonteCarloRaceContext,
    Record<string, MonteCarloBasicMetricTotals>
  >;
  basicAnalyticsByContext: Record<
    MonteCarloRaceContext,
    MonteCarloContextAnalytics
  >;
  tournamentRankShiftSumByBasicId: Record<string, number>;
  tournamentRankShiftCountByBasicId: Record<string, number>;
  tournamentChokeOpportunityCountByBasicId: Record<string, number>;
  tournamentChokeCountByBasicId: Record<string, number>;
  tournamentClutchOpportunityCountByBasicId: Record<string, number>;
  tournamentClutchCountByBasicId: Record<string, number>;
  modeAnalytics: MonteCarloModeAnalytics;
  observerRecords?: MonteCarloObserverRecords;
};
