import { useMemo, type ReactNode } from "react";
import type { BroadcastBannerPayload } from "@/components/BroadcastBanner";
import { GameShellBoardPanel } from "@/components/gameShell/GameShellBoardPanel";
import { GameShellPlaybackCluster } from "@/components/gameShell/GameShellPlaybackCluster";
import { GameShellQuickRunControls } from "@/components/gameShell/GameShellQuickRunControls";
import { GameShellSidebar } from "@/components/gameShell/GameShellSidebar";
import { GameShellWatchControls } from "@/components/gameShell/GameShellWatchControls";
import { useGameShellKeyboardShortcuts } from "@/hooks/useGameShellKeyboardShortcuts";
import { usePersistentTurnQueuePresentation } from "@/hooks/usePersistentTurnQueuePresentation";
import { computeGameShellControlDisabled } from "@/services/gameShellControls";
import type { GameShellSpectate } from "@/types/gameShell";
import type { DangoId, GameState } from "@/types/game";

export type { GameShellSpectate } from "@/types/gameShell";

type GameShellProps = {
  state: GameState;
  rankingState: GameState;
  broadcastPayload: BroadcastBannerPayload | null;
  boardCells: Map<number, DangoId[]>;
  boardEffects: Map<number, string | null>;
  hoppingEntityIds: Set<DangoId>;
  idleParticipantIds: DangoId[];
  headerEyebrow: string;
  headerTitle: string;
  headerDescription: string;
  sessionLabel: string;
  mapSelector?: ReactNode;
  setupPanel?: ReactNode;
  showSetupPanel?: boolean;
  startControls: ReactNode;
  onStartSprint?: () => void;
  startShortcutDisabled?: boolean;
  onPlayTurn: () => void;
  onStepAction: () => void;
  onInstantTurn: () => void;
  onInstantGame: () => void;
  resetAdjacentControls?: ReactNode;
  onReset: () => void;
  isAnimating: boolean;
  playTurnEnabled: boolean;
  autoPlayEnabled: boolean;
  onAutoPlayEnabledChange: (nextValue: boolean) => void;
  spectate?: GameShellSpectate;
};

export function GameShell({
  state,
  rankingState,
  broadcastPayload,
  boardCells,
  boardEffects,
  hoppingEntityIds,
  idleParticipantIds,
  headerEyebrow,
  headerTitle,
  headerDescription,
  sessionLabel,
  mapSelector,
  setupPanel,
  showSetupPanel = false,
  startControls,
  onStartSprint,
  startShortcutDisabled = true,
  onPlayTurn,
  onStepAction,
  onInstantTurn,
  onInstantGame,
  resetAdjacentControls,
  onReset,
  isAnimating,
  playTurnEnabled,
  autoPlayEnabled,
  onAutoPlayEnabledChange,
  spectate,
}: GameShellProps) {
  const controlDisabled = useMemo(
    () =>
      computeGameShellControlDisabled(
        {
          phase: state.phase,
          winnerId: state.winnerId,
          isAnimating,
          playTurnEnabled,
          autoPlayEnabled,
        },
        { onStartSprint, startShortcutDisabled, spectate }
      ),
    [
      autoPlayEnabled,
      isAnimating,
      onStartSprint,
      playTurnEnabled,
      spectate,
      startShortcutDisabled,
      state.phase,
      state.winnerId,
    ]
  );
  const turnQueuePresentation = usePersistentTurnQueuePresentation(
    state,
    isAnimating
  );
  const showWinnerBadge =
    state.phase === "finished" && Boolean(state.winnerId) && !isAnimating;
  const visibleBroadcastPayload =
    spectate?.replayBannerPayload ?? broadcastPayload;

  useGameShellKeyboardShortcuts(controlDisabled, {
    onStartSprint,
    onPlayTurn,
    onStepAction,
    onInstantGame,
    onAutoPlayEnabledChange,
    autoPlayEnabled,
    spectate,
  });

  return (
    <div className="flex w-full flex-1 flex-col gap-5 px-3 py-6 text-slate-900 dark:text-slate-100 sm:gap-6 sm:px-6 sm:py-8 md:px-10 lg:gap-8 lg:px-14 xl:px-16 2xl:px-24">
      <header className="flex w-full flex-col gap-3">
        <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-xl">
          {headerEyebrow}
        </p>
        <div className="min-w-0 max-w-4xl">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl md:text-4xl">
            {headerTitle}
          </h1>
          <p className="mt-2 max-w-none text-sm font-normal leading-6 text-slate-500 dark:text-slate-400 md:text-base lg:text-lg">
            {headerDescription}
          </p>
        </div>
      </header>

      {mapSelector}
      {showSetupPanel ? setupPanel : null}

      <div className="flex w-full flex-col gap-3 sm:gap-4">
        <div className="grid w-full grid-cols-1 items-stretch gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-[minmax(0,1.35fr)_auto_minmax(0,0.9fr)]">
          <GameShellWatchControls
            disabled={controlDisabled}
            startControls={startControls}
            resetAdjacentControls={resetAdjacentControls}
            playTurnEnabled={playTurnEnabled}
            autoPlayEnabled={autoPlayEnabled}
            onAutoPlayEnabledChange={onAutoPlayEnabledChange}
            onPlayTurn={onPlayTurn}
            onStepAction={onStepAction}
            onReset={onReset}
            spectate={spectate}
          />
          <GameShellPlaybackCluster />
          <GameShellQuickRunControls
            disabled={controlDisabled}
            onInstantTurn={onInstantTurn}
            onInstantGame={onInstantGame}
          />
        </div>
      </div>

      <div className="grid min-h-0 w-full flex-1 items-start gap-5 lg:grid-cols-[minmax(0,2.3fr)_minmax(18rem,1fr)] lg:gap-8 xl:grid-cols-[minmax(0,2.85fr)_minmax(19rem,1fr)] xl:gap-10 2xl:grid-cols-[minmax(0,3.1fr)_minmax(20rem,1fr)]">
        <GameShellBoardPanel
          state={state}
          sessionLabel={sessionLabel}
          showWinnerBadge={showWinnerBadge}
          boardCells={boardCells}
          boardEffects={boardEffects}
          hoppingEntityIds={hoppingEntityIds}
          visibleBroadcastPayload={visibleBroadcastPayload}
          turnQueuePresentation={turnQueuePresentation}
          spectate={spectate}
        />
        <GameShellSidebar
          state={state}
          rankingState={rankingState}
          idleParticipantIds={idleParticipantIds}
        />
      </div>
    </div>
  );
}
