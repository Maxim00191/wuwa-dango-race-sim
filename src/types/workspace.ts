import type { ReactNode } from "react";
import type { BroadcastBannerPayload } from "@/components/BroadcastBanner";
import type { GameShellSpectate } from "@/types/gameShell";
import type { MonteCarloScenarioOption } from "@/components/MonteCarloPanel";
import type { MapId } from "@/constants/maps";
import type { DangoId, GameState } from "@/types/game";

export type RaceWorkspaceMonteCarloConfig = {
  heading: string;
  title: string;
  description: string;
  lineupBasicIds: DangoId[];
  lineupComplete?: boolean;
  runDisabled: boolean;
  scenarioOptions: MonteCarloScenarioOption[];
  selectedScenarioId: string;
  onSelectedScenarioChange: (scenarioId: string) => void;
  onRunBatch: (scenarioId: string, totalGames: number) => void;
};

export type RaceWorkspaceMonteCarloCoordinator = {
  isStopping: boolean;
  extremePerformanceEnabled: boolean;
  onExtremePerformanceEnabledChange: (enabled: boolean) => void;
  onAbortRun: () => void;
};

export type RaceWorkspaceSharedMap = {
  selectedMapId: MapId | null;
  onSelectMapId: (mapId: MapId) => void;
  boardEffects: Map<number, string | null>;
};

export type RaceWorkspaceRaceConfig = {
  state: GameState;
  rankingState: GameState;
  broadcastPayload: BroadcastBannerPayload | null;
  boardCells: Map<number, DangoId[]>;
  hoppingEntityIds: Set<DangoId>;
  idleParticipantIds: DangoId[];
  headerEyebrow: string;
  headerTitle: string;
  headerDescription: string;
  sessionLabel: string;
  mapSelectorDisabled: boolean;
  setupPanel?: ReactNode;
  showSetupPanel: boolean;
  startControls: ReactNode;
  resetAdjacentControls?: ReactNode;
  onStartSprint: () => void;
  startShortcutDisabled: boolean;
  onPlayTurn: () => void;
  onStepAction: () => void;
  onInstantTurn: () => void;
  onInstantGame: () => void;
  onReset: () => void;
  isAnimating: boolean;
  playTurnEnabled: boolean;
  autoPlayEnabled: boolean;
  onAutoPlayEnabledChange: (enabled: boolean) => void;
  spectate: GameShellSpectate;
};

export type RaceWorkspaceViewProps = {
  monteCarlo: RaceWorkspaceMonteCarloConfig;
  monteCarloCoordinator: RaceWorkspaceMonteCarloCoordinator;
  sharedMap: RaceWorkspaceSharedMap;
  race: RaceWorkspaceRaceConfig;
};
