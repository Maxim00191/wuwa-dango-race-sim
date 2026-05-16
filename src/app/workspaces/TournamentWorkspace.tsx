import { TournamentSetupPanel } from "@/components/TournamentSetupPanel";
import {
  useSharedSimulation,
  useTournamentWorkspace,
} from "@/app/contexts/workspaceContexts";
import { RaceStartButton } from "@/app/components/RaceStartButton";
import { RaceWorkspaceView } from "@/app/workspaces/RaceWorkspaceView";
import { useTranslation } from "@/i18n/useTranslation";

export function TournamentWorkspace() {
  const { t } = useTranslation();
  const shared = useSharedSimulation();
  const tournament = useTournamentWorkspace();

  return (
    <RaceWorkspaceView
      monteCarlo={{
        heading: t("tournament.monteCarlo.heading"),
        title: t("tournament.monteCarlo.title"),
        description: t("tournament.monteCarlo.description"),
        lineupBasicIds: tournament.resolvedLineupBasicIds,
        runDisabled: tournament.monteCarloRunDisabled,
        scenarioOptions: [
          {
            id: "tournament",
            label: t("tournament.monteCarlo.scenarios.tournament.label"),
            description: t(
              "tournament.monteCarlo.scenarios.tournament.description"
            ),
          },
          {
            id: "final",
            label: t("tournament.monteCarlo.scenarios.final.label"),
            description: t("tournament.monteCarlo.scenarios.final.description"),
          },
        ],
        selectedScenarioId: tournament.selectedMonteCarloScenarioId,
        onSelectedScenarioChange: (scenarioId) =>
          tournament.setSelectedMonteCarloScenarioId(
            scenarioId as "tournament" | "final"
          ),
        onRunBatch: tournament.requestMonteCarloBatch,
      }}
      race={{
        state: tournament.tournament.race.state,
        rankingState: tournament.tournament.race.rankingState,
        broadcastPayload: tournament.tournament.race.broadcastPayload,
        boardCells: tournament.tournament.race.boardCells,
        hoppingEntityIds: tournament.tournament.race.hoppingEntityIds,
        idleParticipantIds: shared.idleParticipantIds,
        headerEyebrow: t("tournament.shell.eyebrow"),
        headerTitle: t("tournament.shell.title"),
        headerDescription: t("tournament.shell.description"),
        sessionLabel: tournament.sessionLabel,
        mapSelectorDisabled: tournament.mapSelectorDisabled,
        setupPanel: (
          <TournamentSetupPanel
            rosterBasics={shared.rosterBasics}
            selectedBasicIds={shared.lineup.selectedBasicIds}
            onSetLineup={shared.lineup.setLineup}
            onToggleBasicId={shared.lineup.toggleSelectedBasicId}
            onClearSelections={shared.lineup.clearSelectedBasicIds}
            finalPlacements={tournament.tournament.finalPlacements}
            preliminaryPlacements={tournament.tournament.preliminaryPlacements}
            onSetFinalPlacements={tournament.tournament.setFinalPlacements}
            onMovePlacement={tournament.tournament.moveFinalPlacement}
            onStartPreliminary={tournament.beginPreliminary}
            onStartFinal={tournament.beginFinal}
            onRestorePreliminaryPlacements={
              tournament.tournament.restorePreliminaryPlacements
            }
            onReset={tournament.flushPlaybackAndResetTournament}
            controlsLocked={tournament.controlsLocked}
          />
        ),
        showSetupPanel: tournament.tournament.race.state.phase === "idle",
        startControls: (
          <RaceStartButton
            label={t("normal.shell.start")}
            disabled={tournament.restartDisabled}
            onClick={
              tournament.restartStartsFinal
                ? tournament.beginFinal
                : tournament.beginPreliminary
            }
          />
        ),
        resetAdjacentControls: tournament.canLaunchFinalFromPreliminary ? (
          <RaceStartButton
            label={t("tournament.setup.finals.start")}
            disabled={tournament.launchFinalDisabled}
            onClick={tournament.beginFinal}
            variant="final"
          />
        ) : null,
        onStartSprint: tournament.restartStartsFinal
          ? tournament.beginFinal
          : tournament.beginPreliminary,
        startShortcutDisabled: tournament.restartDisabled,
        onPlayTurn: tournament.tournament.race.playTurn,
        onStepAction: tournament.tournament.race.stepAction,
        onInstantTurn: tournament.replay.quickResolveTurn,
        onInstantGame: tournament.replay.quickResolveRace,
        onReset: tournament.flushPlaybackAndClearRace,
        isAnimating: tournament.tournament.race.isAnimating,
        playTurnEnabled: tournament.tournament.race.playTurnEnabled,
        autoPlayEnabled: tournament.tournament.race.autoPlayEnabled,
        onAutoPlayEnabledChange: tournament.tournament.race.setAutoPlayEnabled,
        spectate: tournament.spectate,
      }}
    />
  );
}
