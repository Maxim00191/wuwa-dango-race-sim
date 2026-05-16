import type { MapId } from "@/constants/maps";

const STORAGE_KEY = "wuwa-dango-race-sim-selected-map";

export function writePersistedMapId(mapId: MapId): void {
  try {
    localStorage.setItem(STORAGE_KEY, mapId);
  } catch {
    return;
  }
}
