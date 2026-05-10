import { abbyCharacter } from "@/services/characters/abby";
import { aemeathCharacter } from "@/services/characters/aemeath";
import { plainBasicDangoCharacters } from "@/services/characters/basic";
import { carlottaCharacter } from "@/services/characters/carlotta";
import { chisaCharacter } from "@/services/characters/chisa";
import { lynaeCharacter } from "@/services/characters/lynae";
import { mornyeCharacter } from "@/services/characters/mornye";
import { shorekeeperCharacter } from "@/services/characters/shorekeeper";
import type { CharacterDefinition, DangoId } from "@/types/game";

export const CHARACTER_LIST: CharacterDefinition[] = [
  ...plainBasicDangoCharacters,
  mornyeCharacter,
  carlottaCharacter,
  shorekeeperCharacter,
  lynaeCharacter,
  chisaCharacter,
  aemeathCharacter,
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
