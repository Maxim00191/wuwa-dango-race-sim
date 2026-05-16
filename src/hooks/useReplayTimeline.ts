import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReplayVisualBanners } from "@/hooks/useReplayVisualBanners";
import {
  createEngineExecutionContext,
  reduceGameState,
} from "@/services/gameEngine";
import {
  commitEngineFrameToBuffer,
  encodeMatchRecordJson,
  engineFramesDeepEqual,
  findFrameIndexForTurnIndex,
  liveEngineMatchesFrame,
  materializeGameStateFromFrame,
  parseMatchRecordJson,
  serializeBoardEffectAssignments,
  serializeEngineFrame,
} from "@/services/matchReplay";
import type { GameState, RaceSetup } from "@/types/game";
import type {
  BoardEffectAssignmentJson,
  MatchGameFrameJson,
  MatchRecord,
} from "@/types/replay";

const QUICK_RESOLVE_SAFETY_CAP = 250_000;

type QuickResolveScope = "turn" | "race";

type ReplayGameBridge = {
  state: GameState;
  reset: () => void;
  hydrateEngineState: (snapshot: GameState) => void;
  stepAction: () => void;
  playTurn: () => void;
  setAutoPlayEnabled: (value: boolean) => void;
  isAnimating: boolean;
  boardEffects: Map<number, string | null>;
  autoPlayEnabled: boolean;
  getLastRaceSetup?: () => RaceSetup | null;
};

export type UseReplayTimelineOptions = {
  game: ReplayGameBridge;
  onReplayBoardLoaded?: (board: BoardEffectAssignmentJson[]) => void;
};

function lastIndexSameTurn(
  frames: readonly MatchGameFrameJson[],
  startIdx: number
): number {
  const t = frames[startIdx]!.turnIndex;
  let j = startIdx;
  while (j + 1 < frames.length && frames[j + 1]!.turnIndex === t) {
    j++;
  }
  return j;
}

function computeReplayPlayTurnTarget(
  frames: readonly MatchGameFrameJson[],
  step: number,
  max: number
): number | null {
  if (step >= max) {
    return null;
  }
  const endSame = lastIndexSameTurn(frames, step);
  if (step < endSame) {
    return endSame;
  }
  if (endSame < max) {
    return lastIndexSameTurn(frames, endSame + 1);
  }
  return null;
}

export function useReplayTimeline(options: UseReplayTimelineOptions) {
  const { game, onReplayBoardLoaded } = options;
  const {
    enabled: replayBannersEnabled,
    payload: replayBannerPayload,
    clear: clearReplayVisualBanners,
    toggleEnabled: toggleReplayBanners,
    playFrameVisualEvents,
  } = useReplayVisualBanners();
  const gameRef = useRef(game);
  gameRef.current = game;

  const liveCommittedFramesRef = useRef<MatchGameFrameJson[]>([]);
  const [liveCommittedLength, setLiveCommittedLength] = useState(0);
  const [record, setRecord] = useState<MatchRecord | null>(null);
  const [cursorStep, setCursorStep] = useState(0);
  const [playbackAuto, setPlaybackAuto] = useState(false);
  const [seekTurnDraft, setSeekTurnDraft] = useState("");
  const [replayPlayTurnTarget, setReplayPlayTurnTarget] = useState<number | null>(
    null
  );
  const expectingReplayAdvanceRef = useRef(false);
  const syncCursorToCommittedTailRef = useRef(false);
  const prevPhaseRef = useRef(game.state.phase);

  const isReplayLoaded = record !== null;
  const timelineMax = useMemo(() => {
    const len = record ? record.frames.length : liveCommittedLength;
    return Math.max(0, len - 1);
  }, [record, liveCommittedLength]);

  const atLiveCommittedTail = useMemo(() => {
    if (record !== null) {
      return false;
    }
    if (liveCommittedLength === 0) {
      return false;
    }
    return cursorStep === liveCommittedLength - 1;
  }, [record, liveCommittedLength, cursorStep]);

  const resetLiveCommitted = useCallback(() => {
    liveCommittedFramesRef.current = [];
    setLiveCommittedLength(0);
  }, []);

  const loadReplayRecord = useCallback((nextRecord: MatchRecord) => {
    clearReplayVisualBanners();
    gameRef.current.reset();
    gameRef.current.setAutoPlayEnabled(false);
    resetLiveCommitted();
    setRecord(nextRecord);
    setPlaybackAuto(false);
    setReplayPlayTurnTarget(null);
    setCursorStep(0);
    onReplayBoardLoaded?.(nextRecord.board);
    const snapshot = materializeGameStateFromFrame(nextRecord.frames[0]!);
    gameRef.current.hydrateEngineState(snapshot);
  }, [clearReplayVisualBanners, onReplayBoardLoaded, resetLiveCommitted]);

  const clearReplay = useCallback(() => {
    clearReplayVisualBanners();
    expectingReplayAdvanceRef.current = false;
    setPlaybackAuto(false);
    setReplayPlayTurnTarget(null);
    setRecord(null);
    resetLiveCommitted();
    setCursorStep(0);
    gameRef.current.setAutoPlayEnabled(false);
    gameRef.current.reset();
  }, [clearReplayVisualBanners, resetLiveCommitted]);

  const flushPlaybackForNewSession = useCallback(() => {
    clearReplayVisualBanners();
    expectingReplayAdvanceRef.current = false;
    setPlaybackAuto(false);
    setReplayPlayTurnTarget(null);
    setRecord(null);
    resetLiveCommitted();
    setCursorStep(0);
    setSeekTurnDraft("");
    gameRef.current.setAutoPlayEnabled(false);
  }, [clearReplayVisualBanners, resetLiveCommitted]);

  const scrubToStep = useCallback(
    (
      stepIndex: number,
      opts?: { preservePlaybackAuto?: boolean; playVisualEvents?: boolean }
    ) => {
      clearReplayVisualBanners();
      expectingReplayAdvanceRef.current = false;
      setReplayPlayTurnTarget(null);
      if (!opts?.preservePlaybackAuto) {
        setPlaybackAuto(false);
      }
      gameRef.current.setAutoPlayEnabled(false);
      if (record) {
        const bounded = Math.max(0, Math.min(stepIndex, record.frames.length - 1));
        const frame = record.frames[bounded]!;
        const snapshot = materializeGameStateFromFrame(frame);
        gameRef.current.hydrateEngineState(snapshot);
        setCursorStep(bounded);
        if (opts?.playVisualEvents) {
          playFrameVisualEvents(frame.visualEvents);
        }
        return;
      }
      const frames = liveCommittedFramesRef.current;
      if (frames.length === 0) {
        return;
      }
      const bounded = Math.max(0, Math.min(stepIndex, frames.length - 1));
      const frame = frames[bounded]!;
      const snapshot = materializeGameStateFromFrame(frame);
      gameRef.current.hydrateEngineState(snapshot);
      setCursorStep(bounded);
      if (opts?.playVisualEvents) {
        playFrameVisualEvents(frame.visualEvents);
      }
    },
    [record, clearReplayVisualBanners, playFrameVisualEvents]
  );

  const stepReplayBackward = useCallback(() => {
    if (cursorStep <= 0) {
      return;
    }
    scrubToStep(cursorStep - 1);
  }, [scrubToStep, cursorStep]);

  const stepReplayForwardAnimated = useCallback(() => {
    const live = gameRef.current;
    if (live.isAnimating) {
      return;
    }
    if (record) {
      if (cursorStep >= record.frames.length - 1) {
        return;
      }
      scrubToStep(cursorStep + 1, { playVisualEvents: true });
      return;
    }
    const frames = liveCommittedFramesRef.current;
    if (cursorStep < frames.length - 1) {
      scrubToStep(cursorStep + 1, { playVisualEvents: true });
      return;
    }
    if (live.state.phase !== "running" || live.state.winnerId) {
      return;
    }
    live.stepAction();
  }, [record, cursorStep, scrubToStep]);

  const exportRecordJson = useCallback(() => {
    if (record) {
      return encodeMatchRecordJson(record);
    }
    const frames = liveCommittedFramesRef.current;
    const setup = gameRef.current.getLastRaceSetup?.() ?? null;
    if (!setup || frames.length === 0) {
      return null;
    }
    return encodeMatchRecordJson({
      schemaVersion: 1,
      setup,
      board: serializeBoardEffectAssignments(gameRef.current.boardEffects),
      frames: [...frames],
    });
  }, [record]);

  const readReplayFromJsonText = useCallback(
    (payload: string) => {
      const nextRecord = parseMatchRecordJson(payload);
      loadReplayRecord(nextRecord);
    },
    [loadReplayRecord]
  );

  const seekToEngineTurn = useCallback(() => {
    if (!record) {
      return;
    }
    const parsed = Number.parseInt(seekTurnDraft, 10);
    if (!Number.isFinite(parsed)) {
      return;
    }
    const index = findFrameIndexForTurnIndex(record.frames, parsed);
    scrubToStep(index);
  }, [record, scrubToStep, seekTurnDraft]);

  const spectatePlayTurn = useCallback(() => {
    if (record) {
      const target = computeReplayPlayTurnTarget(
        record.frames,
        cursorStep,
        timelineMax
      );
      if (target === null || target === cursorStep) {
        return;
      }
      setReplayPlayTurnTarget(target);
      return;
    }
    setPlaybackAuto(false);
    gameRef.current.playTurn();
  }, [record, cursorStep, timelineMax]);

  const spectateToggleAuto = useCallback(() => {
    setPlaybackAuto((v) => !v);
  }, []);

  const jumpToPresent = useCallback(() => {
    if (record && record.frames.length > 0) {
      scrubToStep(record.frames.length - 1);
      return;
    }
    const n = liveCommittedFramesRef.current.length;
    if (n > 0) {
      scrubToStep(n - 1);
    }
  }, [record, scrubToStep]);

  const quickResolveBatchToBoundary = useCallback(
    (scope: QuickResolveScope) => {
      if (record !== null) {
        return;
      }
      const live = gameRef.current;
      if (live.isAnimating) {
        return;
      }
      if (live.state.phase !== "running" || live.state.winnerId) {
        return;
      }
      const buffer = liveCommittedFramesRef.current;
      if (buffer.length === 0) {
        return;
      }
      if (cursorStep !== buffer.length - 1) {
        return;
      }

      let merged = buffer;
      let working: GameState = live.state;
      let advanced = false;
      const executionContext = createEngineExecutionContext(live.boardEffects);
      for (let iteration = 0; iteration < QUICK_RESOLVE_SAFETY_CAP; iteration++) {
        const previousStamp = working.playbackStamp;
        const next = reduceGameState(
          working,
          { type: "STEP_ACTION" },
          executionContext
        );
        if (
          next.playbackStamp === previousStamp &&
          next.phase === "running" &&
          !next.winnerId
        ) {
          break;
        }
        working = next;
        merged = commitEngineFrameToBuffer(
          merged,
          serializeEngineFrame(working)
        );
        advanced = true;
        const raceEnded =
          working.phase !== "running" || Boolean(working.winnerId);
        if (raceEnded) {
          break;
        }
        if (scope === "turn" && working.pendingTurn === null) {
          break;
        }
      }

      if (!advanced) {
        return;
      }

      clearReplayVisualBanners();
      expectingReplayAdvanceRef.current = false;
      setPlaybackAuto(false);
      setReplayPlayTurnTarget(null);

      liveCommittedFramesRef.current = merged;
      syncCursorToCommittedTailRef.current = true;
      setLiveCommittedLength(merged.length);

      const finalSnapshot = materializeGameStateFromFrame(
        merged[merged.length - 1]!
      );
      live.hydrateEngineState(finalSnapshot);
    },
    [record, cursorStep, clearReplayVisualBanners]
  );

  const quickResolveTurn = useCallback(() => {
    quickResolveBatchToBoundary("turn");
  }, [quickResolveBatchToBoundary]);

  const quickResolveRace = useCallback(() => {
    quickResolveBatchToBoundary("race");
  }, [quickResolveBatchToBoundary]);

  const historyStepBack = useCallback(() => {
    stepReplayBackward();
  }, [stepReplayBackward]);

  useEffect(() => {
    if (record !== null) {
      return;
    }
    const g = gameRef.current;
    if (!atLiveCommittedTail) {
      if (g.autoPlayEnabled) {
        g.setAutoPlayEnabled(false);
      }
      return;
    }
    if (g.autoPlayEnabled !== playbackAuto) {
      g.setAutoPlayEnabled(playbackAuto);
    }
  }, [record, atLiveCommittedTail, playbackAuto]);

  useEffect(() => {
    if (game.state.phase !== "idle" || record !== null) {
      return;
    }
    resetLiveCommitted();
    setCursorStep(0);
  }, [game.state.phase, record, resetLiveCommitted]);

  useLayoutEffect(() => {
    if (!syncCursorToCommittedTailRef.current) {
      return;
    }
    syncCursorToCommittedTailRef.current = false;
    const tailIndex = liveCommittedFramesRef.current.length - 1;
    if (tailIndex >= 0) {
      setCursorStep(tailIndex);
    }
  }, [liveCommittedLength]);

  useLayoutEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = game.state.phase;
    if (record !== null) {
      return;
    }
    if (game.state.phase === "running" && prev !== "running") {
      if (liveCommittedFramesRef.current.length > 0) {
        return;
      }
      const first = serializeEngineFrame(gameRef.current.state);
      liveCommittedFramesRef.current = [first];
      setLiveCommittedLength(1);
      setCursorStep(0);
    }
  }, [game.state.phase, record]);

  useEffect(() => {
    if (record !== null) {
      return;
    }
    if (game.state.phase !== "running" && game.state.phase !== "finished") {
      return;
    }
    if (game.isAnimating) {
      return;
    }
    if (liveCommittedLength === 0) {
      return;
    }
    if (cursorStep !== liveCommittedLength - 1) {
      return;
    }
    const serialized = serializeEngineFrame(game.state);
    const frames = liveCommittedFramesRef.current;
    const last = frames[frames.length - 1];
    if (last && engineFramesDeepEqual(last, serialized)) {
      return;
    }
    const next = commitEngineFrameToBuffer(frames, serialized);
    liveCommittedFramesRef.current = next;
    setLiveCommittedLength(next.length);
    setCursorStep(next.length - 1);
  }, [
    record,
    game.state,
    game.isAnimating,
    game.state.phase,
    liveCommittedLength,
    cursorStep,
  ]);

  useEffect(() => {
    if (!record || !expectingReplayAdvanceRef.current) {
      return;
    }
    if (gameRef.current.isAnimating) {
      return;
    }
    expectingReplayAdvanceRef.current = false;
    const nextStep = cursorStep + 1;
    if (nextStep >= record.frames.length) {
      return;
    }
    if (liveEngineMatchesFrame(gameRef.current.state, record.frames[nextStep]!)) {
      setCursorStep(nextStep);
    }
  }, [game.isAnimating, game.state, record, cursorStep]);

  useEffect(() => {
    if (!playbackAuto || !record) {
      return;
    }
    if (gameRef.current.isAnimating) {
      return;
    }
    if (cursorStep >= record.frames.length - 1) {
      setPlaybackAuto(false);
      return;
    }
    const id = window.setTimeout(() => {
      scrubToStep(cursorStep + 1, {
        preservePlaybackAuto: true,
        playVisualEvents: true,
      });
    }, 0);
    return () => window.clearTimeout(id);
  }, [playbackAuto, record, cursorStep, game.isAnimating, scrubToStep]);

  useEffect(() => {
    if (!playbackAuto || record) {
      return;
    }
    if (atLiveCommittedTail) {
      return;
    }
    if (liveCommittedLength === 0) {
      return;
    }
    if (gameRef.current.isAnimating) {
      return;
    }
    if (cursorStep >= liveCommittedLength - 1) {
      setPlaybackAuto(false);
      return;
    }
    const id = window.setTimeout(() => {
      scrubToStep(cursorStep + 1, {
        preservePlaybackAuto: true,
        playVisualEvents: true,
      });
    }, 0);
    return () => window.clearTimeout(id);
  }, [
    playbackAuto,
    record,
    atLiveCommittedTail,
    liveCommittedLength,
    cursorStep,
    game.isAnimating,
    scrubToStep,
  ]);

  useEffect(() => {
    if (replayPlayTurnTarget === null || !record) {
      return;
    }
    if (gameRef.current.isAnimating) {
      return;
    }
    if (cursorStep >= replayPlayTurnTarget) {
      setReplayPlayTurnTarget(null);
      return;
    }
    const id = window.setTimeout(() => {
      scrubToStep(cursorStep + 1, {
        preservePlaybackAuto: true,
        playVisualEvents: true,
      });
    }, 0);
    return () => window.clearTimeout(id);
  }, [replayPlayTurnTarget, record, cursorStep, game.isAnimating, scrubToStep]);

  useEffect(() => {
    setCursorStep((s) => Math.min(s, timelineMax));
  }, [timelineMax]);

  const canExportReplayJson = useMemo(() => {
    if (record) {
      return true;
    }
    if (liveCommittedLength === 0) {
      return false;
    }
    return Boolean(gameRef.current.getLastRaceSetup?.());
  }, [record, liveCommittedLength]);

  return {
    isReplayLoaded,
    flushPlaybackForNewSession,
    canExportReplayJson,
    timelineStep: cursorStep,
    timelineMax,
    currentEngineTurn: game.state.turnIndex,
    seekTurnDraft,
    setSeekTurnDraft,
    loadReplayRecord,
    clearReplay,
    scrubToStep,
    stepReplayBackward,
    stepReplayForwardAnimated,
    jumpToPresent,
    historyStepBack,
    exportRecordJson,
    readReplayFromJsonText,
    seekToEngineTurn,
    spectateAdvanceStep: stepReplayForwardAnimated,
    spectatePlayTurn,
    spectateToggleAuto,
    spectateAutoActive: playbackAuto,
    spectatePlayTurnChaining: replayPlayTurnTarget !== null,
    replayBannersEnabled,
    replayBannerPayload,
    toggleReplayBanners,
    jumpToPresentVisible: cursorStep < timelineMax,
    quickResolveTurn,
    quickResolveRace,
  };
}
