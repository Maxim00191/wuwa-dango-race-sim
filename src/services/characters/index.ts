import { abbyCharacter } from "@/services/characters/abby";
import { aemeathCharacter } from "@/services/characters/aemeath";
import { augustaCharacter } from "@/services/characters/augusta";
import { calcharoCharacter } from "@/services/characters/calcharo";
import { carlottaCharacter } from "@/services/characters/carlotta";
import { cartethyiaCharacter } from "@/services/characters/cartethyia";
import { changliCharacter } from "@/services/characters/changli";
import { chisaCharacter } from "@/services/characters/chisa";
import { deniaCharacter } from "@/services/characters/denia";
import { hiyukiCharacter } from "@/services/characters/hiyuki";
import { iunoCharacter } from "@/services/characters/iuno";
import { jinhsiCharacter } from "@/services/characters/jinhsi";
import { lynaeCharacter } from "@/services/characters/lynae";
import { luukHerssenCharacter } from "@/services/characters/luukHerssen";
import { mornyeCharacter } from "@/services/characters/mornye";
import { phrolovaCharacter } from "@/services/characters/phrolova";
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
  jinhsiCharacter,
  changliCharacter,
  calcharoCharacter,
  augustaCharacter,
  iunoCharacter,
  phrolovaCharacter,
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
