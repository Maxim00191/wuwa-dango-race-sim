import { useCallback, useEffect, useMemo, useState } from "react";
import type { WorkspaceView } from "@/components/AppNavigation";
import {
  boardLookupForMap,
  resolveMapIdFromBoardAssignments,
  type MapId,
} from "@/constants/maps";
import { writePersistedMapId } from "@/services/savedMapSelection";
import { preferredMapIdForWorkspaceView } from "@/services/workspaceMapPreference";
import type { BoardEffectAssignmentJson } from "@/types/replay";

export function useMapSelection(workspaceView: WorkspaceView) {
  const [selectedMapId, setSelectedMapIdState] = useState<MapId>(() =>
    preferredMapIdForWorkspaceView(workspaceView)
  );

  useEffect(() => {
    const preferredMapId = preferredMapIdForWorkspaceView(workspaceView);
    setSelectedMapIdState((current) => {
      if (current === preferredMapId) {
        return current;
      }
      writePersistedMapId(preferredMapId);
      return preferredMapId;
    });
  }, [workspaceView]);

  const boardEffects = useMemo(
    () => boardLookupForMap(selectedMapId),
    [selectedMapId]
  );

  const setSelectedMapId = useCallback((mapId: MapId) => {
    setSelectedMapIdState(mapId);
    writePersistedMapId(mapId);
  }, []);

  const syncFromBoardAssignments = useCallback(
    (rows: BoardEffectAssignmentJson[]) => {
      const resolved = resolveMapIdFromBoardAssignments(rows);
      if (resolved) {
        setSelectedMapId(resolved);
      }
    },
    [setSelectedMapId]
  );

  return {
    selectedMapId,
    setSelectedMapId,
    boardEffects,
    syncFromBoardAssignments,
  };
}
