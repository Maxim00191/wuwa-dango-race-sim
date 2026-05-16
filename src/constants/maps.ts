import { DEFAULT_MAP_CONFIG } from "@/constants/defaultMap";
import { KNOCKOUT_MAP_CONFIG } from "@/constants/knockoutMap";
import {
  buildBoardDescriptorWithCellEffects,
  buildEffectByCellIndexFromDeviceTiles,
  buildEffectLookup,
  type BoardDeviceTileMapConfig,
} from "@/services/boardLayout";
import { serializeBoardEffectAssignments } from "@/services/replaySerialization";
import type { BoardEffectAssignmentJson } from "@/types/replay";

export const MAP_PRESETS = {
  default: DEFAULT_MAP_CONFIG,
  knockout: KNOCKOUT_MAP_CONFIG,
} as const;

export type MapId = keyof typeof MAP_PRESETS;

export const MAP_IDS: readonly MapId[] = ["default", "knockout"];

export const DEFAULT_MAP_ID: MapId = "default";

export const KNOCKOUT_MAP_ID: MapId = "knockout";

export function buildBoardLookupFromConfig(
  config: BoardDeviceTileMapConfig
): Map<number, string | null> {
  return buildEffectLookup(
    buildBoardDescriptorWithCellEffects(
      config.tileCount,
      buildEffectByCellIndexFromDeviceTiles(config)
    )
  );
}

export function boardLookupForMap(mapId: MapId): Map<number, string | null> {
  return buildBoardLookupFromConfig(MAP_PRESETS[mapId]);
}

function boardAssignmentsSignature(
  rows: BoardEffectAssignmentJson[]
): string {
  return JSON.stringify(
    rows
      .filter((row) => row.effectId !== null)
      .sort((left, right) => left.cellIndex - right.cellIndex)
      .map((row) => `${row.cellIndex}:${row.effectId}`)
  );
}

export function boardAssignmentsMatchMap(
  rows: BoardEffectAssignmentJson[],
  mapId: MapId
): boolean {
  const presetAssignments = serializeBoardEffectAssignments(
    boardLookupForMap(mapId)
  );
  return boardAssignmentsSignature(rows) === boardAssignmentsSignature(presetAssignments);
}

export function resolveMapIdFromBoardAssignments(
  rows: BoardEffectAssignmentJson[]
): MapId | null {
  for (const mapId of MAP_IDS) {
    if (boardAssignmentsMatchMap(rows, mapId)) {
      return mapId;
    }
  }
  return null;
}
