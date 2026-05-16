import {
  ACTIVE_BASIC_DANGO_COUNT,
  SELECTABLE_BASIC_DANGO_IDS,
} from "@/constants/ids";
import { LINEUP_GROUPS } from "@/constants/lineupGroups";
import { CHARACTER_BY_ID } from "@/services/characters";
import { isValidBasicSelection } from "@/services/gameEngine";
import {
  readStorageValue,
  writeStorageValue,
} from "@/services/persistence/storage";
import type { DangoId } from "@/types/game";

export const SAVED_LINEUP_STORAGE_KEY = "dango_scramble_saved_lineup";

const DEFAULT_GROUP_LINEUP =
  LINEUP_GROUPS.find((group) => group.id === "B")?.characterIds ?? [];

export function buildSmartDefaultPendingBasicIds(): DangoId[] {
  const allowed = new Set<string>(SELECTABLE_BASIC_DANGO_IDS);
  const picked: DangoId[] = [];
  const taken = new Set<string>();

  for (const id of DEFAULT_GROUP_LINEUP) {
    if (!allowed.has(id) || taken.has(id)) {
      continue;
    }
    picked.push(id as DangoId);
    taken.add(id);
    if (picked.length === ACTIVE_BASIC_DANGO_COUNT) {
      return picked;
    }
  }

  for (const id of SELECTABLE_BASIC_DANGO_IDS) {
    if (!allowed.has(id) || taken.has(id)) {
      continue;
    }
    picked.push(id as DangoId);
    taken.add(id);
    if (picked.length === ACTIVE_BASIC_DANGO_COUNT) {
      return picked;
    }
  }

  return picked;
}

function lineupExistsInRegistry(ids: DangoId[]): boolean {
  return ids.every((id) => CHARACTER_BY_ID[id] !== undefined);
}

export function parseStoredLineupPayload(raw: string | null): DangoId[] | null {
  if (raw === null || raw === "") {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }
    if (parsed.length !== ACTIVE_BASIC_DANGO_COUNT) {
      return null;
    }
    const asStrings = parsed.filter(
      (entry): entry is string => typeof entry === "string"
    );
    if (asStrings.length !== ACTIVE_BASIC_DANGO_COUNT) {
      return null;
    }
    const asIds = asStrings as DangoId[];
    if (
      isValidBasicSelection(asIds) &&
      lineupExistsInRegistry(asIds)
    ) {
      return asIds;
    }
    return null;
  } catch {
    return null;
  }
}

export function readPersistedLineupSelection(): DangoId[] | null {
  return parseStoredLineupPayload(readStorageValue(SAVED_LINEUP_STORAGE_KEY));
}

export function writePersistedLineupSelection(ids: DangoId[]): void {
  writeStorageValue(SAVED_LINEUP_STORAGE_KEY, JSON.stringify(ids));
}

export function resolvePersistedOrSmartDefaultLineup(): DangoId[] {
  const stored = readPersistedLineupSelection();
  if (stored !== null) {
    return stored;
  }
  return buildSmartDefaultPendingBasicIds();
}
