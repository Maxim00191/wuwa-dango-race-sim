import { ACTIVE_BASIC_DANGO_COUNT } from "@/constants/ids";
import {
  LINEUP_GROUPS,
  type LineupGroupDefinition,
} from "@/constants/lineupGroups";
import type { BasicCharacterDefinition, DangoId } from "@/types/game";

export type ResolvedLineupGroup = LineupGroupDefinition & {
  characters: BasicCharacterDefinition[];
  isSelectable: boolean;
};

export function resolveLineupGroups(
  roster: BasicCharacterDefinition[]
): ResolvedLineupGroup[] {
  const rosterById = new Map(
    roster.map((character) => [character.id, character] as const)
  );

  return LINEUP_GROUPS.map((group) => {
    const characters = group.characterIds.flatMap((id) => {
      const character = rosterById.get(id);
      return character ? [character] : [];
    });

    return {
      ...group,
      characters,
      isSelectable:
        group.characterIds.length === ACTIVE_BASIC_DANGO_COUNT &&
        characters.length === ACTIVE_BASIC_DANGO_COUNT,
    };
  });
}

export function haveSameLineupMembers(
  left: readonly DangoId[],
  right: readonly DangoId[]
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.every((id) => rightSet.has(id));
}
