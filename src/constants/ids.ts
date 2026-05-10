export const ABBY_ID = "abby";

export const ACTIVE_BASIC_DANGO_COUNT = 6;

export const SELECTABLE_BASIC_DANGO_IDS = [
  "bot1",
  "bot2",
  "bot3",
  "bot4",
  "bot5",
  "bot6",
  "mornye",
  "carlotta",
] as const;

export function createDefaultPendingBasicIds(): string[] {
  return SELECTABLE_BASIC_DANGO_IDS.slice(0, ACTIVE_BASIC_DANGO_COUNT) as string[];
}
