import { useCallback, useEffect, useMemo, useState } from "react";
import type { WorkspaceView } from "@/config/workspaceViews";
import {
  boardLookupForMap,
  resolveMapIdFromBoardAssignments,
  type MapId,
} from "@/constants/maps";
import { writePersistedMapId } from "@/services/savedMapSelection";
import { preferredMapIdForWorkspaceView } from "@/services/workspaceMapPreference";
import { boardEffectAssignmentsToMap } from "@/services/matchReplay";
import type { BoardEffectAssignmentJson } from "@/types/replay";

export function useMapSelection(workspaceView: WorkspaceView) {
  const [liveMapId, setLiveMapId] = useState<MapId>(() =>
    preferredMapIdForWorkspaceView(workspaceView)
  );

  const [replayOverride, setReplayOverride] =
    useState<BoardEffectAssignmentJson[] | null>(null);

  useEffect(() => {
    const preferredMapId = preferredMapIdForWorkspaceView(workspaceView);
    setLiveMapId((current) => {
      if (current === preferredMapId) {
        return current;
      }
      writePersistedMapId(preferredMapId);
      return preferredMapId;
    });
  }, [workspaceView]);

  const activeMapId = useMemo((): MapId | null => {
    if (replayOverride) {
      return resolveMapIdFromBoardAssignments(replayOverride);
    }
    return liveMapId;
  }, [liveMapId, replayOverride]);

  const boardEffects = useMemo(() => {
    if (replayOverride) {
      return boardEffectAssignmentsToMap(replayOverride);
    }
    return boardLookupForMap(liveMapId);
  }, [liveMapId, replayOverride]);

  const setSelectedMapId = useCallback((mapId: MapId) => {
    setLiveMapId(mapId);
    writePersistedMapId(mapId);
  }, []);

  const syncFromBoardAssignments = useCallback(
    (rows: BoardEffectAssignmentJson[]) => {
      setReplayOverride(rows);
    },
    []
  );

  const clearReplayOverride = useCallback(() => {
    setReplayOverride(null);
  }, []);

  return {
    selectedMapId: activeMapId,
    setSelectedMapId,
    boardEffects,
    syncFromBoardAssignments,
    clearReplayOverride,
  };
}
