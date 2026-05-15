import { useCallback, useEffect, useState } from "react";
import type { KnockoutGroupKey } from "@/constants/knockoutGroups";
import { ACTIVE_BASIC_DANGO_COUNT } from "@/constants/ids";
import { isValidBasicSelection } from "@/services/gameEngine";
import {
  isValidKnockoutGroupLineups,
  resolvePersistedOrDefaultKnockoutSetup,
  writePersistedKnockoutSetup,
  type KnockoutGroupLineups,
} from "@/services/savedKnockoutSetup";
import type { DangoId } from "@/types/game";

export function useKnockoutLineup() {
  const [lineups, setLineups] = useState<KnockoutGroupLineups>(() =>
    resolvePersistedOrDefaultKnockoutSetup()
  );

  useEffect(() => {
    if (!isValidKnockoutGroupLineups(lineups)) {
      return;
    }
    writePersistedKnockoutSetup(lineups);
  }, [lineups]);

  const toggleGroupBasicId = useCallback(
    (group: KnockoutGroupKey, id: DangoId) => {
      setLineups((previous) => {
        const groupKey = group === "groupA" ? "groupAIds" : "groupBIds";
        const otherKey = group === "groupA" ? "groupBIds" : "groupAIds";
        const current = previous[groupKey];
        const other = previous[otherKey];
        if (other.includes(id)) {
          return previous;
        }
        if (current.includes(id)) {
          return {
            ...previous,
            [groupKey]: current.filter((existing) => existing !== id),
          };
        }
        if (current.length >= ACTIVE_BASIC_DANGO_COUNT) {
          return previous;
        }
        return {
          ...previous,
          [groupKey]: [...current, id],
        };
      });
    },
    []
  );

  const setGroupLineup = useCallback((group: KnockoutGroupKey, ids: DangoId[]) => {
    if (!isValidBasicSelection(ids)) {
      return;
    }
    setLineups((previous) => {
      const otherKey = group === "groupA" ? "groupBIds" : "groupAIds";
      const groupKey = group === "groupA" ? "groupAIds" : "groupBIds";
      const filtered = ids.filter((id) => !previous[otherKey].includes(id));
      if (filtered.length !== ACTIVE_BASIC_DANGO_COUNT) {
        return previous;
      }
      return {
        ...previous,
        [groupKey]: filtered,
      };
    });
  }, []);

  const clearGroupSelections = useCallback((group: KnockoutGroupKey) => {
    setLineups((previous) => ({
      ...previous,
      [group === "groupA" ? "groupAIds" : "groupBIds"]: [],
    }));
  }, []);

  const allParticipantIds = [...lineups.groupAIds, ...lineups.groupBIds];

  return {
    groupAIds: lineups.groupAIds,
    groupBIds: lineups.groupBIds,
    allParticipantIds,
    isReady: isValidKnockoutGroupLineups(lineups),
    toggleGroupBasicId,
    setGroupLineup,
    clearGroupSelections,
  };
}
