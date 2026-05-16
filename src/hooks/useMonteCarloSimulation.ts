import { useCallback, useEffect, useRef, useState } from "react";
import type { LocalizedText } from "@/i18n";
import type { WorkspaceView } from "@/config/workspaceViews";
import type { HeadlessSimulationScenario } from "@/services/gameEngine";
import { isValidBasicSelection } from "@/services/gameEngine";
import { isValidKnockoutGroupLineups } from "@/services/savedKnockoutSetup";
import { runMonteCarloBatch } from "@/services/monteCarlo/runner";
import { progressStore } from "@/services/monteCarlo/progressStore";
import type { DangoId } from "@/types/game";
import type {
  MonteCarloAggregateSnapshot,
  MonteCarloScenarioKind,
} from "@/types/monteCarlo";

export type MonteCarloProgressState = {
  completedGames: number;
  totalGames: number;
  timeRemainingLabel: string | null;
} | null;

type MonteCarloPendingProgress = {
  completedGames: number;
  totalGames: number;
};

export type MonteCarloRunOptions = {
  totalGames: number;
  scenario: HeadlessSimulationScenario;
  selectedBasicIds: DangoId[];
  scenarioKind: MonteCarloScenarioKind;
  scenarioLabel: LocalizedText;
  returnView: Exclude<WorkspaceView, "analysis">;
  extremePerformance?: boolean;
  boardEffectByCellIndex?: Map<number, string | null>;
};

export type UseMonteCarloSimulationOptions = {
  boardEffectByCellIndex: Map<number, string | null>;
  onComplete: (
    snapshot: MonteCarloAggregateSnapshot,
    returnView: Exclude<WorkspaceView, "analysis">
  ) => void;
};

const THROUGHPUT_EMA_ALPHA = 0.11;
const ETA_DISPLAY_SMOOTH = 0.17;

function isMonteCarloScenarioReady(
  scenario: HeadlessSimulationScenario,
  selectedBasicIds: DangoId[]
): boolean {
  if (scenario.kind === "knockoutTournament") {
    return isValidKnockoutGroupLineups({
      groupAIds: scenario.groupAIds,
      groupBIds: scenario.groupBIds,
    });
  }
  return isValidBasicSelection(selectedBasicIds);
}

function formatEtaRemainingSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  if (s < 60) {
    return `${s}s`;
  }
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function useMonteCarloSimulation({
  boardEffectByCellIndex,
  onComplete,
}: UseMonteCarloSimulationOptions) {
  const [localIsStopping, setLocalIsStopping] = useState(false);
  const runIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastProgressAtRef = useRef(0);
  const pendingProgressRef = useRef<MonteCarloPendingProgress | null>(null);
  const progressFrameRef = useRef<number | null>(null);
  const extremePerformanceRunRef = useRef(false);
  const lastRenderedCompletedRef = useRef(0);
  const etaLastCompletedRef = useRef(0);
  const etaLastSampleTimeRef = useRef(0);
  const emaMatchesPerMsRef = useRef<number | null>(null);
  const smoothedEtaMsRef = useRef<number | null>(null);

  const resetEtaTelemetry = useCallback(() => {
    const t = performance.now();
    etaLastCompletedRef.current = 0;
    etaLastSampleTimeRef.current = t;
    emaMatchesPerMsRef.current = null;
    smoothedEtaMsRef.current = null;
  }, []);

  const flushProgress = useCallback(
    (force = false) => {
      const pendingProgress = pendingProgressRef.current;
      if (!pendingProgress) {
        progressFrameRef.current = null;
        return;
      }
      const now = performance.now();
      const isComplete =
        pendingProgress.completedGames >= pendingProgress.totalGames;
      const totalGames = pendingProgress.totalGames;
      const chunkJump =
        totalGames > 0 &&
        Math.abs(
          pendingProgress.completedGames - lastRenderedCompletedRef.current
        ) /
          totalGames >=
          0.02;
      const bypassThrottle =
        force ||
        isComplete ||
        (extremePerformanceRunRef.current && chunkJump);
      if (!bypassThrottle && now - lastProgressAtRef.current < 32) {
        progressFrameRef.current = requestAnimationFrame(() => flushProgress());
        return;
      }
      pendingProgressRef.current = null;
      progressFrameRef.current = null;
      lastProgressAtRef.current = now;
      lastRenderedCompletedRef.current = pendingProgress.completedGames;

      const { completedGames: completed, totalGames: total } = pendingProgress;

      if (!isComplete && completed > 0) {
        const lastC = etaLastCompletedRef.current;
        const lastT = etaLastSampleTimeRef.current;
        if (completed > lastC) {
          const dC = completed - lastC;
          const dT = now - lastT;
          if (dT > 0) {
            const sample = dC / dT;
            const ema = emaMatchesPerMsRef.current;
            emaMatchesPerMsRef.current =
              ema === null
                ? sample
                : ema * (1 - THROUGHPUT_EMA_ALPHA) +
                  sample * THROUGHPUT_EMA_ALPHA;
          }
          etaLastCompletedRef.current = completed;
          etaLastSampleTimeRef.current = now;
        }
      }

      let timeRemainingLabel: string | null = null;
      if (!isComplete && completed > 0 && emaMatchesPerMsRef.current !== null) {
        const rate = emaMatchesPerMsRef.current;
        if (rate > 0) {
          const rawMs = (total - completed) / rate;
          const prevSmooth = smoothedEtaMsRef.current;
          const nextSmooth =
            prevSmooth === null
              ? rawMs
              : prevSmooth * (1 - ETA_DISPLAY_SMOOTH) +
                rawMs * ETA_DISPLAY_SMOOTH;
          smoothedEtaMsRef.current = Math.min(
            Math.max(0, nextSmooth),
            3_600_000
          );
          timeRemainingLabel = formatEtaRemainingSeconds(
            smoothedEtaMsRef.current / 1000
          );
        }
      }

      if (isComplete) {
        emaMatchesPerMsRef.current = null;
        smoothedEtaMsRef.current = null;
        etaLastCompletedRef.current = 0;
        etaLastSampleTimeRef.current = 0;
      }

      progressStore.setState({
        completedGames: completed,
        totalGames: total,
        timeRemainingLabel,
        isStopping: abortControllerRef.current?.signal.aborted ?? false,
      });
    },
    []
  );

  const scheduleProgress = useCallback(
    (nextProgress: MonteCarloPendingProgress) => {
      pendingProgressRef.current = nextProgress;
      if (progressFrameRef.current !== null) {
        return;
      }
      progressFrameRef.current = requestAnimationFrame(() => flushProgress());
    },
    [flushProgress]
  );

  useEffect(
    () => () => {
      if (progressFrameRef.current !== null) {
        cancelAnimationFrame(progressFrameRef.current);
      }
    },
    []
  );

  const runScenario = useCallback(
    async (options: MonteCarloRunOptions) => {
      const {
        totalGames,
        scenario,
        selectedBasicIds,
        scenarioKind,
        scenarioLabel,
        returnView,
        extremePerformance = false,
        boardEffectByCellIndex: scenarioBoardEffects,
      } = options;
      const effectiveBoardEffects =
        scenarioBoardEffects ?? boardEffectByCellIndex;
      if (
        !Number.isSafeInteger(totalGames) ||
        totalGames < 1 ||
        !isMonteCarloScenarioReady(scenario, selectedBasicIds)
      ) {
        return;
      }
      abortControllerRef.current?.abort();
      const runId = (runIdRef.current += 1);
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setLocalIsStopping(false);
      progressStore.setState({
        completedGames: 0,
        totalGames,
        timeRemainingLabel: null,
        isStopping: false,
      });
      pendingProgressRef.current = null;
      lastProgressAtRef.current = 0;
      lastRenderedCompletedRef.current = 0;
      extremePerformanceRunRef.current = extremePerformance;
      resetEtaTelemetry();
      const result = await runMonteCarloBatch({
        totalRuns: totalGames,
        scenario,
        selectedBasicIds,
        scenarioKind,
        scenarioLabel,
        boardEffectByCellIndex: effectiveBoardEffects,
        extremePerformance,
        onProgress: (completedGames, totalGamesBatch) => {
          if (runIdRef.current !== runId) {
            return;
          }
          scheduleProgress({
            completedGames,
            totalGames: totalGamesBatch,
          });
        },
        signal: abortController.signal,
        shouldAbort: () => runIdRef.current !== runId,
      });
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      if (runIdRef.current !== runId) {
        return;
      }
      if (progressFrameRef.current !== null) {
        cancelAnimationFrame(progressFrameRef.current);
        progressFrameRef.current = null;
      }
      pendingProgressRef.current = null;
      progressStore.setState(null);
      setLocalIsStopping(false);
      if (result.snapshot) {
        onComplete(result.snapshot, returnView);
      }
    },
    [boardEffectByCellIndex, onComplete, resetEtaTelemetry, scheduleProgress]
  );

  const abortRun = useCallback(() => {
    const controller = abortControllerRef.current;
    if (!controller || controller.signal.aborted) {
      return;
    }
    setLocalIsStopping(true);
    controller.abort();
    const current = progressStore.getState();
    if (current) {
      progressStore.setState({ ...current, isStopping: true });
    }
  }, []);

  return {
    isStopping: localIsStopping,
    runScenario,
    abortRun,
  };
}

