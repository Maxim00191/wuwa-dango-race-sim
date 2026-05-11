import { useCallback, useEffect, useState } from "react";
import { ACTIVE_BASIC_DANGO_COUNT } from "@/constants/ids";
import {
  resolvePersistedOrSmartDefaultLineup,
  writePersistedLineupSelection,
} from "@/services/savedLineup";
import type { DangoId } from "@/types/game";

export function useLineupSelection() {
  const [selectedBasicIds, setSelectedBasicIds] = useState<DangoId[]>(() =>
    resolvePersistedOrSmartDefaultLineup()
  );

  const toggleSelectedBasicId = useCallback((id: DangoId) => {
    setSelectedBasicIds((previous) => {
      if (previous.includes(id)) {
        return previous.filter((existing) => existing !== id);
      }
      if (previous.length >= ACTIVE_BASIC_DANGO_COUNT) {
        return previous;
      }
      return [...previous, id];
    });
  }, []);

  const clearSelectedBasicIds = useCallback(() => {
    setSelectedBasicIds([]);
  }, []);

  useEffect(() => {
    writePersistedLineupSelection(selectedBasicIds);
  }, [selectedBasicIds]);

  return {
    selectedBasicIds,
    setSelectedBasicIds,
    toggleSelectedBasicId,
    clearSelectedBasicIds,
  };
}
