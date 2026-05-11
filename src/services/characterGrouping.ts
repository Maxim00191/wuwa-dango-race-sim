import { ATTRIBUTE_ORDER } from "@/constants/attributes";
import type { Attribute, BasicCharacterDefinition } from "@/types/game";

export type CharacterAttributeGroup = {
  attribute: Attribute;
  characters: BasicCharacterDefinition[];
};

export function groupCharactersByAttribute(
  roster: BasicCharacterDefinition[]
): CharacterAttributeGroup[] {
  const groups = ATTRIBUTE_ORDER.map((attribute) => ({
    attribute,
    characters: [] as BasicCharacterDefinition[],
  }));
  const groupMap = new Map<Attribute, BasicCharacterDefinition[]>(
    groups.map((group) => [group.attribute, group.characters])
  );

  for (const character of roster) {
    groupMap.get(character.attribute)?.push(character);
  }

  return groups;
}
