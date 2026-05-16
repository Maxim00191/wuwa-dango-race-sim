import { arraysEqual } from "@/lib/arraysEqual";
import {
  createCustomFinalRaceSetup,
  createTournamentFinalRaceSetup,
} from "@/services/raceSetup";
import type { DangoId, RaceSetup } from "@/types/game";

export function shouldUseOfficialTournamentFinalSetup(
  preliminaryPlacements: DangoId[] | null,
  finalPlacements: DangoId[]
): boolean {
  return (
    preliminaryPlacements !== null &&
    arraysEqual(finalPlacements, preliminaryPlacements)
  );
}

export function resolveTournamentFinalRaceSetup(
  preliminaryPlacements: DangoId[] | null,
  finalPlacements: DangoId[]
): RaceSetup {
  return shouldUseOfficialTournamentFinalSetup(
    preliminaryPlacements,
    finalPlacements
  )
    ? createTournamentFinalRaceSetup(finalPlacements)
    : createCustomFinalRaceSetup(finalPlacements);
}
