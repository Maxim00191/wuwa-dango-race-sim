import { ACTIVE_BASIC_DANGO_COUNT } from "@/constants/ids";
import {
  DEFAULT_KNOCKOUT_GROUP_A,
  DEFAULT_KNOCKOUT_GROUP_B,
} from "@/services/knockout/defaults";
import { CHARACTER_BY_ID } from "@/services/characters";
import { isValidBasicSelection } from "@/services/gameEngine";
import {
  readStorageValue,
  writeStorageValue,
} from "@/services/persistence/storage";
import type { DangoId } from "@/types/game";

export const SAVED_KNOCKOUT_SETUP_STORAGE_KEY =
  "dango_scramble_saved_knockout_setup";

export type KnockoutGroupLineups = {
  groupAIds: DangoId[];
  groupBIds: DangoId[];
};

function lineupExistsInRegistry(ids: DangoId[]): boolean {
  return ids.every((id) => CHARACTER_BY_ID[id] !== undefined);
}

export function parseStoredKnockoutPayload(
  raw: string | null
): KnockoutGroupLineups | null {
  if (raw === null || raw === "") {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const groupAIds = (parsed as { groupAIds?: unknown }).groupAIds;
    const groupBIds = (parsed as { groupBIds?: unknown }).groupBIds;
    if (!Array.isArray(groupAIds) || !Array.isArray(groupBIds)) {
      return null;
    }
    const normalizedA = groupAIds.filter(
      (entry): entry is string => typeof entry === "string"
    ) as DangoId[];
    const normalizedB = groupBIds.filter(
      (entry): entry is string => typeof entry === "string"
    ) as DangoId[];
    if (!isValidKnockoutGroupLineups({ groupAIds: normalizedA, groupBIds: normalizedB })) {
      return null;
    }
    if (!lineupExistsInRegistry(normalizedA) || !lineupExistsInRegistry(normalizedB)) {
      return null;
    }
    return { groupAIds: normalizedA, groupBIds: normalizedB };
  } catch {
    return null;
  }
}

export function isValidKnockoutGroupLineups(
  lineups: KnockoutGroupLineups
): boolean {
  if (
    !isValidBasicSelection(lineups.groupAIds) ||
    !isValidBasicSelection(lineups.groupBIds)
  ) {
    return false;
  }
  if (lineups.groupAIds.length !== ACTIVE_BASIC_DANGO_COUNT) {
    return false;
  }
  if (lineups.groupBIds.length !== ACTIVE_BASIC_DANGO_COUNT) {
    return false;
  }
  const seen = new Set<DangoId>();
  for (const id of [...lineups.groupAIds, ...lineups.groupBIds]) {
    if (seen.has(id)) {
      return false;
    }
    seen.add(id);
  }
  return true;
}

export function readPersistedKnockoutSetup(): KnockoutGroupLineups | null {
  return parseStoredKnockoutPayload(
    readStorageValue(SAVED_KNOCKOUT_SETUP_STORAGE_KEY)
  );
}

export function writePersistedKnockoutSetup(lineups: KnockoutGroupLineups): void {
  writeStorageValue(
    SAVED_KNOCKOUT_SETUP_STORAGE_KEY,
    JSON.stringify(lineups)
  );
}

export function resolvePersistedOrDefaultKnockoutSetup(): KnockoutGroupLineups {
  const stored = readPersistedKnockoutSetup();
  if (stored !== null) {
    return stored;
  }
  return {
    groupAIds: [...DEFAULT_KNOCKOUT_GROUP_A],
    groupBIds: [...DEFAULT_KNOCKOUT_GROUP_B],
  };
}
