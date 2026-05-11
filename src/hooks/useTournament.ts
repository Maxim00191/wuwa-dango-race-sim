import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/hooks/useGame";
import { isValidBasicSelection } from "@/services/gameEngine";
import {
  createCustomFinalRaceSetup,
  createDefaultFinalPlacements,
  createTournamentFinalRaceSetup,
  createTournamentPreliminaryRaceSetup,
  deriveBasicPlacementsFromRace,
  isValidFinalPlacements,
  sanitizeFinalPlacements,
} from "@/services/raceSetup";
import {
  resolvePersistedOrDefaultTournamentFinalPlacements,
  writePersistedTournamentFinalPlacements,
} from "@/services/savedTournamentSetup";
import type { DangoId } from "@/types/game";

function arraysEqual(left: DangoId[], right: DangoId[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((id, index) => id === right[index]);
}

export function useTournament(selectedBasicIds: DangoId[]) {
  const race = useGame();
  const [persistedFinalPlacements, setPersistedFinalPlacements] = useState<DangoId[]>(
    () => resolvePersistedOrDefaultTournamentFinalPlacements(selectedBasicIds)
  );
  const [finalPlacements, setFinalPlacementsState] = useState<DangoId[]>(() =>
    resolvePersistedOrDefaultTournamentFinalPlacements(selectedBasicIds)
  );
  const [preliminaryPlacements, setPreliminaryPlacements] = useState<
    DangoId[] | null
  >(null);
  const handledPreliminaryResultKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const resolvedPlacements =
      resolvePersistedOrDefaultTournamentFinalPlacements(selectedBasicIds);
    setPersistedFinalPlacements(resolvedPlacements);
    setFinalPlacementsState(resolvedPlacements);
    handledPreliminaryResultKeyRef.current = null;
    setPreliminaryPlacements(null);
  }, [selectedBasicIds]);

  useEffect(() => {
    if (!isValidFinalPlacements(persistedFinalPlacements, selectedBasicIds)) {
      return;
    }
    writePersistedTournamentFinalPlacements(
      selectedBasicIds,
      persistedFinalPlacements
    );
  }, [persistedFinalPlacements, selectedBasicIds]);

  useEffect(() => {
    if (
      race.state.phase !== "finished" ||
      race.state.mode !== "tournamentPreliminary"
    ) {
      return;
    }
    const resultKey = [
      race.state.turnIndex,
      race.state.winnerId ?? "",
      race.state.activeBasicIds.join("|"),
    ].join(":");
    if (handledPreliminaryResultKeyRef.current === resultKey) {
      return;
    }
    handledPreliminaryResultKeyRef.current = resultKey;
    const placements = deriveBasicPlacementsFromRace(race.state);
    setPreliminaryPlacements(placements);
    setFinalPlacementsState(placements);
  }, [
    race.state,
    race.state.activeBasicIds,
    race.state.mode,
    race.state.phase,
    race.state.turnIndex,
    race.state.winnerId,
  ]);

  const setFinalPlacements = useCallback(
    (nextPlacements: DangoId[]) => {
      const sanitized = sanitizeFinalPlacements(nextPlacements, selectedBasicIds);
      setPersistedFinalPlacements(sanitized);
      setFinalPlacementsState(sanitized);
    },
    [selectedBasicIds]
  );

  const moveFinalPlacement = useCallback(
    (fromIndex: number, toIndex: number) => {
      setFinalPlacementsState((current) => {
        if (
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= current.length ||
          toIndex >= current.length ||
          fromIndex === toIndex
        ) {
          return current;
        }
        const next = [...current];
        const [moved] = next.splice(fromIndex, 1);
        if (!moved) {
          return current;
        }
        next.splice(toIndex, 0, moved);
        const sanitized = sanitizeFinalPlacements(next, selectedBasicIds);
        setPersistedFinalPlacements(sanitized);
        return sanitized;
      });
    },
    [selectedBasicIds]
  );

  const startPreliminary = useCallback(() => {
    if (!isValidBasicSelection(selectedBasicIds)) {
      return;
    }
    handledPreliminaryResultKeyRef.current = null;
    setPreliminaryPlacements(null);
    race.start(createTournamentPreliminaryRaceSetup(selectedBasicIds));
  }, [race, selectedBasicIds]);

  const startFinal = useCallback(() => {
    if (!isValidBasicSelection(selectedBasicIds)) {
      return;
    }
    const sanitized = sanitizeFinalPlacements(finalPlacements, selectedBasicIds);
    setFinalPlacementsState(sanitized);
    const shouldUseTournamentFinalSetup =
      preliminaryPlacements !== null &&
      arraysEqual(sanitized, preliminaryPlacements);
    race.start(
      shouldUseTournamentFinalSetup
        ? createTournamentFinalRaceSetup(sanitized)
        : createCustomFinalRaceSetup(sanitized)
    );
  }, [finalPlacements, preliminaryPlacements, race, selectedBasicIds]);

  const restorePreliminaryPlacements = useCallback(() => {
    if (!preliminaryPlacements) {
      return;
    }
    const sanitized = sanitizeFinalPlacements(
      preliminaryPlacements,
      selectedBasicIds
    );
    setPersistedFinalPlacements(sanitized);
    setFinalPlacementsState(sanitized);
  }, [preliminaryPlacements, selectedBasicIds]);

  const clearRace = useCallback(() => {
    race.reset();
  }, [race]);

  const resetTournament = useCallback(() => {
    handledPreliminaryResultKeyRef.current = null;
    setPreliminaryPlacements(null);
    const defaultPlacements = createDefaultFinalPlacements(selectedBasicIds);
    setPersistedFinalPlacements(defaultPlacements);
    setFinalPlacementsState(defaultPlacements);
    race.reset();
  }, [race, selectedBasicIds]);

  const sessionLabel = useMemo(() => {
    if (race.state.shortLabel) {
      return race.state.shortLabel;
    }
    if (preliminaryPlacements) {
      return "Finals Ready";
    }
    return "Tournament Setup";
  }, [preliminaryPlacements, race.state.shortLabel]);

  return {
    race,
    finalPlacements,
    preliminaryPlacements,
    hasPreliminaryResult: preliminaryPlacements !== null,
    sessionLabel,
    setFinalPlacements,
    moveFinalPlacement,
    startPreliminary,
    startFinal,
    restorePreliminaryPlacements,
    clearRace,
    resetTournament,
  };
}
