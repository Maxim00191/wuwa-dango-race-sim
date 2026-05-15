import type { LineupGroupDefinition } from "@/constants/lineupGroups";
import type { DangoId } from "@/types/game";

export type KnockoutGroupKey = "groupA" | "groupB";

const KNOCKOUT_GROUP_A_CHARACTER_IDS = [
  "augusta",
  "jinhsi",
  "hiyuki",
  "iuno",
  "calcharo",
  "cartethyia",
] as const satisfies readonly DangoId[];

const KNOCKOUT_GROUP_B_CHARACTER_IDS = [
  "denia",
  "sigrika",
  "shorekeeper",
  "chisa",
  "carlotta",
  "aemeath",
] as const satisfies readonly DangoId[];

export const KNOCKOUT_LINEUP_GROUPS = [
  {
    id: "A",
    labelKey: "knockout.setup.groupA.label",
    descriptionKey: "knockout.setup.groupA.description",
    accentHex: "#f59e0b",
    characterIds: KNOCKOUT_GROUP_A_CHARACTER_IDS,
  },
  {
    id: "B",
    labelKey: "knockout.setup.groupB.label",
    descriptionKey: "knockout.setup.groupB.description",
    accentHex: "#0ea5e9",
    characterIds: KNOCKOUT_GROUP_B_CHARACTER_IDS,
  },
] as const satisfies readonly LineupGroupDefinition[];

export const DEFAULT_KNOCKOUT_GROUP_A: DangoId[] = [
  ...KNOCKOUT_GROUP_A_CHARACTER_IDS,
];
export const DEFAULT_KNOCKOUT_GROUP_B: DangoId[] = [
  ...KNOCKOUT_GROUP_B_CHARACTER_IDS,
];

const KNOCKOUT_GROUP_BY_KEY: Record<
  KnockoutGroupKey,
  (typeof KNOCKOUT_LINEUP_GROUPS)[number]
> = {
  groupA: KNOCKOUT_LINEUP_GROUPS[0],
  groupB: KNOCKOUT_LINEUP_GROUPS[1],
};

export function getKnockoutLineupGroupDefinition(
  group: KnockoutGroupKey
): LineupGroupDefinition {
  return KNOCKOUT_GROUP_BY_KEY[group];
}

export function resolveKnockoutGroupPhaseKey(
  basicId: DangoId
): KnockoutGroupKey | null {
  for (const definition of KNOCKOUT_LINEUP_GROUPS) {
    if ((definition.characterIds as readonly string[]).includes(basicId)) {
      return definition.id === "A" ? "groupA" : "groupB";
    }
  }
  return null;
}
