import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { characterParam, text } from "@/i18n";
import { useTranslation } from "@/i18n/useTranslation";
import { ABBY_ID } from "@/constants/ids";
import { scalePlaybackDurationMs } from "@/hooks/playbackSettings";
import { BOARD_CELL_EFFECT_LOOKUP } from "@/services/boardCellEffectLookup";
import {
  applyAtomicCellsStep,
  applyAtomicStepToEntities,
  expandPlaybackToSegmentAtomicChunks,
  type AtomicPlaybackStep,
} from "@/services/boardPlayback";
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
import {
  usePlaybackSettings,
} from "@/hooks/usePlaybackSettings";

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
  for (const segment of segments) {
    if (segment.kind === "teleport") {
      return ABBY_ID;
    }
    if (
      segment.kind === "idle" ||
      segment.kind === "roll" ||
      segment.kind === "skill" ||
      segment.kind === "hops" ||
      segment.kind === "cellEffect"
    ) {
      return segment.actorId;
    }
    if (segment.kind === "slide") {
      const stack = segment.travelingIds;
      return stack.length > 0 ? stack[stack.length - 1]! : undefined;
    }
  }
  return undefined;
}

function gameReducer(state: GameState, action: GameAction): GameState {
  return reduceGameState(state, action, BOARD_CELL_EFFECT_LOOKUP);
}

export function useGame() {
  const { getCharacterName, t } = useTranslation();
  const { speedMultiplier } = usePlaybackSettings();
  const translationHelpersRef = useRef({ getCharacterName, t });
  const playbackSpeedRef = useRef(speedMultiplier);
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
  const getScaledDurationMs = useCallback(
    (baseDurationMs: number) =>
      scalePlaybackDurationMs(baseDurationMs, playbackSpeedRef.current),
    []
  );
  const actionPlaybackGapMs = scalePlaybackDurationMs(
    SINGLE_ACTION_PLAYBACK_GAP_MS,
    speedMultiplier
  );

  useEffect(() => {
    translationHelpersRef.current = { getCharacterName, t };
  }, [getCharacterName, t]);

  useEffect(() => {
    playbackSpeedRef.current = speedMultiplier;
  }, [speedMultiplier]);

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
          setBroadcastPayload({
            variant: "victory",
            headline: text("banner.victory.headline", {
              winner: characterParam(state.winnerId),
            }),
            detail: text("banner.victory.detail"),
            accentDangoId: state.winnerId,
          });
          await delayMilliseconds(getScaledDurationMs(VICTORY_HOLD_MS));
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
        await delayMilliseconds(getScaledDurationMs(holdMs));
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
          await delayMilliseconds(getScaledDurationMs(ATOMIC_STEP_DELAY_MS));
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
              translationHelpersRef.current.getCharacterName
            )
          : formatTurnOrderArrowLine(
              playback.segments,
              translationHelpersRef.current.getCharacterName,
              translationHelpersRef.current.t("banner.bonusSlide")
            );

      if (playback.showTurnIntroBanner) {
        await shineBanner(
          {
            variant: "turn",
            headline: text("banner.turn.headline", {
              turn: playback.turnIndex,
            }),
            detail: orderLine,
            accentDangoId: accentDangoIdForTurnIntro(playback.segments),
          },
          TURN_OPEN_HOLD_MS
        );
      }

      let segmentIndex = 0;

      if (
        playback.segments[0]?.kind === "teleport" &&
        playback.segments[0].entityIds.length === 1 &&
        playback.segments[0].entityIds[0] === ABBY_ID
      ) {
        await shineBanner(
          {
            variant: "teleport",
            headline: text("banner.teleport.abbyHeadline"),
            detail: text("banner.teleport.abbyDetail"),
            accentDangoId: ABBY_ID,
          },
          TELEPORT_BANNER_MS
        );
        await runAtomicSteps(segmentChunks[0] ?? []);
        segmentIndex = 1;
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
          await shineBanner(
            {
              variant: "teleport",
              headline:
                accentDangoId === ABBY_ID
                  ? text("banner.teleport.abbyHeadline")
                  : text("banner.teleport.stackHeadline", {
                      actor: characterParam(accentDangoId ?? ABBY_ID),
                    }),
              detail:
                accentDangoId === ABBY_ID
                  ? text("banner.teleport.abbyDetail")
                  : text("banner.teleport.stackDetail"),
              accentDangoId,
            },
            TELEPORT_BANNER_MS
          );
          await runAtomicSteps(chunk);
          continue;
        }

        if (segment.kind === "idle") {
          if (segment.reason === "standby") {
            await shineBanner(
              {
                variant: "idle",
                headline: text("banner.idle.standbyHeadline", {
                  actor: characterParam(segment.actorId),
                }),
                detail: text("banner.idle.standbyDetail"),
                accentDangoId: segment.actorId,
              },
              IDLE_BANNER_MS
            );
          } else {
            await shineBanner(
              {
                variant: "idle",
                headline: text("banner.idle.blockedHeadline", {
                  actor: characterParam(segment.actorId),
                }),
                detail:
                  segment.rollValue !== undefined
                    ? text("banner.idle.blockedDetailWithRoll", {
                        value: segment.rollValue,
                      })
                    : text("banner.idle.blockedDetail"),
                accentDangoId: segment.actorId,
              },
              IDLE_BANNER_MS
            );
          }
          continue;
        }

        if (segment.kind === "roll") {
          await shineBanner(
            {
              variant: "roll",
              headline: text("banner.roll.headline", {
                actor: characterParam(segment.actorId),
                value: segment.value,
              }),
              detail: text("banner.roll.detail"),
              accentDangoId: segment.actorId,
            },
            BANNER_READ_MS
          );
          continue;
        }

        if (segment.kind === "skill") {
          await shineBanner(
            {
              variant: "skill",
              headline: segment.message,
              detail: text("banner.skill.detail"),
              accentDangoId: segment.actorId,
            },
            SKILL_BANNER_READ_MS
          );
          continue;
        }

        if (segment.kind === "hops") {
          await runAtomicSteps(chunk);
          continue;
        }

        if (segment.kind === "cellEffect") {
          await shineBanner(
            {
              variant: "effect",
              headline: text(`banner.effect.${segment.effectId}.headline`),
              detail: segment.message,
              accentDangoId: segment.actorId,
            },
            SLIDE_BANNER_MS
          );
          continue;
        }

        if (segment.kind === "slide") {
          await runAtomicSteps(chunk);
        }
      }

      if (!guard()) {
        return;
      }

      if (state.phase === "finished" && state.winnerId) {
        await shineBanner(
          {
            variant: "victory",
            headline: text("banner.victory.headline", {
              winner: characterParam(state.winnerId),
            }),
            detail: text("banner.victory.detail"),
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
    state.lastTurnPlayback,
    state.phase,
    state.playbackStamp,
    state.winnerId,
    getScaledDurationMs,
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
      setBroadcastPayload({
        variant: "victory",
        headline: text("banner.victory.headline", {
          winner: characterParam(winnerId),
        }),
        detail: text("banner.victory.detail"),
        accentDangoId: winnerId,
      });
      await delayMilliseconds(getScaledDurationMs(VICTORY_HOLD_MS));
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
    getScaledDurationMs,
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
    }, actionPlaybackGapMs);
    return () => window.clearTimeout(timeoutId);
  }, [
    actionPlaybackGapMs,
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
    }, actionPlaybackGapMs);
    return () => window.clearTimeout(timeoutId);
  }, [
    actionPlaybackGapMs,
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
