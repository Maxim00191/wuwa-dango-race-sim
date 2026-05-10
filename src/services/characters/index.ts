import { abbyCharacter } from "@/services/characters/abby";
import { plainBasicDangoCharacters } from "@/services/characters/basic";
import { carlottaCharacter } from "@/services/characters/carlotta";
import { mornyeCharacter } from "@/services/characters/mornye";
import type { CharacterDefinition, DangoId } from "@/types/game";

export const CHARACTER_LIST: CharacterDefinition[] = [
  ...plainBasicDangoCharacters,
  mornyeCharacter,
  carlottaCharacter,
  abbyCharacter,
];

export const CHARACTER_BY_ID: Record<DangoId, CharacterDefinition> =
  CHARACTER_LIST.reduce<Record<DangoId, CharacterDefinition>>(
    (registry, character) => {
      registry[character.id] = character;
      return registry;
    },
    {}
  );
