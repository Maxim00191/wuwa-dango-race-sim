import { useEffect, useMemo } from "react";
import { TurnQueueViewer } from "@/components/TurnQueueViewer";
import {
  BroadcastBanner,
  type BroadcastBannerPayload,
} from "@/components/BroadcastBanner";
import { CircularBoard } from "@/components/CircularBoard";
import { DangoPicker } from "@/components/DangoPicker";
import { ABBY_ID, ACTIVE_BASIC_DANGO_COUNT } from "@/constants/ids";
import { CHARACTER_BY_ID, CHARACTER_LIST } from "@/services/characters";
import {
  accentFillHexForDango,
  contrastingInkHexForFill,
} from "@/services/dangoColors";
import { useListFlipAnimation } from "@/hooks/useListFlipAnimation";
import { usePersistentTurnQueuePresentation } from "@/hooks/usePersistentTurnQueuePresentation";
import { orderedRacerIdsForLeaderboard } from "@/services/racerRanking";
import type { DangoId, GameState } from "@/types/game";

type GameShellProps = {
  state: GameState;
  rankingState: GameState;
  broadcastPayload: BroadcastBannerPayload | null;
  boardCells: Map<number, DangoId[]>;
  boardEffects: Map<number, string | null>;
  hoppingEntityIds: Set<DangoId>;
  pendingBasicIds: DangoId[];
  onToggleBasicId: (id: DangoId) => void;
  onStart: () => void;
  onPlayTurn: () => void;
  onStepAction: () => void;
  onInstantTurn: () => void;
  onInstantGame: () => void;
  onReset: () => void;
  isAnimating: boolean;
  playTurnEnabled: boolean;
  autoPlayEnabled: boolean;
  onAutoPlayEnabledChange: (nextValue: boolean) => void;
};

export function GameShell({
  state,
  rankingState,
  broadcastPayload,
  boardCells,
  boardEffects,
  hoppingEntityIds,
  pendingBasicIds,
  onToggleBasicId,
  onStart,
  onPlayTurn,
  onStepAction,
  onInstantTurn,
  onInstantGame,
  onReset,
  isAnimating,
  playTurnEnabled,
  autoPlayEnabled,
  onAutoPlayEnabledChange,
}: GameShellProps) {
  const rosterBasics = useMemo(
    () => CHARACTER_LIST.filter((character) => character.role === "basic"),
    []
  );
  const racerParticipantIds = useMemo(() => {
    if (state.phase === "idle") {
      return [...pendingBasicIds, ABBY_ID];
    }
    return orderedRacerIdsForLeaderboard(rankingState);
  }, [pendingBasicIds, rankingState, state.phase]);
  const racerOrderFlipKey = racerParticipantIds.join("\u0001");
  const rankListRef = useListFlipAnimation<HTMLUListElement>(racerOrderFlipKey);
  const turnQueuePresentation = usePersistentTurnQueuePresentation(
    state,
    isAnimating
  );
  const startDisabled =
    state.phase !== "idle" ||
    pendingBasicIds.length !== ACTIVE_BASIC_DANGO_COUNT;
  const nextTurnDisabled =
    state.phase !== "running" ||
    Boolean(state.winnerId) ||
    isAnimating ||
    playTurnEnabled ||
    autoPlayEnabled;
  const playTurnDisabled =
    state.phase !== "running" ||
    Boolean(state.winnerId) ||
    isAnimating ||
    playTurnEnabled ||
    autoPlayEnabled;
  const instantDisabled =
    state.phase !== "running" ||
    Boolean(state.winnerId) ||
    isAnimating ||
    playTurnEnabled ||
    autoPlayEnabled;
  const autoRunDisabled =
    state.phase !== "running" || Boolean(state.winnerId);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreKeyboardShortcuts(e.target)) return;

      if (e.code === "Space") {
        if (autoRunDisabled) return;
        e.preventDefault();
        onAutoPlayEnabledChange(!autoPlayEnabled);
        return;
      }

      if (e.code === "ArrowRight") {
        if (e.ctrlKey) {
          if (playTurnDisabled) return;
          e.preventDefault();
          onPlayTurn();
          return;
        }
        if (e.altKey || e.shiftKey || e.metaKey) return;
        if (nextTurnDisabled) return;
        e.preventDefault();
        onStepAction();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    autoPlayEnabled,
    autoRunDisabled,
    nextTurnDisabled,
    onAutoPlayEnabledChange,
    onPlayTurn,
    onStepAction,
    playTurnDisabled,
  ]);

  return (
    <div className="flex min-h-screen w-full flex-col gap-8 px-4 py-8 text-slate-900 dark:text-slate-100 sm:px-6 md:px-10 lg:px-14 xl:px-16 2xl:px-24">
      <header className="flex w-full flex-col gap-3">
        <p className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-xl">
          Lap around the arena
        </p>
        <div className="flex flex-wrap items-end justify-between gap-6 gap-y-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">
              Dango Derby
            </h1>
            <p className="mt-2 max-w-none text-sm font-normal text-slate-500 dark:text-slate-400 md:text-base lg:text-lg">
              Hop, stack, and scramble your way around 32 cozy steps! Dodge the grumpy Abby, ride on your friends, and be the first to cross the finish line!
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-200">
                Watch & play
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onStart}
                  disabled={startDisabled}
                  className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                >
                  Start the race
                </button>
                <button
                  type="button"
                  onClick={onStepAction}
                  disabled={nextTurnDisabled}
                  className="rounded-full bg-violet-500 px-5 py-2 text-sm font-semibold text-violet-950 shadow-lg shadow-violet-900/40 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                >
                  Next step
                </button>
                <button
                  type="button"
                  onClick={onPlayTurn}
                  disabled={playTurnDisabled}
                  className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-900/40 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                >
                  {playTurnEnabled ? "Playing…" : "Play this turn"}
                </button>
                {autoPlayEnabled ? (
                  <span
                    className={`relative inline-flex overflow-hidden rounded-full p-[2px] shadow-lg shadow-violet-900/25 dark:shadow-violet-950/40 ${autoRunDisabled ? "opacity-55" : ""}`}
                  >
                    <span className="pause-auto-run-rainbow__wrap">
                      <span aria-hidden className="pause-auto-run-rainbow__spin" />
                    </span>
                    <button
                      type="button"
                      onClick={() => onAutoPlayEnabledChange(false)}
                      disabled={autoRunDisabled}
                      className="relative z-10 rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                    >
                      Pause auto-run
                    </button>
                  </span>
                ) : (
                  <span
                    className={`inline-flex rounded-full bg-[linear-gradient(90deg,#f43f5e,#fb923c,#fbbf24,#4ade80,#38bdf8,#818cf8,#e879f9,#f43f5e)] p-[2px] shadow-lg shadow-violet-900/25 dark:shadow-violet-950/40 ${autoRunDisabled ? "opacity-55" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => onAutoPlayEnabledChange(true)}
                      disabled={autoRunDisabled}
                      className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                    >
                      Auto-run
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={onReset}
                  className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-rose-50 shadow-lg shadow-rose-950/35 transition hover:bg-rose-500"
                >
                  Clear & restart
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-200">
                Quick runs
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onInstantTurn}
                  disabled={instantDisabled}
                  className="rounded-full bg-fuchsia-600 px-5 py-2 text-sm font-semibold text-fuchsia-50 shadow-lg shadow-fuchsia-950/40 transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                >
                  Zip one turn
                </button>
                <button
                  type="button"
                  onClick={onInstantGame}
                  disabled={instantDisabled}
                  className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-rose-50 shadow-lg shadow-rose-950/40 transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                >
                  Zip whole race
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {state.phase === "idle" ? (
        <DangoPicker
          rosterBasics={rosterBasics}
          selectedBasicIds={pendingBasicIds}
          onToggleBasicId={onToggleBasicId}
        />
      ) : null}

      <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[minmax(0,2.85fr)_minmax(0,1fr)] xl:gap-12 2xl:grid-cols-[minmax(0,3.1fr)_minmax(0,1fr)]">
        <section className="flex min-w-0 flex-col rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-slate-950/60 lg:min-h-[min(72vh,780px)] xl:p-8">
          <div className="mb-4 flex shrink-0 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
                  On the track
                </p>
                <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Turn {Math.max(state.turnIndex, 0)}
                  {state.phase === "idle"
                    ? " · Ready when you are"
                    : state.phase === "running"
                      ? " · Race on!"
                      : " · Race wrapped"}
                </p>
              </div>
              {state.winnerId ? (
                <div className="rounded-full bg-amber-400/25 px-4 py-2 text-sm font-semibold text-amber-900 ring-1 ring-amber-500/50 dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-400/40">
                  We have a winner!
                </div>
              ) : null}
            </div>
            <TurnQueueViewer
              presentation={turnQueuePresentation}
            />
          </div>
          <div className="relative min-h-[min(42vh,420px)] flex-1 overflow-hidden lg:min-h-[min(48vh,520px)]">
            <CircularBoard
              boardCells={boardCells}
              boardEffects={boardEffects}
              hoppingEntityIds={hoppingEntityIds}
            />
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-2">
              <BroadcastBanner payload={broadcastPayload} />
            </div>
          </div>
          <div className="mt-6 shrink-0 grid gap-4 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-3">
            <LegendSwatch
              label="Finish line"
              description="Pass cell 1 again and your lap counter ticks—almost home!"
              borderClass="border-amber-300"
            />
            <LegendSwatch
              label="Sparkly cells"
              description="Purple rings sometimes give the stack a surprise nudge."
              borderClass="border-purple-400"
            />
            <LegendSwatch
              label="Stacks"
              description="Everyone piles neatly upward—no sideways wobble."
              borderClass="border-slate-500"
            />
          </div>
        </section>

        <aside className="flex min-w-0 flex-col gap-6 xl:min-w-[18rem]">
          <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-xl dark:shadow-slate-950/60 xl:p-8">
            <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Your racers
            </p>
            <ul
              ref={rankListRef}
              className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200"
            >
              {racerParticipantIds.map((participantId, leaderboardIndex) => {
                const character = CHARACTER_BY_ID[participantId];
                if (!character) {
                  return null;
                }
                const runtime = rankingState.entities[character.id];
                const roll = state.lastRollById[character.id];
                const rankVisible =
                  state.phase === "running" || state.phase === "finished";
                const dangoAccentHex = accentFillHexForDango(participantId);
                const rankInk = contrastingInkHexForFill(dangoAccentHex);
                return (
                  <li
                    key={character.id}
                    data-flip-item={character.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 border-l-4 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60"
                    style={{ borderLeftColor: dangoAccentHex }}
                  >
                    <div className="flex items-start gap-3">
                      {rankVisible ? (
                        <span
                          className="mt-0.5 inline-flex h-7 min-w-[2rem] items-center justify-center rounded-full px-2 text-xs font-semibold ring-1 ring-slate-900/15 dark:ring-black/20"
                          style={{
                            backgroundColor: dangoAccentHex,
                            color: rankInk,
                          }}
                        >
                          #{leaderboardIndex + 1}
                        </span>
                      ) : null}
                      <div>
                        <p className="font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                          {character.displayName}
                        </p>
                        <p className="text-xs font-normal text-slate-500 dark:text-slate-500">
                          {character.role === "boss"
                            ? "Boss seat · bigger dice · chases counter-clockwise"
                            : "Dango · lighter dice · hops clockwise"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                      <p className="font-mono text-[13px] font-normal text-slate-500 dark:text-slate-400">
                        ● {runtime?.raceDisplacement ?? 0}
                      </p>
                      <p className="text-[11px] font-normal text-slate-500 dark:text-slate-500">
                        dice {roll ?? "—"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="flex max-h-[420px] flex-col rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-xl dark:shadow-slate-950/60 xl:max-h-[min(58vh,560px)] xl:p-8 2xl:max-h-[min(62vh,640px)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
                Race diary
              </p>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-500">
                {state.log.length}{" "}
                {state.log.length === 1 ? "note" : "notes"}
              </span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {state.log.length === 0 ? (
                <p className="font-normal text-slate-500 dark:text-slate-500">
                  Little updates pop in here every time you play a turn.
                </p>
              ) : (
                state.log.map((entry, index) => (
                  <p key={`${entry.kind}-${index}`} className="border-b border-slate-200 pb-3 font-normal text-slate-600 last:border-none dark:border-slate-800 dark:text-slate-400">
                    {entry.message}
                  </p>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function shouldIgnoreKeyboardShortcuts(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.closest("button, a[href], [role='button'], [role='link']")) {
    return true;
  }
  return false;
}

type LegendSwatchProps = {
  label: string;
  description: string;
  borderClass: string;
};

function LegendSwatch({ label, description, borderClass }: LegendSwatchProps) {
  return (
    <div className={`rounded-2xl border ${borderClass} bg-white/70 px-4 py-3 dark:bg-slate-950/40`}>
      <p className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100">{label}</p>
      <p className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-500">{description}</p>
    </div>
  );
}
