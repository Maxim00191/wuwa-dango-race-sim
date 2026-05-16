import { TurnQueueViewer } from "@/components/TurnQueueViewer";
import {
  BroadcastBanner,
  type BroadcastBannerPayload,
} from "@/components/BroadcastBanner";
import { CircularBoard } from "@/components/CircularBoard";
import { BOARD_LEGEND_ENTRIES } from "@/components/gameShell/boardLegendConfig";
import { useTranslation } from "@/i18n/useTranslation";
import type { usePersistentTurnQueuePresentation } from "@/hooks/usePersistentTurnQueuePresentation";
import type { GameShellSpectate } from "@/types/gameShell";
import type { DangoId, GameState } from "@/types/game";

type GameShellBoardPanelProps = {
  state: GameState;
  sessionLabel: string;
  showWinnerBadge: boolean;
  boardCells: Map<number, DangoId[]>;
  boardEffects: Map<number, string | null>;
  hoppingEntityIds: Set<DangoId>;
  visibleBroadcastPayload: BroadcastBannerPayload | null;
  turnQueuePresentation: ReturnType<typeof usePersistentTurnQueuePresentation>;
  spectate?: GameShellSpectate;
};

export function GameShellBoardPanel({
  state,
  sessionLabel,
  showWinnerBadge,
  boardCells,
  boardEffects,
  hoppingEntityIds,
  visibleBroadcastPayload,
  turnQueuePresentation,
  spectate,
}: GameShellBoardPanelProps) {
  const { t } = useTranslation();

  return (
    <section className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto_auto] rounded-[1.75rem] border border-slate-200 bg-white/90 p-4 shadow-md shadow-slate-900/10 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-slate-950/60 sm:rounded-3xl sm:p-6 xl:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 sm:text-sm">
            {t("game.board.panelTitle")}
          </p>
          <p className="min-w-0 text-base font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-xl">
            {t("game.board.turnLabel", {
              turn: Math.max(state.turnIndex, 0),
            })}
            {` · ${sessionLabel}`}
          </p>
        </div>
        {showWinnerBadge ? (
          <div className="rounded-full bg-amber-400/25 px-3 py-2 text-xs font-semibold text-amber-900 ring-1 ring-amber-500/50 dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-400/40 sm:px-4 sm:text-sm">
            {t("game.board.winnerBadge")}
          </div>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-4 py-4">
        <div className="w-full min-w-0 self-center lg:max-w-[72rem]">
          <TurnQueueViewer presentation={turnQueuePresentation} />
        </div>
        <div className="flex min-w-0 flex-1 items-start justify-center">
          <div className="relative w-full min-w-0 max-w-[min(100%,38rem)] md:max-w-[72rem]">
            <div className="relative aspect-square w-full overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85),_rgba(226,232,240,0.8)_38%,_rgba(148,163,184,0.28)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_18px_44px_rgba(15,23,42,0.12)] dark:border-slate-700/70 dark:bg-[radial-gradient(circle_at_top,_rgba(30,41,59,0.95),_rgba(15,23,42,0.94)_38%,_rgba(2,6,23,0.96)_100%)] dark:shadow-[inset_0_1px_0_rgba(148,163,184,0.16),0_22px_64px_rgba(2,6,23,0.55)] sm:rounded-[2rem] md:aspect-[48/30] xl:aspect-[48/28]">
              <div className="absolute inset-0 p-2 sm:p-3">
                <div className="relative h-full w-full overflow-hidden rounded-[1.25rem] bg-white/35 dark:bg-slate-950/20 sm:rounded-[1.55rem]">
                  <CircularBoard
                    boardCells={boardCells}
                    boardEffects={boardEffects}
                    hoppingEntityIds={hoppingEntityIds}
                  />
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-4 py-5 sm:px-10 sm:py-6 md:px-16 md:py-10 lg:px-24 lg:py-14">
                    <BroadcastBanner payload={visibleBroadcastPayload} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {spectate?.replayToolbar ? (
        <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-5 pb-2 dark:border-slate-800/80">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 sm:text-sm">
            {t("game.replay.toolbarCaption")}
          </p>
          {spectate.timelineVisible ? (
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="range"
                min={0}
                max={spectate.timelineMax}
                step={1}
                value={Math.min(spectate.timelineStep, spectate.timelineMax)}
                aria-label={spectate.scrubAria}
                onChange={(event) =>
                  spectate.onScrub(Number.parseInt(event.target.value, 10))
                }
                className="h-2 w-full min-w-[12rem] flex-1 cursor-pointer accent-indigo-600"
              />
              <span className="min-w-[10rem] text-right text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300 sm:text-sm">
                {spectate.turnSummaryText}
              </span>
            </div>
          ) : null}
          {spectate.replayToolbar}
        </div>
      ) : null}
      <div className="hidden shrink-0 gap-3 pt-2 text-sm text-slate-600 dark:text-slate-300 sm:grid sm:grid-cols-2 xl:grid-cols-5">
        {BOARD_LEGEND_ENTRIES.map((entry) => (
          <LegendSwatch
            key={entry.labelKey}
            label={t(entry.labelKey)}
            description={t(entry.descriptionKey)}
            borderClass={entry.borderClass}
          />
        ))}
      </div>
    </section>
  );
}

function LegendSwatch({
  label,
  description,
  borderClass,
}: {
  label: string;
  description: string;
  borderClass: string;
}) {
  return (
    <div
      className={`rounded-2xl border ${borderClass} bg-white/70 px-4 py-3 dark:bg-slate-950/40`}
    >
      <p className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100">
        {label}
      </p>
      <p className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-500">
        {description}
      </p>
    </div>
  );
}
