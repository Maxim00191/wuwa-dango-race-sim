import { useMemo } from "react";
import {
  pickTurnQueuePresentation,
  TurnQueueViewer,
} from "@/components/TurnQueueViewer";
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
  const rankListRef = useListFlipAnimation(racerOrderFlipKey);
  const turnQueuePresentation = useMemo(
    () => pickTurnQueuePresentation(state, isAnimating),
    [state, isAnimating]
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

  return (
    <div className="flex min-h-screen w-full flex-col gap-8 px-4 py-8 text-slate-100 sm:px-6 md:px-10 lg:px-14 xl:px-16 2xl:px-24">
      <header className="flex w-full flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
          Circular ladder chase
        </p>
        <div className="flex flex-wrap items-end justify-between gap-6 gap-y-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold text-white md:text-4xl">
              Dango Scramble
            </h1>
            <p className="mt-2 max-w-none text-sm text-slate-300 md:text-base lg:text-lg">
              Thirty-two linked cells, stacking carries, Abby counters the pack,
              and the top dango claims victory when a lap completes.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                Playback
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onStart}
                  disabled={startDisabled}
                  className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
                >
                  Start session
                </button>
                <button
                  type="button"
                  onClick={onStepAction}
                  disabled={nextTurnDisabled}
                  className="rounded-full bg-violet-500 px-5 py-2 text-sm font-semibold text-violet-950 shadow-lg shadow-violet-900/40 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
                >
                  Step action
                </button>
                <button
                  type="button"
                  onClick={onPlayTurn}
                  disabled={playTurnDisabled}
                  className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-900/40 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
                >
                  {playTurnEnabled ? "Playing turn" : "Play a turn"}
                </button>
                <button
                  type="button"
                  onClick={() => onAutoPlayEnabledChange(!autoPlayEnabled)}
                  disabled={state.phase !== "running" || Boolean(state.winnerId)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold shadow-lg transition disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none ${
                    autoPlayEnabled
                      ? "bg-amber-400 text-amber-950 shadow-amber-900/40 hover:bg-amber-300"
                      : "border border-slate-600 text-slate-100 hover:border-slate-400 hover:text-white"
                  }`}
                >
                  {autoPlayEnabled ? "Pause auto-play" : "Auto-play"}
                </button>
                <button
                  type="button"
                  onClick={onReset}
                  className="rounded-full border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-400 hover:text-white"
                >
                  Reset board
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                Simulation
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onInstantTurn}
                  disabled={instantDisabled}
                  className="rounded-full bg-fuchsia-600 px-5 py-2 text-sm font-semibold text-fuchsia-50 shadow-lg shadow-fuchsia-950/40 transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
                >
                  Instant turn
                </button>
                <button
                  type="button"
                  onClick={onInstantGame}
                  disabled={instantDisabled}
                  className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-rose-50 shadow-lg shadow-rose-950/40 transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
                >
                  Instant game
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
        <section className="flex min-w-0 flex-col rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/60 backdrop-blur lg:min-h-[min(72vh,780px)] xl:p-8">
          <div className="mb-4 flex shrink-0 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Track overview
                </p>
                <p className="text-lg font-semibold text-white">
                  Turn {Math.max(state.turnIndex, 0)}
                  {state.phase === "idle"
                    ? " · Ready"
                    : state.phase === "running"
                      ? " · Live"
                      : " · Complete"}
                </p>
              </div>
              {state.winnerId ? (
                <div className="rounded-full bg-amber-400/15 px-4 py-2 text-sm font-semibold text-amber-200 ring-1 ring-amber-400/40">
                  Winner locked in
                </div>
              ) : null}
            </div>
            <TurnQueueViewer
              presentation={turnQueuePresentation}
              isAnimating={isAnimating}
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
          <div className="mt-6 shrink-0 grid gap-4 text-sm text-slate-300 sm:grid-cols-3">
            <LegendSwatch
              label="Finish line"
              description="Cell 1 wraps the lap counter."
              borderClass="border-amber-300"
            />
            <LegendSwatch
              label="Special cells"
              description="Purple rings trigger scripted effects."
              borderClass="border-purple-400"
            />
            <LegendSwatch
              label="Stacks"
              description="Totem stacks build straight up from each waypoint with no sideways drift."
              borderClass="border-slate-500"
            />
          </div>
        </section>

        <aside className="flex min-w-0 flex-col gap-6 xl:min-w-[18rem]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/60 xl:p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Racers
            </p>
            <ul
              ref={rankListRef}
              className="mt-4 space-y-3 text-sm text-slate-200"
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
                    className="flex items-center justify-between rounded-2xl border border-slate-800 border-l-4 bg-slate-950/60 px-4 py-3"
                    style={{ borderLeftColor: dangoAccentHex }}
                  >
                    <div className="flex items-start gap-3">
                      {rankVisible ? (
                        <span
                          className="mt-0.5 inline-flex h-7 min-w-[2rem] items-center justify-center rounded-full px-2 text-xs font-semibold ring-1 ring-black/20"
                          style={{
                            backgroundColor: dangoAccentHex,
                            color: rankInk,
                          }}
                        >
                          #{leaderboardIndex + 1}
                        </span>
                      ) : null}
                      <div>
                        <p className="font-semibold text-white">
                          {character.displayName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {character.role === "boss"
                            ? "Boss · dice 1-6 · counter-clockwise"
                            : "Dango · dice 1-3 · clockwise"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <p className="font-mono text-[13px] text-slate-100">
                        ● {runtime?.raceDisplacement ?? 0}
                      </p>
                      <p className="text-[11px]">
                        roll {roll ?? "—"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="flex max-h-[420px] flex-col rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/60 xl:max-h-[min(58vh,560px)] xl:p-8 2xl:max-h-[min(62vh,640px)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Chronicle
              </p>
              <span className="text-[11px] text-slate-500">
                {state.log.length} events
              </span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 text-sm leading-relaxed text-slate-200">
              {state.log.length === 0 ? (
                <p className="text-slate-500">
                  Events appear here each time you resolve a turn.
                </p>
              ) : (
                state.log.map((entry, index) => (
                  <p key={`${entry.kind}-${index}`} className="border-b border-slate-800 pb-3 last:border-none">
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

type LegendSwatchProps = {
  label: string;
  description: string;
  borderClass: string;
};

function LegendSwatch({ label, description, borderClass }: LegendSwatchProps) {
  return (
    <div className={`rounded-2xl border ${borderClass} bg-slate-950/40 px-4 py-3`}>
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
  );
}
