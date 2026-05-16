import { DangoPicker } from "@/components/DangoPicker";
import {
  useMonteCarloWorkspace,
  useNormalWorkspace,
  useSharedSimulation,
} from "@/app/contexts/workspaceContexts";
import { RaceStartButton } from "@/app/components/RaceStartButton";
import { RaceWorkspaceView } from "@/app/workspaces/RaceWorkspaceView";
import { useTranslation } from "@/i18n/useTranslation";

export function NormalWorkspace() {
  const { t } = useTranslation();
  const shared = useSharedSimulation();
  const monteCarlo = useMonteCarloWorkspace();
  const normal = useNormalWorkspace();

  return (
    <RaceWorkspaceView
      monteCarlo={{
        heading: t("normal.monteCarlo.heading"),
        title: t("normal.monteCarlo.title"),
        description: t("normal.monteCarlo.description"),
        lineupBasicIds: normal.resolvedLineupBasicIds,
        runDisabled: normal.monteCarloRunDisabled,
        scenarioOptions: [
          {
            id: "normalRace",
            label: t("normal.monteCarlo.scenario.label"),
            description: t("normal.monteCarlo.scenario.description"),
          },
        ],
        selectedScenarioId: "normalRace",
        onSelectedScenarioChange: () => {},
        onRunBatch: normal.requestMonteCarloBatch,
      }}
      monteCarloCoordinator={{
        progress: monteCarlo.monteCarlo.progress,
        isStopping: monteCarlo.monteCarlo.isStopping,
        extremePerformanceEnabled: monteCarlo.extremePerformanceEnabled,
        onExtremePerformanceEnabledChange: monteCarlo.setExtremePerformanceEnabled,
        onAbortRun: monteCarlo.abortRun,
      }}
      sharedMap={{
        selectedMapId: shared.mapSelection.selectedMapId,
        onSelectMapId: shared.mapSelection.setSelectedMapId,
        boardEffects: shared.mapSelection.boardEffects,
      }}
      race={{
        state: normal.game.state,
        rankingState: normal.game.rankingState,
        broadcastPayload: normal.game.broadcastPayload,
        boardCells: normal.game.boardCells,
        hoppingEntityIds: normal.game.hoppingEntityIds,
        idleParticipantIds: shared.idleParticipantIds,
        headerEyebrow: t("normal.shell.eyebrow"),
        headerTitle: t("normal.shell.title"),
        headerDescription: t("normal.shell.description"),
        sessionLabel: normal.sessionLabel,
        mapSelectorDisabled: normal.mapSelectorDisabled,
        setupPanel: (
          <DangoPicker
            rosterBasics={shared.rosterBasics}
            selectedBasicIds={shared.lineup.selectedBasicIds}
            onSetLineup={shared.lineup.setLineup}
            onToggleBasicId={shared.lineup.toggleSelectedBasicId}
            onClearSelections={shared.lineup.clearSelectedBasicIds}
          />
        ),
        showSetupPanel: normal.game.state.phase === "idle",
        startControls: (
          <RaceStartButton
            label={t("normal.shell.start")}
            disabled={normal.startDisabled}
            onClick={normal.beginSprint}
          />
        ),
        onStartSprint: normal.beginSprint,
        startShortcutDisabled: normal.startDisabled,
        onPlayTurn: normal.game.playTurn,
        onStepAction: normal.game.stepAction,
        onInstantTurn: normal.replay.quickResolveTurn,
        onInstantGame: normal.replay.quickResolveRace,
        onReset: normal.flushPlaybackAndReset,
        isAnimating: normal.game.isAnimating,
        playTurnEnabled: normal.game.playTurnEnabled,
        autoPlayEnabled: normal.game.autoPlayEnabled,
        onAutoPlayEnabledChange: normal.game.setAutoPlayEnabled,
        spectate: normal.spectate,
      }}
    />
  );
}
