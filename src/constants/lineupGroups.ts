import type { DangoId, LineupGroupId } from "@/types/game";

export type LineupGroupDefinition = {
  id: LineupGroupId;
  labelKey: string;
  descriptionKey: string;
  accentHex: string;
  characterIds: readonly DangoId[];
};

export const LINEUP_GROUPS = [
  {
    id: "A",
    labelKey: "lineup.groups.a.label",
    descriptionKey: "lineup.groups.a.description",
    accentHex: "#14b8a6",
    characterIds: [
      "luukHerssen",
      "sigrika",
      "denia",
      "hiyuki",
      "phoebe",
      "cartethyia",
    ],
  },
  {
    id: "B",
    labelKey: "lineup.groups.b.label",
    descriptionKey: "lineup.groups.b.description",
    accentHex: "#8b5cf6",
    characterIds: [
      "mornye",
      "carlotta",
      "shorekeeper",
      "lynae",
      "chisa",
      "aemeath",
    ],
  },
  {
    id: "C",
    labelKey: "lineup.groups.c.label",
    descriptionKey: "lineup.groups.c.description",
    accentHex: "#94a3b8",
    characterIds: [
      "jinhsi",
      "changli",
      "calcharo",
      "augusta",
      "iuno",
      "phrolova",
    ],
  },
] as const satisfies readonly LineupGroupDefinition[];
