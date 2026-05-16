import type { MapId } from "@/constants/maps";
import { writeStorageValue } from "@/services/persistence/storage";

const STORAGE_KEY = "wuwa-dango-race-sim-selected-map";

export function writePersistedMapId(mapId: MapId): void {
  writeStorageValue(STORAGE_KEY, mapId);
}
