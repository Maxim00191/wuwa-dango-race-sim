import { ACTIVE_BASIC_DANGO_COUNT, SELECTABLE_BASIC_DANGO_IDS } from "@/constants/ids";
import type { DangoId } from "@/types/game";

export const SELECTABLE_BASIC_ID_SET = new Set<string>(SELECTABLE_BASIC_DANGO_IDS);

export function isValidBasicSelection(ids: DangoId[]): boolean {
  if (ids.length !== ACTIVE_BASIC_DANGO_COUNT) {
    return false;
  }
  const unique = new Set(ids);
  if (unique.size !== ids.length) {
    return false;
  }
  return ids.every((id) => SELECTABLE_BASIC_ID_SET.has(id));
}
