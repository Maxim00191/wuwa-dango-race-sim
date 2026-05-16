import { useMemo } from "react";
import type { WorkspaceView } from "@/components/AppNavigation";
import { ABBY_ID } from "@/constants/ids";
import { useLineupSelection } from "@/hooks/useLineupSelection";
import { useMapSelection } from "@/hooks/useMapSelection";
import type { UseGameOptions } from "@/hooks/useGame";
import { BASIC_CHARACTER_LIST } from "@/services/characters";

export function useSharedSimulationContext(workspaceView: WorkspaceView) {
  const mapSelection = useMapSelection(workspaceView);
  const gameBoardOptions = useMemo(
    (): UseGameOptions => ({
      boardEffects: mapSelection.boardEffects,
    }),
    [mapSelection.boardEffects]
  );
  const lineup = useLineupSelection();
  const rosterBasics = useMemo(() => BASIC_CHARACTER_LIST, []);
  const idleParticipantIds = useMemo(
    () => [...lineup.selectedBasicIds, ABBY_ID],
    [lineup.selectedBasicIds]
  );

  return {
    mapSelection,
    gameBoardOptions,
    lineup,
    rosterBasics,
    idleParticipantIds,
  };
}
