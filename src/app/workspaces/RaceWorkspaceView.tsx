import type { ReactNode } from "react";
import type { BroadcastBannerPayload } from "@/components/BroadcastBanner";
import { GameShell, type GameShellSpectate } from "@/components/GameShell";
import { MapSelector } from "@/components/MapSelector";
import {
  MonteCarloPanel,
  type MonteCarloScenarioOption,
} from "@/components/MonteCarloPanel";
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
  progress: {
    completedGames: number;
    totalGames: number;
    timeRemainingLabel: string | null;
  } | null;
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

export function RaceWorkspaceView({
  monteCarlo,
  monteCarloCoordinator,
  sharedMap,
  race,
}: RaceWorkspaceViewProps) {
  return (
    <>
      <MonteCarloPanel
        heading={monteCarlo.heading}
        title={monteCarlo.title}
        description={monteCarlo.description}
        lineupBasicIds={monteCarlo.lineupBasicIds}
        lineupComplete={monteCarlo.lineupComplete}
        runDisabled={monteCarlo.runDisabled}
        progress={monteCarloCoordinator.progress}
        isStopping={monteCarloCoordinator.isStopping}
        extremePerformanceEnabled={monteCarloCoordinator.extremePerformanceEnabled}
        onExtremePerformanceEnabledChange={
          monteCarloCoordinator.onExtremePerformanceEnabledChange
        }
        scenarioOptions={monteCarlo.scenarioOptions}
        selectedScenarioId={monteCarlo.selectedScenarioId}
        onSelectedScenarioChange={monteCarlo.onSelectedScenarioChange}
        onRunBatch={monteCarlo.onRunBatch}
        onAbortRun={monteCarloCoordinator.onAbortRun}
      />
      <GameShell
        state={race.state}
        rankingState={race.rankingState}
        broadcastPayload={race.broadcastPayload}
        boardCells={race.boardCells}
        boardEffects={sharedMap.boardEffects}
        mapSelector={
          <MapSelector
            selectedMapId={sharedMap.selectedMapId}
            onSelectMapId={sharedMap.onSelectMapId}
            disabled={race.mapSelectorDisabled}
          />
        }
        hoppingEntityIds={race.hoppingEntityIds}
        idleParticipantIds={race.idleParticipantIds}
        headerEyebrow={race.headerEyebrow}
        headerTitle={race.headerTitle}
        headerDescription={race.headerDescription}
        sessionLabel={race.sessionLabel}
        setupPanel={race.setupPanel}
        showSetupPanel={race.showSetupPanel}
        startControls={race.startControls}
        resetAdjacentControls={race.resetAdjacentControls}
        onStartSprint={race.onStartSprint}
        startShortcutDisabled={race.startShortcutDisabled}
        onPlayTurn={race.onPlayTurn}
        onStepAction={race.onStepAction}
        onInstantTurn={race.onInstantTurn}
        onInstantGame={race.onInstantGame}
        onReset={race.onReset}
        isAnimating={race.isAnimating}
        playTurnEnabled={race.playTurnEnabled}
        autoPlayEnabled={race.autoPlayEnabled}
        onAutoPlayEnabledChange={race.onAutoPlayEnabledChange}
        spectate={race.spectate}
      />
    </>
  );
}
