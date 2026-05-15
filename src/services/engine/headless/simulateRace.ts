import { KNOCKOUT_ADVANCE_COUNT } from "@/services/knockout/bracket";
import { runKnockoutTournament } from "@/services/knockout/tournamentRunner";
import {
  createTournamentFinalRaceSetup,
  createTournamentPreliminaryRaceSetup,
  deriveBasicPlacementsFromRace,
} from "@/services/raceSetup";
import {
  commitEngineFrameToBuffer,
  serializeBoardEffectAssignments,
  serializeEngineFrame,
} from "@/services/replaySerialization";
import { createEngineExecutionContext } from "@/services/engine/core/executionContext";
import { createRunningSessionFromSetup } from "@/services/engine/session";
import { applyStepAction } from "@/services/engine/turn/stepAction";
import { applyInstantFullTurn } from "@/services/engine/turn/instantAction";
import { buildHeadlessRaceMetrics } from "@/services/engine/headless/metrics";
import {
  buildPlacementIndexByBasicId,
  createHeadlessRaceTelemetryCollector,
} from "@/services/engine/headless/telemetry";
import type { HeadlessSimulationScenario } from "@/services/engine/headless/scenarioTypes";
import type { HeadlessRaceResult } from "@/services/engine/headless/metrics";
import type {
  HeadlessSimulationOutcome,
  KnockoutBracketLane,
} from "@/types/monteCarlo";
import type { MatchGameFrameJson } from "@/types/replay";
import type { RaceSetup } from "@/types/game";

export function simulateHeadlessRace(
  setup: RaceSetup,
  boardEffectByCellIndex: Map<number, string | null>,
  captureReplay: boolean
): HeadlessRaceResult {
  let activeGameState = createRunningSessionFromSetup(setup);
  const telemetry = createHeadlessRaceTelemetryCollector(setup);
  const executionContext = createEngineExecutionContext(boardEffectByCellIndex, {
    telemetry,
  });
  const safetyCap = 250_000;
  let iterations = 0;
  if (captureReplay) {
    const board = serializeBoardEffectAssignments(boardEffectByCellIndex);
    let frames: MatchGameFrameJson[] = [serializeEngineFrame(activeGameState)];
    while (activeGameState.phase === "running" && !activeGameState.winnerId) {
      if (iterations >= safetyCap) {
        break;
      }
      iterations += 1;
      const previousStamp = activeGameState.playbackStamp;
      activeGameState = applyStepAction(activeGameState, executionContext);
      if (
        activeGameState.playbackStamp === previousStamp &&
        activeGameState.phase === "running" &&
        !activeGameState.winnerId
      ) {
        break;
      }
      frames = commitEngineFrameToBuffer(
        frames,
        serializeEngineFrame(activeGameState)
      );
    }
    return {
      state: activeGameState,
      metrics: buildHeadlessRaceMetrics(setup, activeGameState, telemetry),
      record: {
        schemaVersion: 1,
        setup,
        board,
        frames,
      },
    };
  }
  while (activeGameState.phase === "running" && !activeGameState.winnerId) {
    if (iterations >= safetyCap) {
      break;
    }
    iterations += 1;
    const previousState = activeGameState;
    activeGameState = applyInstantFullTurn(activeGameState, executionContext);
    if (
      activeGameState === previousState &&
      activeGameState.phase === "running" &&
      !activeGameState.winnerId
    ) {
      break;
    }
  }
  return {
    state: activeGameState,
    metrics: buildHeadlessRaceMetrics(setup, activeGameState, telemetry),
    record: null,
  };
}

export function simulateHeadlessScenarioInternal(
  scenario: HeadlessSimulationScenario,
  boardEffectByCellIndex: Map<number, string | null>,
  captureReplay: boolean
): HeadlessSimulationOutcome {
  if (scenario.kind === "singleRace") {
    const race = simulateHeadlessRace(
      scenario.setup,
      boardEffectByCellIndex,
      captureReplay
    );
    const finalPlacements = deriveBasicPlacementsFromRace(race.state);
    const outcome: HeadlessSimulationOutcome = {
      scenarioKind: scenario.kind,
      winnerBasicId: race.state.winnerId ?? finalPlacements[0] ?? null,
      turnsAtFinish: race.state.turnIndex,
      preliminaryTurnsAtFinish: 0,
      finalTurnsAtFinish: race.state.turnIndex,
      preliminaryWinnerBasicId: null,
      finalPlacements,
      preliminaryPlacements: null,
      raceMetrics: {
        preliminary: null,
        final: race.metrics,
      },
      modeMetrics: {
        kind: "singleRace",
        finalStartingPlacementByBasicId: race.metrics.startingPlacementByBasicId,
      },
    };
    if (race.record) {
      outcome.capturedReplay = {
        scenarioKind: "singleRace",
        record: race.record,
      };
    }
    return outcome;
  }

  if (scenario.kind === "knockoutTournament") {
    const tournament = runKnockoutTournament(
      scenario.groupAIds,
      scenario.groupBIds,
      boardEffectByCellIndex,
      captureReplay
    );
    const finalsMetrics =
      tournament.phaseResults.find((result) => result.phase === "finals")
        ?.metrics ?? tournament.phaseResults.at(-1)!.metrics;
    const groupPlacementByBasicId: Record<string, number> = {};
    const bracketPlacementByBasicId: Record<string, number> = {};
    const groupTopThreeReachedFinalsByBasicId: Record<string, boolean> = {};
    const bracketLaneByBasicId: Record<string, KnockoutBracketLane> = {};
    const reachedFinalsByBasicId: Record<string, boolean> = {};
    const finalsParticipantSet = new Set(tournament.finalsPlacements);
    for (const phaseResult of tournament.phaseResults) {
      const placementIndexByBasicId = buildPlacementIndexByBasicId(
        phaseResult.placements
      );
      if (phaseResult.phase === "groupA" || phaseResult.phase === "groupB") {
        for (const [basicId, placementIndex] of Object.entries(
          placementIndexByBasicId
        )) {
          groupPlacementByBasicId[basicId] = placementIndex;
          groupTopThreeReachedFinalsByBasicId[basicId] =
            placementIndex < KNOCKOUT_ADVANCE_COUNT &&
            finalsParticipantSet.has(basicId);
        }
      }
      if (
        phaseResult.phase === "winnersBracket" ||
        phaseResult.phase === "losersBracket"
      ) {
        const lane = phaseResult.phase;
        for (const [basicId, placementIndex] of Object.entries(
          placementIndexByBasicId
        )) {
          bracketPlacementByBasicId[basicId] = placementIndex;
          bracketLaneByBasicId[basicId] = lane;
          reachedFinalsByBasicId[basicId] = finalsParticipantSet.has(basicId);
        }
      }
    }
    const outcome: HeadlessSimulationOutcome = {
      scenarioKind: scenario.kind,
      winnerBasicId: tournament.championBasicId,
      turnsAtFinish: tournament.totalTurns,
      preliminaryTurnsAtFinish: 0,
      finalTurnsAtFinish:
        tournament.phaseResults.find((result) => result.phase === "finals")
          ?.turnsAtFinish ?? 0,
      preliminaryWinnerBasicId: null,
      finalPlacements: tournament.finalsPlacements,
      preliminaryPlacements: null,
      raceMetrics: {
        preliminary: null,
        final: finalsMetrics,
      },
      modeMetrics: {
        kind: "knockout",
        groupPlacementByBasicId,
        bracketPlacementByBasicId,
        groupTopThreeReachedFinalsByBasicId,
        bracketLaneByBasicId,
        reachedFinalsByBasicId,
      },
      knockoutPhases: tournament.phaseResults,
    };
    if (captureReplay) {
      const phases: Partial<
        Record<
          import("@/services/knockout/bracket").KnockoutPhaseId,
          import("@/types/replay").MatchRecord
        >
      > = {};
      for (const phaseResult of tournament.phaseResults) {
        if (phaseResult.record) {
          phases[phaseResult.phase] = phaseResult.record;
        }
      }
      outcome.capturedReplay = {
        scenarioKind: "knockoutTournament",
        phases,
      };
    }
    return outcome;
  }

  const preliminaryRace = simulateHeadlessRace(
    createTournamentPreliminaryRaceSetup(scenario.selectedBasicIds),
    boardEffectByCellIndex,
    captureReplay
  );
  const preliminaryPlacements = deriveBasicPlacementsFromRace(
    preliminaryRace.state
  );
  const finalRace = simulateHeadlessRace(
    createTournamentFinalRaceSetup(preliminaryPlacements),
    boardEffectByCellIndex,
    captureReplay
  );
  const finalPlacements = deriveBasicPlacementsFromRace(finalRace.state);
  const preliminaryWinnerBasicId =
    preliminaryRace.state.winnerId ?? preliminaryPlacements[0] ?? null;
  const finalWinnerBasicId = finalRace.state.winnerId ?? finalPlacements[0] ?? null;
  const outcome: HeadlessSimulationOutcome = {
    scenarioKind: scenario.kind,
    winnerBasicId: finalWinnerBasicId,
    turnsAtFinish: preliminaryRace.state.turnIndex + finalRace.state.turnIndex,
    preliminaryTurnsAtFinish: preliminaryRace.state.turnIndex,
    finalTurnsAtFinish: finalRace.state.turnIndex,
    preliminaryWinnerBasicId,
    finalPlacements,
    preliminaryPlacements,
    raceMetrics: {
      preliminary: preliminaryRace.metrics,
      final: finalRace.metrics,
    },
    modeMetrics: {
      kind: "tournament",
      preliminaryPlacementByBasicId: buildPlacementIndexByBasicId(
        preliminaryPlacements
      ),
      finalStartingPlacementByBasicId: finalRace.metrics.startingPlacementByBasicId,
      preliminaryWinnerRetainedTitle:
        preliminaryWinnerBasicId !== null &&
        preliminaryWinnerBasicId === finalWinnerBasicId,
    },
  };
  if (preliminaryRace.record && finalRace.record) {
    outcome.capturedReplay = {
      scenarioKind: "tournament",
      preliminary: preliminaryRace.record,
      final: finalRace.record,
    };
  }
  return outcome;
}
