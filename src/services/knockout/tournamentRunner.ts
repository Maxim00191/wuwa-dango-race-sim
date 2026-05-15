import {
  buildFinalsRoster,
  buildLosersBracketRoster,
  buildWinnersBracketRoster,
  type KnockoutPhaseId,
} from "@/services/knockout/bracket";
import {
  createKnockoutSprintRaceSetup,
  deriveBasicPlacementsFromRace,
} from "@/services/raceSetup";
import { simulateHeadlessRace } from "@/services/engine/headless/simulateRace";
import type { DangoId } from "@/types/game";
import type {
  HeadlessRaceDeepMetrics,
  KnockoutPhaseResult,
} from "@/types/monteCarlo";

export type KnockoutTournamentBracketState = {
  groupAPlacements: DangoId[] | null;
  groupBPlacements: DangoId[] | null;
  winnersBracketPlacements: DangoId[] | null;
  losersBracketPlacements: DangoId[] | null;
  finalsPlacements: DangoId[] | null;
};

export type KnockoutTournamentRunResult = {
  championBasicId: DangoId | null;
  finalsPlacements: DangoId[];
  phaseResults: KnockoutPhaseResult[];
  totalTurns: number;
  bracketState: KnockoutTournamentBracketState;
};

export function resolveKnockoutPhaseRoster(
  phase: KnockoutPhaseId,
  groupAIds: DangoId[],
  groupBIds: DangoId[],
  bracket: KnockoutTournamentBracketState
): DangoId[] {
  if (phase === "groupA") {
    return groupAIds;
  }
  if (phase === "groupB") {
    return groupBIds;
  }
  if (phase === "winnersBracket") {
    if (!bracket.groupAPlacements || !bracket.groupBPlacements) {
      return [];
    }
    return buildWinnersBracketRoster(
      bracket.groupAPlacements,
      bracket.groupBPlacements
    );
  }
  if (phase === "losersBracket") {
    if (!bracket.groupAPlacements || !bracket.groupBPlacements) {
      return [];
    }
    return buildLosersBracketRoster(
      bracket.groupAPlacements,
      bracket.groupBPlacements
    );
  }
  if (!bracket.winnersBracketPlacements || !bracket.losersBracketPlacements) {
    return [];
  }
  return buildFinalsRoster(
    bracket.winnersBracketPlacements,
    bracket.losersBracketPlacements
  );
}

function applyPhasePlacements(
  bracket: KnockoutTournamentBracketState,
  phase: KnockoutPhaseId,
  placements: DangoId[]
): KnockoutTournamentBracketState {
  if (phase === "groupA") {
    return { ...bracket, groupAPlacements: placements };
  }
  if (phase === "groupB") {
    return { ...bracket, groupBPlacements: placements };
  }
  if (phase === "winnersBracket") {
    return { ...bracket, winnersBracketPlacements: placements };
  }
  if (phase === "losersBracket") {
    return { ...bracket, losersBracketPlacements: placements };
  }
  return { ...bracket, finalsPlacements: placements };
}

export function createEmptyKnockoutBracketState(): KnockoutTournamentBracketState {
  return {
    groupAPlacements: null,
    groupBPlacements: null,
    winnersBracketPlacements: null,
    losersBracketPlacements: null,
    finalsPlacements: null,
  };
}

export function runKnockoutPhaseRace(
  phase: KnockoutPhaseId,
  groupAIds: DangoId[],
  groupBIds: DangoId[],
  bracket: KnockoutTournamentBracketState,
  boardEffectByCellIndex: Map<number, string | null>,
  captureReplay: boolean
): {
  phaseResult: KnockoutPhaseResult;
  bracket: KnockoutTournamentBracketState;
} {
  const roster = resolveKnockoutPhaseRoster(phase, groupAIds, groupBIds, bracket);
  const race = simulateHeadlessRace(
    createKnockoutSprintRaceSetup(roster, phase),
    boardEffectByCellIndex,
    captureReplay
  );
  const placements = deriveBasicPlacementsFromRace(race.state);
  const phaseResult: KnockoutPhaseResult = {
    phase,
    placements,
    metrics: race.metrics,
    turnsAtFinish: race.state.turnIndex,
    record: race.record,
  };
  return {
    phaseResult,
    bracket: applyPhasePlacements(bracket, phase, placements),
  };
}

export function runKnockoutTournament(
  groupAIds: DangoId[],
  groupBIds: DangoId[],
  boardEffectByCellIndex: Map<number, string | null>,
  captureReplay: boolean
): KnockoutTournamentRunResult {
  let bracket = createEmptyKnockoutBracketState();
  const phaseResults: KnockoutPhaseResult[] = [];
  let totalTurns = 0;
  const phases: KnockoutPhaseId[] = [
    "groupA",
    "groupB",
    "winnersBracket",
    "losersBracket",
    "finals",
  ];
  for (const phase of phases) {
    const step = runKnockoutPhaseRace(
      phase,
      groupAIds,
      groupBIds,
      bracket,
      boardEffectByCellIndex,
      captureReplay
    );
    bracket = step.bracket;
    phaseResults.push(step.phaseResult);
    totalTurns += step.phaseResult.turnsAtFinish;
  }
  const finalsPlacements = bracket.finalsPlacements ?? [];
  return {
    championBasicId:
      finalsPlacements[0] ?? phaseResults.at(-1)?.metrics.winnerBasicId ?? null,
    finalsPlacements,
    phaseResults,
    totalTurns,
    bracketState: bracket,
  };
}

export function knockoutPhaseMetricsByPhase(
  phaseResults: KnockoutPhaseResult[]
): Partial<Record<KnockoutPhaseId, HeadlessRaceDeepMetrics>> {
  return Object.fromEntries(
    phaseResults.map((result) => [result.phase, result.metrics])
  );
}
