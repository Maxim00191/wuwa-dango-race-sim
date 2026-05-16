import { useMemo } from "react";
import { useSharedSimulation } from "@/app/contexts/workspaceContexts";
import type { RaceWorkspaceSharedMap } from "@/types/workspace";

export function useRaceWorkspaceSharedMap(): RaceWorkspaceSharedMap {
  const shared = useSharedSimulation();

  return useMemo(
    () => ({
      selectedMapId: shared.mapSelection.selectedMapId,
      onSelectMapId: shared.mapSelection.setSelectedMapId,
      boardEffects: shared.mapSelection.boardEffects,
    }),
    [
      shared.mapSelection.selectedMapId,
      shared.mapSelection.setSelectedMapId,
      shared.mapSelection.boardEffects,
    ]
  );
}
