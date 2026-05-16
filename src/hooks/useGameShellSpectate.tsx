import { useMemo } from "react";
import { ReplayTimelineCluster } from "@/components/ReplayTimelineCluster";
import type { GameShellSpectate } from "@/types/gameShell";
import type { useGame } from "@/hooks/useGame";
import { useReplayImportExport } from "@/hooks/useReplayImportExport";
import { useReplayToolbarLabels } from "@/hooks/useReplayToolbarLabels";
import type { useReplayTimeline } from "@/hooks/useReplayTimeline";
import { useTranslation } from "@/i18n/useTranslation";
import { computeSpectateControlDisabled } from "@/services/spectateControls";

type GameShellSpectateGame = Pick<
  ReturnType<typeof useGame>,
  "state" | "isAnimating" | "playTurnEnabled"
>;

type GameShellSpectateReplay = ReturnType<typeof useReplayTimeline>;

export function useGameShellSpectate(
  game: GameShellSpectateGame,
  replay: GameShellSpectateReplay
): GameShellSpectate {
  const { t } = useTranslation();
  const labels = useReplayToolbarLabels();
  const { handleImport, handleExportCopy } = useReplayImportExport(replay);

  return useMemo((): GameShellSpectate => {
    const file = replay.isReplayLoaded;
    const { stepDisabled, playTurnDisabled, autoRunDisabled } =
      computeSpectateControlDisabled(
        {
          phase: game.state.phase,
          winnerId: game.state.winnerId,
          isAnimating: game.isAnimating,
          playTurnEnabled: game.playTurnEnabled,
        },
        {
          isReplayLoaded: replay.isReplayLoaded,
          timelineStep: replay.timelineStep,
          timelineMax: replay.timelineMax,
          spectateAutoActive: replay.spectateAutoActive,
          spectatePlayTurnChaining: replay.spectatePlayTurnChaining,
        }
      );

    return {
      replayFileActive: file,
      timelineVisible: file || game.state.phase !== "idle",
      timelineStep: replay.timelineStep,
      timelineMax: replay.timelineMax,
      onScrub: replay.scrubToStep,
      scrubAria: t("game.replay.scrubAria"),
      turnSummaryText: `${replay.timelineStep + 1} / ${replay.timelineMax + 1} · ${t("game.replay.seekEngineTurn")}: ${replay.currentEngineTurn}`,
      replayToolbar: (
        <ReplayTimelineCluster
          seekControlsVisible={replay.isReplayLoaded}
          canCopyJson={replay.canExportReplayJson}
          seekTurnDraft={replay.seekTurnDraft}
          onSeekTurnDraftChange={replay.setSeekTurnDraft}
          onSeekTurnSubmit={replay.seekToEngineTurn}
          onExportCopy={handleExportCopy}
          onImportFile={handleImport}
          jumpToPresentVisible={replay.jumpToPresentVisible}
          onJumpToPresent={replay.jumpToPresent}
          onStepBackward={replay.historyStepBack}
          onStepForward={replay.spectateAdvanceStep}
          stepBackwardDisabled={replay.timelineStep <= 0}
          stepForwardDisabled={stepDisabled}
          bannersEnabled={replay.replayBannersEnabled}
          onToggleBanners={replay.toggleReplayBanners}
          labels={labels}
        />
      ),
      onStep: replay.spectateAdvanceStep,
      onPlayTurn: replay.spectatePlayTurn,
      onToggleAuto: replay.spectateToggleAuto,
      autoActive: replay.spectateAutoActive,
      replayBannersEnabled: replay.replayBannersEnabled,
      replayBannerPayload: replay.replayBannerPayload,
      onToggleReplayBanners: replay.toggleReplayBanners,
      playTurnBusy: replay.spectatePlayTurnChaining,
      stepDisabled,
      playTurnDisabled,
      autoRunDisabled,
      onHistoryStepBack: replay.historyStepBack,
    };
  }, [
    game.isAnimating,
    game.playTurnEnabled,
    game.state.phase,
    game.state.winnerId,
    handleExportCopy,
    handleImport,
    labels,
    replay,
    t,
  ]);
}
