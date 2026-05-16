import { ABBY_ID } from "@/constants/ids";
import { KnockoutSetupPanel } from "@/components/KnockoutSetupPanel";
import {
  useKnockoutWorkspace,
  useSharedSimulation,
} from "@/app/contexts/workspaceContexts";
import { RaceStartButton } from "@/app/components/RaceStartButton";
import { RaceWorkspaceView } from "@/app/workspaces/RaceWorkspaceView";
import { useTranslation } from "@/i18n/useTranslation";

export function KnockoutWorkspace() {
  const { t } = useTranslation();
  const shared = useSharedSimulation();
  const knockout = useKnockoutWorkspace();

  return (
    <RaceWorkspaceView
      monteCarlo={{
        heading: t("knockout.monteCarlo.heading"),
        title: t("knockout.monteCarlo.title"),
        description: t("knockout.monteCarlo.description"),
        lineupBasicIds: knockout.participantIds,
        lineupComplete: knockout.lineup.isReady,
        runDisabled: knockout.monteCarloRunDisabled,
        scenarioOptions: [
          {
            id: "knockoutTournament",
            label: t("knockout.monteCarlo.scenario.label"),
            description: t("knockout.monteCarlo.scenario.description"),
          },
        ],
        selectedScenarioId: "knockoutTournament",
        onSelectedScenarioChange: () => {},
        onRunBatch: knockout.requestMonteCarloBatch,
      }}
      race={{
        state: knockout.tournament.race.state,
        rankingState: knockout.tournament.race.rankingState,
        broadcastPayload: knockout.tournament.race.broadcastPayload,
        boardCells: knockout.tournament.race.boardCells,
        hoppingEntityIds: knockout.tournament.race.hoppingEntityIds,
        idleParticipantIds: [...knockout.participantIds, ABBY_ID],
        headerEyebrow: t("knockout.shell.eyebrow"),
        headerTitle: t("knockout.shell.title"),
        headerDescription: t("knockout.shell.description"),
        sessionLabel: knockout.sessionLabel,
        mapSelectorDisabled: knockout.mapSelectorDisabled,
        setupPanel: (
          <KnockoutSetupPanel
            rosterBasics={shared.rosterBasics}
            groupAIds={knockout.lineup.groupAIds}
            groupBIds={knockout.lineup.groupBIds}
            onSetGroupLineup={knockout.lineup.setGroupLineup}
            onToggleGroupBasicId={knockout.lineup.toggleGroupBasicId}
            onClearGroupSelections={knockout.lineup.clearGroupSelections}
            progress={knockout.tournament.progress}
            lineupsReady={knockout.lineup.isReady}
            isComplete={knockout.tournament.isComplete}
            onStartTournament={knockout.beginPhase}
            onAdvanceTournament={knockout.beginPhase}
            onReset={knockout.flushPlaybackAndReset}
            controlsLocked={knockout.controlsLocked}
          />
        ),
        showSetupPanel: knockout.tournament.race.state.phase === "idle",
        startControls: (
          <RaceStartButton
            label={t("normal.shell.start")}
            disabled={knockout.startDisabled}
            onClick={knockout.beginPhase}
          />
        ),
        onStartSprint: knockout.beginPhase,
        startShortcutDisabled: knockout.startDisabled,
        onPlayTurn: knockout.tournament.race.playTurn,
        onStepAction: knockout.tournament.race.stepAction,
        onInstantTurn: knockout.replay.quickResolveTurn,
        onInstantGame: knockout.replay.quickResolveRace,
        onReset: knockout.flushPlaybackAndClearRace,
        isAnimating: knockout.tournament.race.isAnimating,
        playTurnEnabled: knockout.tournament.race.playTurnEnabled,
        autoPlayEnabled: knockout.tournament.race.autoPlayEnabled,
        onAutoPlayEnabledChange: knockout.tournament.race.setAutoPlayEnabled,
        spectate: knockout.spectate,
      }}
    />
  );
}
