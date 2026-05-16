import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { text } from "@/i18n";
import { useGame, type UseGameOptions } from "@/hooks/useGame";
import {
  KNOCKOUT_PHASE_SEQUENCE,
  nextKnockoutPhase,
  type KnockoutPhaseId,
} from "@/services/knockout/bracket";
import {
  createEmptyKnockoutBracketState,
  resolveKnockoutPhaseRoster,
  type KnockoutTournamentBracketState,
} from "@/services/knockout/tournamentRunner";
import {
  createKnockoutSprintRaceSetup,
  deriveBasicPlacementsFromRace,
} from "@/services/raceSetup";
import { isValidKnockoutGroupLineups } from "@/services/savedKnockoutSetup";
import type { DangoId } from "@/types/game";

export type KnockoutTournamentProgress = {
  currentPhase: KnockoutPhaseId | null;
  nextPhase: KnockoutPhaseId | null;
  completedPhases: KnockoutPhaseId[];
  bracket: KnockoutTournamentBracketState;
  championBasicId: DangoId | null;
};

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

export function useKnockoutTournament(
  groupAIds: DangoId[],
  groupBIds: DangoId[],
  options: UseGameOptions = {}
) {
  const race = useGame(options);
  const raceReset = race.reset;
  const raceStart = race.start;
  const raceState = race.state;
  const [bracket, setBracket] = useState<KnockoutTournamentBracketState>(() =>
    createEmptyKnockoutBracketState()
  );
  const [currentPhase, setCurrentPhase] = useState<KnockoutPhaseId | null>(null);
  const [completedPhases, setCompletedPhases] = useState<KnockoutPhaseId[]>([]);
  const handledResultKeyRef = useRef<string | null>(null);

  const lineupsReady = isValidKnockoutGroupLineups({ groupAIds, groupBIds });

  useEffect(() => {
    setBracket(createEmptyKnockoutBracketState());
    setCurrentPhase(null);
    setCompletedPhases([]);
    handledResultKeyRef.current = null;
    raceReset();
  }, [groupAIds, groupBIds, raceReset]);

  useEffect(() => {
    if (raceState.phase !== "finished" || currentPhase === null) {
      return;
    }
    const resultKey = [
      currentPhase,
      raceState.turnIndex,
      raceState.winnerId ?? "",
      raceState.activeBasicIds.join("|"),
    ].join(":");
    if (handledResultKeyRef.current === resultKey) {
      return;
    }
    handledResultKeyRef.current = resultKey;
    const placements = deriveBasicPlacementsFromRace(raceState);
    setBracket((previous) => applyPhasePlacements(previous, currentPhase, placements));
    setCompletedPhases((previous) =>
      previous.includes(currentPhase) ? previous : [...previous, currentPhase]
    );
    setCurrentPhase(null);
  }, [
    currentPhase,
    raceState,
    raceState.activeBasicIds,
    raceState.phase,
    raceState.turnIndex,
    raceState.winnerId,
  ]);

  const startPhase = useCallback(
    (phase: KnockoutPhaseId) => {
      if (!lineupsReady) {
        return;
      }
      const roster = resolveKnockoutPhaseRoster(phase, groupAIds, groupBIds, bracket);
      if (roster.length === 0) {
        return;
      }
      handledResultKeyRef.current = null;
      setCurrentPhase(phase);
      raceStart(createKnockoutSprintRaceSetup(roster, phase));
    },
    [bracket, groupAIds, groupBIds, lineupsReady, raceStart]
  );

  const startTournament = useCallback(() => {
    if (!lineupsReady) {
      return;
    }
    setBracket(createEmptyKnockoutBracketState());
    setCompletedPhases([]);
    handledResultKeyRef.current = null;
    startPhase("groupA");
  }, [lineupsReady, startPhase]);

  const advanceTournament = useCallback(() => {
    if (!lineupsReady || raceState.phase === "running" || currentPhase !== null) {
      return;
    }
    const next = nextKnockoutPhase(completedPhases.at(-1) ?? null);
    if (!next) {
      return;
    }
    startPhase(next);
  }, [completedPhases, currentPhase, lineupsReady, raceState.phase, startPhase]);

  const resetTournament = useCallback(() => {
    handledResultKeyRef.current = null;
    setBracket(createEmptyKnockoutBracketState());
    setCurrentPhase(null);
    setCompletedPhases([]);
    raceReset();
  }, [raceReset]);

  const clearRace = useCallback(() => {
    handledResultKeyRef.current = null;
    setCurrentPhase(null);
    raceReset();
  }, [raceReset]);

  const nextPhase = useMemo(
    () => nextKnockoutPhase(completedPhases.at(-1) ?? null),
    [completedPhases]
  );

  const championBasicId = bracket.finalsPlacements?.[0] ?? null;
  const isComplete = completedPhases.length === KNOCKOUT_PHASE_SEQUENCE.length;

  const sessionLabel = useMemo(() => {
    if (raceState.shortLabel) {
      return raceState.shortLabel;
    }
    if (isComplete && championBasicId) {
      return text("knockout.session.complete");
    }
    if (nextPhase) {
      return text(`knockout.session.awaiting.${nextPhase}`);
    }
    return text("knockout.session.setup");
  }, [championBasicId, isComplete, nextPhase, raceState.shortLabel]);

  const progress: KnockoutTournamentProgress = {
    currentPhase,
    nextPhase,
    completedPhases,
    bracket,
    championBasicId,
  };

  return {
    race,
    progress,
    sessionLabel,
    lineupsReady,
    isComplete,
    startTournament,
    advanceTournament,
    resetTournament,
    clearRace,
  };
}
