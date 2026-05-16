import { GameShell } from "@/components/GameShell";
import { MapSelector } from "@/components/MapSelector";
import { MonteCarloPanel } from "@/components/MonteCarloPanel";
import { useRaceWorkspaceMonteCarloCoordinator } from "@/hooks/useRaceWorkspaceMonteCarloCoordinator";
import { useRaceWorkspaceSharedMap } from "@/hooks/useRaceWorkspaceSharedMap";
import type {
  RaceWorkspaceMonteCarloConfig,
  RaceWorkspaceRaceConfig,
} from "@/types/workspace";

export type RaceWorkspaceViewProps = {
  monteCarlo: RaceWorkspaceMonteCarloConfig;
  race: RaceWorkspaceRaceConfig;
};

export function RaceWorkspaceView({ monteCarlo, race }: RaceWorkspaceViewProps) {
  const monteCarloCoordinator = useRaceWorkspaceMonteCarloCoordinator();
  const sharedMap = useRaceWorkspaceSharedMap();

  return (
    <>
      <MonteCarloPanel
        heading={monteCarlo.heading}
        title={monteCarlo.title}
        description={monteCarlo.description}
        lineupBasicIds={monteCarlo.lineupBasicIds}
        lineupComplete={monteCarlo.lineupComplete}
        runDisabled={monteCarlo.runDisabled}
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
