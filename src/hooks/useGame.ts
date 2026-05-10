import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  ABBY_ID,
  ACTIVE_BASIC_DANGO_COUNT,
  createDefaultPendingBasicIds,
} from "@/constants/ids";
import {
  buildEffectLookup,
  buildLinearBoardDescriptor,
} from "@/services/boardLayout";
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
import type { DangoId, GameAction, GameState, PlaybackSegment } from "@/types/game";
import { formatTurnOrderArrowLine } from "@/narration/formatTurnOrderArrowLine";

const BOARD_EFFECT_BY_CELL_INDEX = buildEffectLookup(
  buildLinearBoardDescriptor()
);

const ATOMIC_STEP_DELAY_MS = 520;
const AUTO_PLAY_IDLE_GAP_MS = 780;
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
  return reduceGameState(state, action, BOARD_EFFECT_BY_CELL_INDEX);
}

export function useGame() {
  const initialState = useMemo(() => createInitialGameState(), []);
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [pendingBasicIds, setPendingBasicIds] = useState<DangoId[]>(() =>
    createDefaultPendingBasicIds() as DangoId[]
  );
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
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const [broadcastPayload, setBroadcastPayload] =
    useState<BroadcastBannerPayload | null>(null);
  const snapshotBeforeTurnRef = useRef<GameState | null>(null);
  const isAnimatingRef = useRef(false);
  const animationGenerationRef = useRef(0);

  const togglePendingBasicId = useCallback((id: DangoId) => {
    setPendingBasicIds((previous) => {
      if (previous.includes(id)) {
        return previous.filter((existing) => existing !== id);
      }
      if (previous.length >= ACTIVE_BASIC_DANGO_COUNT) {
        return previous;
      }
      return [...previous, id];
    });
  }, []);

  const start = useCallback(() => {
    if (!isValidBasicSelection(pendingBasicIds)) {
      return;
    }
    dispatch({ type: "START", selectedBasicIds: pendingBasicIds });
  }, [pendingBasicIds]);

  const reset = useCallback(() => {
    animationGenerationRef.current += 1;
    isAnimatingRef.current = false;
    snapshotBeforeTurnRef.current = null;
    setPlaybackCells(null);
    setPlaybackEntities(null);
    setHoppingEntityIds(new Set());
    setIsAnimating(false);
    setBroadcastPayload(null);
    setAutoPlayEnabled(false);
    dispatch({ type: "RESET" });
    setPendingBasicIds(createDefaultPendingBasicIds() as DangoId[]);
  }, []);

  const runFullTurn = useCallback(() => {
    if (isAnimatingRef.current) {
      return;
    }
    if (state.phase !== "running" || state.winnerId) {
      return;
    }
    snapshotBeforeTurnRef.current = state;
    setPlaybackCells(cloneCellMap(state.cells));
    setPlaybackEntities(cloneEntityMap(state.entities));
    isAnimatingRef.current = true;
    setIsAnimating(true);
    dispatch({ type: "RUN_FULL_TURN" });
  }, [state]);

  useLayoutEffect(() => {
    let cancelled = false;
    const snapshot = snapshotBeforeTurnRef.current;
    const playback = state.lastTurnPlayback;
    if (!snapshot || !playback || playback.turnIndex !== state.turnIndex) {
      return;
    }
    snapshotBeforeTurnRef.current = null;
    const segmentChunks = expandPlaybackToSegmentAtomicChunks(
      playback.segments,
      snapshot.cells
    );
    const incomingLogs = state.log.slice(snapshot.log.length);
    const generation = ++animationGenerationRef.current;
    let workingCells = cloneCellMap(snapshot.cells);
    let workingEntities = cloneEntityMap(snapshot.entities);
    setPlaybackCells(workingCells);
    setPlaybackEntities(workingEntities);
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

      const orderLine = formatTurnOrderArrowLine(
        playback.segments,
        CHARACTER_BY_ID
      );

      await shineBanner(
        {
          variant: "turn",
          headline: `Turn ${playback.turnIndex}`,
          detail: orderLine,
          accentDangoId: accentDangoIdForTurnIntro(playback.segments),
        },
        TURN_OPEN_HOLD_MS
      );

      let logCursor = 0;
      let segmentIndex = 0;

      if (playback.segments[0]?.kind === "teleport") {
        await shineBanner(
          {
            variant: "teleport",
            headline: "Abby reclaims the starting lane",
            detail:
              incomingLogs[logCursor]?.message ?? "Boss reposition complete",
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
                  ? "Abby reclaims the starting lane"
                  : `${name} leaps to a nearby stack`,
              detail:
                incomingLogs[logCursor]?.message ?? "Teleport reposition complete",
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
                headline: `${name} remains on standby`,
                detail: "Waiting for the race clock to advance",
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
                headline: `${name} cannot carry the stack`,
                detail:
                  rollValue !== undefined
                    ? `Rolled ${rollValue}, but another racer anchors this cell`
                    : "Stack anchor mismatch on this cell",
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
              detail: "Track animation incoming",
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
                detail: "Skill surge",
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
              headline: "Special cell surge",
              detail: "The stack rides bonus momentum",
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
            headline: `${winnerLabel} wins Dango Scramble`,
            detail: "Lap complete · champion crowned",
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
  }, [state.turnIndex, state.lastTurnPlayback]);

  useEffect(() => {
    if (state.phase === "finished") {
      setAutoPlayEnabled(false);
    }
  }, [state.phase]);

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
      runFullTurn();
    }, AUTO_PLAY_IDLE_GAP_MS);
    return () => window.clearTimeout(timeoutId);
  }, [
    autoPlayEnabled,
    state.phase,
    state.winnerId,
    state.turnIndex,
    isAnimating,
    runFullTurn,
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
    pendingBasicIds,
    togglePendingBasicId,
    start,
    runFullTurn,
    reset,
    boardEffects: BOARD_EFFECT_BY_CELL_INDEX,
    boardCells: playbackCells ?? state.cells,
    hoppingEntityIds,
    isAnimating,
    autoPlayEnabled,
    setAutoPlayEnabled,
    broadcastPayload,
  };
}
