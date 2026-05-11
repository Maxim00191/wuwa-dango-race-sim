import { abbyCharacter } from "@/services/characters/abby";
import { aemeathCharacter } from "@/services/characters/aemeath";
import { carlottaCharacter } from "@/services/characters/carlotta";
import { cartethyiaCharacter } from "@/services/characters/cartethyia";
import { chisaCharacter } from "@/services/characters/chisa";
import { deniaCharacter } from "@/services/characters/denia";
import { hiyukiCharacter } from "@/services/characters/hiyuki";
import { lynaeCharacter } from "@/services/characters/lynae";
import { luukHerssenCharacter } from "@/services/characters/luukHerssen";
import { mornyeCharacter } from "@/services/characters/mornye";
import { phoebeCharacter } from "@/services/characters/phoebe";
import { shorekeeperCharacter } from "@/services/characters/shorekeeper";
import { sigrikaCharacter } from "@/services/characters/sigrika";
import type {
  BasicCharacterDefinition,
  CharacterDefinition,
  DangoId,
} from "@/types/game";

export const CHARACTER_LIST: CharacterDefinition[] = [
  mornyeCharacter,
  aemeathCharacter,
  deniaCharacter,
  carlottaCharacter,
  hiyukiCharacter,
  sigrikaCharacter,
  cartethyiaCharacter,
  shorekeeperCharacter,
  phoebeCharacter,
  luukHerssenCharacter,
  lynaeCharacter,
  chisaCharacter,
  abbyCharacter,
];

export const BASIC_CHARACTER_LIST: BasicCharacterDefinition[] =
  CHARACTER_LIST.filter(
    (character): character is BasicCharacterDefinition =>
      character.role === "basic"
  );

export const CHARACTER_BY_ID: Record<DangoId, CharacterDefinition> =
  CHARACTER_LIST.reduce<Record<DangoId, CharacterDefinition>>(
    (registry, character) => {
      registry[character.id] = character;
      return registry;
    },
    {}
  );
