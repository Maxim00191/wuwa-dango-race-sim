import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { ABBY_ID } from "@/constants/ids";
import { BOARD_CELL_EFFECT_LOOKUP } from "@/services/boardCellEffectLookup";
import {
  applyAtomicCellsStep,
  applyAtomicStepToEntities,
  expandPlaybackToSegmentAtomicChunks,
  type AtomicPlaybackStep,
} from "@/services/boardPlayback";
import { CHARACTER_BY_ID } from "@/services/characters";
import {
  createInitialGameState,
  isValidBasicSelection,
  reduceGameState,
} from "@/services/gameEngine";
import { cloneCellMap, cloneEntityMap } from "@/services/stateCells";
import type { BroadcastBannerPayload } from "@/components/BroadcastBanner";
import type {
  DangoId,
  GameAction,
  GameState,
  PlaybackSegment,
  RaceSetup,
} from "@/types/game";
import {
  formatTurnOrderArrowLine,
  formatTurnOrderFromActorIds,
} from "@/narration/formatTurnOrderArrowLine";

const ATOMIC_STEP_DELAY_MS = 520;
const SINGLE_ACTION_PLAYBACK_GAP_MS = 800;
const BANNER_READ_MS = 1450;
const SKILL_BANNER_READ_MS = 1850;
const TURN_OPEN_HOLD_MS = 1750;
const VICTORY_HOLD_MS = 3400;
const IDLE_BANNER_MS = 1300;
const TELEPORT_BANNER_MS = 1400;
const SLIDE_BANNER_MS = 1400;

function delayMilliseconds(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function accentDangoIdForTurnIntro(
  segments: PlaybackSegment[]
): DangoId | undefined {
  const first = segments[0];
  if (!first) {
    return undefined;
  }
  if (first.kind === "teleport") {
    return ABBY_ID;
  }
  if (first.kind === "idle" || first.kind === "hops") {
    return first.actorId;
  }
  if (first.kind === "slide") {
    const stack = first.travelingIds;
    return stack.length > 0 ? stack[stack.length - 1]! : undefined;
  }
  return undefined;
}

function gameReducer(state: GameState, action: GameAction): GameState {
  return reduceGameState(state, action, BOARD_CELL_EFFECT_LOOKUP);
}

export function useGame() {
  const initialState = useMemo(() => createInitialGameState(), []);
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [playbackCells, setPlaybackCells] = useState<
    Map<number, DangoId[]> | null
  >(null);
  const [playbackEntities, setPlaybackEntities] = useState<
    GameState["entities"] | null
  >(null);
  const [hoppingEntityIds, setHoppingEntityIds] = useState<Set<DangoId>>(
    () => new Set()
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [playTurnEnabled, setPlayTurnEnabled] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const [broadcastPayload, setBroadcastPayload] =
    useState<BroadcastBannerPayload | null>(null);
  const isAnimatingRef = useRef(false);
  const animationGenerationRef = useRef(0);
  const playTurnStartedRef = useRef(false);

  const start = useCallback((setup: RaceSetup) => {
    if (!isValidBasicSelection(setup.selectedBasicIds)) {
      return;
    }
    dispatch({ type: "START", setup });
  }, []);

  const reset = useCallback(() => {
    animationGenerationRef.current += 1;
    isAnimatingRef.current = false;
    setPlaybackCells(null);
    setPlaybackEntities(null);
    setHoppingEntityIds(new Set());
    setIsAnimating(false);
    setPlayTurnEnabled(false);
    setBroadcastPayload(null);
    setAutoPlayEnabled(false);
    dispatch({ type: "RESET" });
  }, []);

  const executeNextStep = useCallback(() => {
    if (isAnimatingRef.current) {
      return;
    }
    if (state.phase !== "running" || state.winnerId) {
      return;
    }
    isAnimatingRef.current = true;
    setIsAnimating(true);
    dispatch({ type: "STEP_ACTION" });
  }, [state]);

  const playTurn = useCallback(() => {
    if (isAnimatingRef.current) {
      return;
    }
    if (state.phase !== "running" || state.winnerId) {
      return;
    }
    playTurnStartedRef.current = false;
    setAutoPlayEnabled(false);
    setPlayTurnEnabled(true);
  }, [state.phase, state.winnerId]);

  const setUnifiedAutoPlayEnabled = useCallback((nextValue: boolean) => {
    if (nextValue) {
      playTurnStartedRef.current = false;
      setPlayTurnEnabled(false);
    }
    setAutoPlayEnabled(nextValue);
  }, []);

  const instantFullTurn = useCallback(() => {
    if (isAnimatingRef.current) {
      return;
    }
    if (state.phase !== "running" || state.winnerId) {
      return;
    }
    animationGenerationRef.current += 1;
    dispatch({ type: "INSTANT_FULL_TURN" });
  }, [state.phase, state.winnerId]);

  const instantSimulateGame = useCallback(() => {
    if (isAnimatingRef.current) {
      return;
    }
    if (state.phase !== "running" || state.winnerId) {
      return;
    }
    animationGenerationRef.current += 1;
    dispatch({ type: "INSTANT_SIMULATE_GAME" });
  }, [state.phase, state.winnerId]);

  useLayoutEffect(() => {
    let cancelled = false;
    const playback = state.lastTurnPlayback;
    if (!playback) {
      return;
    }
    if (playback.playbackStamp !== state.playbackStamp) {
      return;
    }
    const segmentChunks = expandPlaybackToSegmentAtomicChunks(
      playback.segments,
      playback.sourceCells
    );
    const incomingLogs = state.log.slice(playback.sourceLogLength);
    const generation = ++animationGenerationRef.current;
    let workingCells = cloneCellMap(playback.sourceCells);
    let workingEntities = cloneEntityMap(playback.sourceEntities);
    setPlaybackCells(workingCells);
    setPlaybackEntities(workingEntities);
    if (playback.presentationMode === "settled") {
      if (playback.settledCells && playback.settledEntities) {
        workingCells = cloneCellMap(playback.settledCells);
        workingEntities = cloneEntityMap(playback.settledEntities);
      } else {
        for (const chunk of segmentChunks) {
          for (const step of chunk) {
            workingCells = applyAtomicCellsStep(workingCells, step);
            workingEntities = applyAtomicStepToEntities(workingEntities, step);
          }
        }
      }
      setPlaybackCells(cloneCellMap(workingCells));
      setPlaybackEntities(cloneEntityMap(workingEntities));
      setHoppingEntityIds(new Set());
      void (async () => {
        if (state.phase === "finished" && state.winnerId) {
          const winnerLabel =
            CHARACTER_BY_ID[state.winnerId]?.displayName ?? state.winnerId;
          setBroadcastPayload({
            variant: "victory",
            headline: `${winnerLabel} wins the scramble!`,
            detail: "Full lap done—big sparkle energy today",
            accentDangoId: state.winnerId,
          });
          await delayMilliseconds(VICTORY_HOLD_MS);
          if (cancelled || generation !== animationGenerationRef.current) {
            return;
          }
        }
        setPlaybackCells(null);
        setPlaybackEntities(null);
        setBroadcastPayload(null);
      })();
      return () => {
        cancelled = true;
      };
    }
    void (async () => {
      const guard = () =>
        !cancelled && generation === animationGenerationRef.current;

      const shineBanner = async (
        payload: BroadcastBannerPayload,
        holdMs: number
      ) => {
        if (!guard()) {
          return;
        }
        setBroadcastPayload(payload);
        await delayMilliseconds(holdMs);
        if (!guard()) {
          return;
        }
        setBroadcastPayload(null);
      };

      const runAtomicSteps = async (chunk: AtomicPlaybackStep[]) => {
        for (const step of chunk) {
          if (!guard()) {
            return;
          }
          workingCells = applyAtomicCellsStep(workingCells, step);
          workingEntities = applyAtomicStepToEntities(workingEntities, step);
          setPlaybackCells(cloneCellMap(workingCells));
          setPlaybackEntities(cloneEntityMap(workingEntities));
          const movers =
            step.kind === "hop"
              ? step.travelingIds
              : step.kind === "slide"
                ? step.travelingIds
                : step.entityIds;
          setHoppingEntityIds(new Set(movers));
          await delayMilliseconds(ATOMIC_STEP_DELAY_MS);
        }
        if (!guard()) {
          return;
        }
        setHoppingEntityIds(new Set());
      };

      if (!guard()) {
        return;
      }

      const orderLine =
        playback.turnOrderActorIds && playback.turnOrderActorIds.length > 0
          ? formatTurnOrderFromActorIds(
              playback.turnOrderActorIds,
              CHARACTER_BY_ID
            )
          : formatTurnOrderArrowLine(playback.segments, CHARACTER_BY_ID);

      if (playback.showTurnIntroBanner) {
        await shineBanner(
          {
            variant: "turn",
            headline: `Turn ${playback.turnIndex} — off we go`,
            detail: orderLine,
            accentDangoId: accentDangoIdForTurnIntro(playback.segments),
          },
          TURN_OPEN_HOLD_MS
        );
      }

      let logCursor = 0;
      let segmentIndex = 0;

      if (playback.segments[0]?.kind === "teleport") {
        await shineBanner(
          {
            variant: "teleport",
            headline: "Abby boops back to the start",
            detail:
              incomingLogs[logCursor]?.message ?? "Boss girl finds her footing again",
            accentDangoId: ABBY_ID,
          },
          TELEPORT_BANNER_MS
        );
        if (incomingLogs[logCursor]?.kind === "abbyTeleport") {
          logCursor++;
        }
        await runAtomicSteps(segmentChunks[0] ?? []);
        segmentIndex = 1;
      }

      if (incomingLogs[logCursor]?.kind === "turnHeader") {
        logCursor++;
      }

      for (
        ;
        segmentIndex < playback.segments.length;
        segmentIndex++
      ) {
        const segment = playback.segments[segmentIndex]!;
        const chunk = segmentChunks[segmentIndex] ?? [];

        if (segment.kind === "teleport") {
          const accentDangoId = segment.entityIds[segment.entityIds.length - 1];
          const name =
            accentDangoId === ABBY_ID
              ? CHARACTER_BY_ID[ABBY_ID]?.displayName ?? "Abby"
              : accentDangoId
                ? CHARACTER_BY_ID[accentDangoId]?.displayName ?? accentDangoId
                : "The stack";
          await shineBanner(
            {
              variant: "teleport",
              headline:
                accentDangoId === ABBY_ID
                  ? "Abby boops back to the start"
                  : `${name} springs to a friendlier stack`,
              detail:
                incomingLogs[logCursor]?.message ?? "Everyone lands soft",
              accentDangoId,
            },
            TELEPORT_BANNER_MS
          );
          if (incomingLogs[logCursor]?.kind === "abbyTeleport") {
            logCursor++;
          }
          await runAtomicSteps(chunk);
          continue;
        }

        if (segment.kind === "idle") {
          const name =
            CHARACTER_BY_ID[segment.actorId]?.displayName ?? segment.actorId;
          if (segment.reason === "standby") {
            await shineBanner(
              {
                variant: "idle",
                headline: `${name} is warming up off-track`,
                detail: "They'll hop in once the pace picks up",
                accentDangoId: segment.actorId,
              },
              IDLE_BANNER_MS
            );
            if (incomingLogs[logCursor]?.kind === "standby") {
              logCursor++;
            }
          } else {
            const rollValue = state.lastRollById[segment.actorId];
            await shineBanner(
              {
                variant: "idle",
                headline: `${name} lets someone else lead here`,
                detail:
                  rollValue !== undefined
                    ? `Rolled ${rollValue}, but a friend is anchoring this spot`
                    : "Another racer is holding this stack together",
                accentDangoId: segment.actorId,
              },
              IDLE_BANNER_MS
            );
            if (incomingLogs[logCursor]?.kind === "roll") {
              logCursor++;
            }
            if (incomingLogs[logCursor]?.kind === "skillTrigger") {
              logCursor++;
            }
            if (incomingLogs[logCursor]?.kind === "skipNotBottom") {
              logCursor++;
            }
          }
          continue;
        }

        if (segment.kind === "hops") {
          const name =
            CHARACTER_BY_ID[segment.actorId]?.displayName ?? segment.actorId;
          const rollValue = state.lastRollById[segment.actorId];
          await shineBanner(
            {
              variant: "roll",
              headline:
                rollValue !== undefined
                  ? `${name} rolled a ${rollValue}!`
                  : `${name} rolls`,
              detail: "Watch the little hops unfold",
              accentDangoId: segment.actorId,
            },
            BANNER_READ_MS
          );
          if (incomingLogs[logCursor]?.kind === "roll") {
            logCursor++;
          }
          if (incomingLogs[logCursor]?.kind === "skillTrigger") {
            const skillMessage = incomingLogs[logCursor]!.message;
            logCursor++;
            await shineBanner(
              {
                variant: "skill",
                headline: skillMessage,
                detail: "Sparkly skill moment",
                accentDangoId: segment.actorId,
              },
              SKILL_BANNER_READ_MS
            );
          }
          if (incomingLogs[logCursor]?.kind === "move") {
            logCursor++;
          }
          await runAtomicSteps(chunk);
          const upcomingSegment = playback.segments[segmentIndex + 1];
          if (
            upcomingSegment?.kind !== "slide" &&
            incomingLogs[logCursor]?.kind === "cellEffect"
          ) {
            logCursor++;
          }
          continue;
        }

        if (segment.kind === "slide") {
          await shineBanner(
            {
              variant: "slide",
              headline: "Sparkly cell bonus",
              detail: "The whole pile gets a cheerful shove",
              accentDangoId: segment.travelingIds.at(-1),
            },
            SLIDE_BANNER_MS
          );
          if (incomingLogs[logCursor]?.kind === "cellEffect") {
            logCursor++;
          }
          await runAtomicSteps(chunk);
        }
      }

      if (!guard()) {
        return;
      }

      if (state.phase === "finished" && state.winnerId) {
        const winnerLabel =
          CHARACTER_BY_ID[state.winnerId]?.displayName ?? state.winnerId;
        await shineBanner(
          {
            variant: "victory",
            headline: `${winnerLabel} wins the scramble!`,
            detail: "Full lap done—big sparkle energy today",
            accentDangoId: state.winnerId,
          },
          VICTORY_HOLD_MS
        );
      }

      if (!guard()) {
        return;
      }
      setPlaybackCells(null);
      setPlaybackEntities(null);
      setHoppingEntityIds(new Set());
      setBroadcastPayload(null);
      isAnimatingRef.current = false;
      setIsAnimating(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [
    state.lastRollById,
    state.lastTurnPlayback,
    state.log,
    state.phase,
    state.playbackStamp,
    state.winnerId,
  ]);

  useEffect(() => {
    if (
      state.phase !== "finished" ||
      !state.winnerId ||
      isAnimating ||
      state.lastTurnPlayback
    ) {
      return;
    }
    let cancelled = false;
    const generationAtStart = animationGenerationRef.current;
    const winnerId = state.winnerId;
    void (async () => {
      const winnerLabel =
        CHARACTER_BY_ID[winnerId]?.displayName ?? winnerId;
      setBroadcastPayload({
        variant: "victory",
        headline: `${winnerLabel} wins the scramble!`,
        detail: "Full lap done—big sparkle energy today",
        accentDangoId: winnerId,
      });
      await delayMilliseconds(VICTORY_HOLD_MS);
      if (
        cancelled ||
        generationAtStart !== animationGenerationRef.current
      ) {
        return;
      }
      setBroadcastPayload(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [
    state.phase,
    state.winnerId,
    state.lastTurnPlayback,
    isAnimating,
  ]);

  useEffect(() => {
    if (state.phase === "finished") {
      setPlayTurnEnabled(false);
      setAutoPlayEnabled(false);
    }
  }, [state.phase]);

  useEffect(() => {
    if (!playTurnEnabled) {
      return;
    }
    if (state.phase !== "running" || state.winnerId) {
      setPlayTurnEnabled(false);
      return;
    }
    if (isAnimating) {
      return;
    }
    if (playTurnStartedRef.current && !state.pendingTurn) {
      setPlayTurnEnabled(false);
      return;
    }
    const timeoutId = window.setTimeout(() => {
      playTurnStartedRef.current = true;
      executeNextStep();
    }, SINGLE_ACTION_PLAYBACK_GAP_MS);
    return () => window.clearTimeout(timeoutId);
  }, [
    playTurnEnabled,
    state.phase,
    state.winnerId,
    state.pendingTurn,
    isAnimating,
    executeNextStep,
  ]);

  useEffect(() => {
    if (!autoPlayEnabled) {
      return;
    }
    if (state.phase !== "running" || state.winnerId) {
      return;
    }
    if (isAnimating) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      executeNextStep();
    }, SINGLE_ACTION_PLAYBACK_GAP_MS);
    return () => window.clearTimeout(timeoutId);
  }, [
    autoPlayEnabled,
    state.phase,
    state.winnerId,
    isAnimating,
    executeNextStep,
  ]);

  const rankingState = useMemo((): GameState => {
    if (playbackCells !== null && playbackEntities !== null) {
      return { ...state, cells: playbackCells, entities: playbackEntities };
    }
    return state;
  }, [state, playbackCells, playbackEntities]);

  return {
    state,
    rankingState,
    start,
    playTurn,
    stepAction: executeNextStep,
    instantFullTurn,
    instantSimulateGame,
    reset,
    boardEffects: BOARD_CELL_EFFECT_LOOKUP,
    boardCells: playbackCells ?? state.cells,
    hoppingEntityIds,
    isAnimating,
    playTurnEnabled,
    autoPlayEnabled,
    setAutoPlayEnabled: setUnifiedAutoPlayEnabled,
    broadcastPayload,
  };
}
