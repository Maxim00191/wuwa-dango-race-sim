import { useEffect, useMemo, type ReactNode } from "react";
import { TurnQueueViewer } from "@/components/TurnQueueViewer";
import {
  BroadcastBanner,
  type BroadcastBannerPayload,
} from "@/components/BroadcastBanner";
import { CircularBoard } from "@/components/CircularBoard";
import { useTranslation } from "@/i18n/LanguageContext";
import { CHARACTER_BY_ID } from "@/services/characters";
import {
  useSafeDangoColors,
} from "@/services/dangoColors";
import {
  PLAYBACK_SPEED_OPTIONS,
  usePlaybackSettings,
} from "@/hooks/usePlaybackSettings";
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
  idleParticipantIds: DangoId[];
  headerEyebrow: string;
  headerTitle: string;
  headerDescription: string;
  sessionLabel: string;
  setupPanel?: ReactNode;
  showSetupPanel?: boolean;
  startControls: ReactNode;
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
  idleParticipantIds,
  headerEyebrow,
  headerTitle,
  headerDescription,
  sessionLabel,
  setupPanel,
  showSetupPanel = false,
  startControls,
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
  const { getCharacterName, t, tText } = useTranslation();
  const getSafeDangoColors = useSafeDangoColors();
  const { speedMultiplier, setSpeedMultiplier } = usePlaybackSettings();
  const racerParticipantIds = useMemo(() => {
    if (state.phase === "idle") {
      return idleParticipantIds;
    }
    return orderedRacerIdsForLeaderboard(rankingState);
  }, [idleParticipantIds, rankingState, state.phase]);
  const racerOrderFlipKey = racerParticipantIds.join("\u0001");
  const rankListRef = useListFlipAnimation<HTMLUListElement>(racerOrderFlipKey);
  const turnQueuePresentation = usePersistentTurnQueuePresentation(
    state,
    isAnimating
  );
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
    <div className="flex min-h-screen w-full flex-col gap-6 px-4 py-8 text-slate-900 dark:text-slate-100 sm:px-6 md:px-10 lg:gap-8 lg:px-14 xl:px-16 2xl:px-24">
      <header className="flex w-full flex-col gap-3">
        <p className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-xl">
          {headerEyebrow}
        </p>
        <div className="flex flex-wrap items-end justify-between gap-6 gap-y-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 md:text-4xl">
              {headerTitle}
            </h1>
            <p className="mt-2 max-w-none text-sm font-normal text-slate-500 dark:text-slate-400 md:text-base lg:text-lg">
              {headerDescription}
            </p>
          </div>
          <div className="flex flex-wrap items-stretch gap-3 sm:gap-4">
            <ControlCluster label={t("game.controls.watch")}>
              <div className="flex flex-wrap gap-2">
                {startControls}
                <button
                  type="button"
                  onClick={onStepAction}
                  disabled={nextTurnDisabled}
                  className="rounded-full bg-violet-500 px-5 py-2 text-sm font-semibold text-violet-950 shadow-lg shadow-violet-900/40 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                >
                  {t("game.controls.step")}
                </button>
                <button
                  type="button"
                  onClick={onPlayTurn}
                  disabled={playTurnDisabled}
                  className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-900/40 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                >
                  {playTurnEnabled
                    ? t("game.controls.playingTurn")
                    : t("game.controls.playTurn")}
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
                      {t("game.controls.pauseAuto")}
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
                      {t("game.controls.autoRun")}
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={onReset}
                  className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-rose-50 shadow-lg shadow-rose-950/35 transition hover:bg-rose-500"
                >
                  {t("game.controls.reset")}
                </button>
              </div>
            </ControlCluster>
            <ControlCluster label={t("nav.playback.label")}>
              <div className="flex flex-wrap gap-1 rounded-full border border-slate-200 bg-slate-50/90 p-1 shadow-inner shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-950/70 dark:shadow-slate-950/30">
                {PLAYBACK_SPEED_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSpeedMultiplier(option)}
                    aria-pressed={option === speedMultiplier}
                    aria-label={t("nav.playback.optionAria", { speed: option })}
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition sm:min-w-[3.5rem] ${
                      option === speedMultiplier
                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 dark:bg-slate-100 dark:text-slate-950 dark:shadow-slate-100/10"
                        : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    }`}
                  >
                    {option}x
                  </button>
                ))}
              </div>
            </ControlCluster>
            <ControlCluster label={t("game.controls.quickRuns")}>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onInstantTurn}
                  disabled={instantDisabled}
                  className="rounded-full bg-fuchsia-600 px-5 py-2 text-sm font-semibold text-fuchsia-50 shadow-lg shadow-fuchsia-950/40 transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                >
                  {t("game.controls.instantTurn")}
                </button>
                <button
                  type="button"
                  onClick={onInstantGame}
                  disabled={instantDisabled}
                  className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-rose-50 shadow-lg shadow-rose-950/40 transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
                >
                  {t("game.controls.instantGame")}
                </button>
              </div>
            </ControlCluster>
          </div>
        </div>
      </header>

      {showSetupPanel ? setupPanel : null}

      <div className="grid min-h-0 w-full flex-1 items-stretch gap-8 lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[minmax(0,2.85fr)_minmax(0,1fr)] xl:gap-12 2xl:grid-cols-[minmax(0,3.1fr)_minmax(0,1fr)]">
        <section className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/10 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-2xl dark:shadow-slate-950/60 xl:p-8">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
                  {t("game.board.panelTitle")}
                </p>
                <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {t("game.board.turnLabel", {
                    turn: Math.max(state.turnIndex, 0),
                  })}
                  {` · ${sessionLabel}`}
                </p>
              </div>
              {state.winnerId ? (
                <div className="rounded-full bg-amber-400/25 px-4 py-2 text-sm font-semibold text-amber-900 ring-1 ring-amber-500/50 dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-400/40">
                  {t("game.board.winnerBadge")}
                </div>
              ) : null}
            </div>
            <TurnQueueViewer
              presentation={turnQueuePresentation}
            />
          </div>
          <div className="min-h-0 min-w-0 py-4">
            <div className="relative h-full min-h-[clamp(22rem,46vh,40rem)] min-w-0 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85),_rgba(226,232,240,0.8)_38%,_rgba(148,163,184,0.28)_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_24px_60px_rgba(15,23,42,0.12)] dark:border-slate-700/70 dark:bg-[radial-gradient(circle_at_top,_rgba(30,41,59,0.95),_rgba(15,23,42,0.94)_38%,_rgba(2,6,23,0.96)_100%)] dark:shadow-[inset_0_1px_0_rgba(148,163,184,0.16),0_28px_80px_rgba(2,6,23,0.55)]">
              <div className="relative h-full w-full overflow-hidden rounded-[1.55rem] bg-white/35 dark:bg-slate-950/20">
                <CircularBoard
                  boardCells={boardCells}
                  boardEffects={boardEffects}
                  hoppingEntityIds={hoppingEntityIds}
                />
                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-2">
                  <BroadcastBanner payload={broadcastPayload} />
                </div>
              </div>
            </div>
          </div>
          <div className="grid shrink-0 gap-4 pt-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2 xl:grid-cols-5">
            <LegendSwatch
              label={t("game.board.legend.finishLine.label")}
              description={t("game.board.legend.finishLine.description")}
              borderClass="border-amber-300"
            />
            <LegendSwatch
              label={t("game.board.legend.propulsion.label")}
              description={t("game.board.legend.propulsion.description")}
              borderClass="border-green-500"
            />
            <LegendSwatch
              label={t("game.board.legend.hindrance.label")}
              description={t("game.board.legend.hindrance.description")}
              borderClass="border-red-500"
            />
            <LegendSwatch
              label={t("game.board.legend.rift.label")}
              description={t("game.board.legend.rift.description")}
              borderClass="border-purple-400"
            />
            <LegendSwatch
              label={t("game.board.legend.stacks.label")}
              description={t("game.board.legend.stacks.description")}
              borderClass="border-slate-500"
            />
          </div>
        </section>

        <aside className="flex min-w-0 flex-col gap-6 xl:min-w-[18rem]">
          <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-xl dark:shadow-slate-950/60 xl:p-8">
            <p className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {t("game.racers.title")}
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
                const {
                  baseHex,
                  baseInkHex,
                  chartHex,
                  uiOutlineHex,
                  uiOutlineSoftHex,
                } = getSafeDangoColors(participantId);
                return (
                  <li
                    key={character.id}
                    data-flip-item={character.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 border-l-4 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60"
                    style={{ borderLeftColor: chartHex }}
                  >
                    <div className="flex items-start gap-3">
                      {rankVisible ? (
                        <span
                          className="mt-0.5 inline-flex h-7 min-w-[2rem] items-center justify-center rounded-full px-2 text-xs font-semibold ring-1 ring-slate-900/15 dark:ring-black/20"
                          style={{
                            backgroundColor: baseHex,
                            color: baseInkHex,
                            boxShadow: `0 0 0 1px ${uiOutlineHex}, 0 0 0 4px ${uiOutlineSoftHex}`,
                          }}
                        >
                          #{leaderboardIndex + 1}
                        </span>
                      ) : null}
                      <div>
                        <p className="font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                          {getCharacterName(character.id)}
                        </p>
                        <p className="text-xs font-normal text-slate-500 dark:text-slate-500">
                          {character.role === "boss"
                            ? t("game.racers.bossRole")
                            : t("game.racers.basicRole")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                      <p className="font-mono text-[13px] font-normal text-slate-500 dark:text-slate-400">
                        ● {runtime?.raceDisplacement ?? 0}
                      </p>
                      <p className="text-[11px] font-normal text-slate-500 dark:text-slate-500">
                        {t("game.racers.dice", { value: roll ?? "—" })}
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
                {t("game.diary.title")}
              </p>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-500">
                {state.log.length === 1
                  ? t("common.notes.one", { count: state.log.length })
                  : t("common.notes.other", { count: state.log.length })}
              </span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {state.log.length === 0 ? (
                <p className="font-normal text-slate-500 dark:text-slate-500">
                  {t("game.diary.empty")}
                </p>
              ) : (
                state.log.map((entry, index) => (
                  <p key={`${entry.kind}-${index}`} className="border-b border-slate-200 pb-3 font-normal text-slate-600 last:border-none dark:border-slate-800 dark:text-slate-400">
                    {tText(entry.message)}
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

function ControlCluster({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-[15rem] flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm shadow-slate-900/5 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/60 dark:shadow-slate-950/25">
      <p className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-200">
        {label}
      </p>
      {children}
    </section>
  );
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
