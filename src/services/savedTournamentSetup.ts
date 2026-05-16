import {
  createDefaultFinalPlacements,
  sanitizeFinalPlacements,
} from "@/services/raceSetup";
import {
  readStorageValue,
  writeStorageValue,
} from "@/services/persistence/storage";
import type { DangoId } from "@/types/game";

export const SAVED_TOURNAMENT_FINALS_STORAGE_KEY =
  "dango_scramble_saved_tournament_finals";

type PersistedTournamentFinalsMap = Record<string, DangoId[]>;

function buildTournamentFinalsKey(selectedBasicIds: DangoId[]): string {
  return [...selectedBasicIds].sort().join("|");
}

function parsePersistedTournamentFinalsMap(
  raw: string | null
): PersistedTournamentFinalsMap {
  if (raw === null || raw === "") {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const normalizedEntries = Object.entries(parsed).flatMap(([key, value]) => {
      if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
        return [];
      }
      return [[key, value as DangoId[]] as const];
    });
    return Object.fromEntries(normalizedEntries);
  } catch {
    return {};
  }
}

export function readPersistedTournamentFinalPlacements(
  selectedBasicIds: DangoId[]
): DangoId[] | null {
  const persistedMap = parsePersistedTournamentFinalsMap(
    readStorageValue(SAVED_TOURNAMENT_FINALS_STORAGE_KEY)
  );
  const persistedPlacements =
    persistedMap[buildTournamentFinalsKey(selectedBasicIds)] ?? null;
  if (!persistedPlacements) {
    return null;
  }
  return sanitizeFinalPlacements(persistedPlacements, selectedBasicIds);
}

export function writePersistedTournamentFinalPlacements(
  selectedBasicIds: DangoId[],
  placements: DangoId[]
): void {
  const persistedMap = parsePersistedTournamentFinalsMap(
    readStorageValue(SAVED_TOURNAMENT_FINALS_STORAGE_KEY)
  );
  persistedMap[buildTournamentFinalsKey(selectedBasicIds)] =
    sanitizeFinalPlacements(placements, selectedBasicIds);
  writeStorageValue(
    SAVED_TOURNAMENT_FINALS_STORAGE_KEY,
    JSON.stringify(persistedMap)
  );
}

export function resolvePersistedOrDefaultTournamentFinalPlacements(
  selectedBasicIds: DangoId[]
): DangoId[] {
  return (
    readPersistedTournamentFinalPlacements(selectedBasicIds) ??
    createDefaultFinalPlacements(selectedBasicIds)
  );
}
