import type { DangoId } from "@/types/game";

export const KNOCKOUT_ADVANCE_COUNT = 3;

export type KnockoutPhaseId =
  | "groupA"
  | "groupB"
  | "winnersBracket"
  | "losersBracket"
  | "finals";

export const KNOCKOUT_PHASE_SEQUENCE: KnockoutPhaseId[] = [
  "groupA",
  "groupB",
  "winnersBracket",
  "losersBracket",
  "finals",
];

export function takeAdvancingRoster(
  placements: DangoId[],
  count: number = KNOCKOUT_ADVANCE_COUNT
): DangoId[] {
  return placements.slice(0, count);
}

export function takeFallingRoster(
  placements: DangoId[],
  count: number = KNOCKOUT_ADVANCE_COUNT
): DangoId[] {
  return placements.slice(count);
}

export function buildWinnersBracketRoster(
  groupAPlacements: DangoId[],
  groupBPlacements: DangoId[]
): DangoId[] {
  return [
    ...takeAdvancingRoster(groupAPlacements),
    ...takeAdvancingRoster(groupBPlacements),
  ];
}

export function buildLosersBracketRoster(
  groupAPlacements: DangoId[],
  groupBPlacements: DangoId[]
): DangoId[] {
  return [
    ...takeFallingRoster(groupAPlacements),
    ...takeFallingRoster(groupBPlacements),
  ];
}

export function buildFinalsRoster(
  winnersBracketPlacements: DangoId[],
  losersBracketPlacements: DangoId[]
): DangoId[] {
  return [
    ...takeAdvancingRoster(winnersBracketPlacements),
    ...takeAdvancingRoster(losersBracketPlacements),
  ];
}

export function nextKnockoutPhase(
  current: KnockoutPhaseId | null
): KnockoutPhaseId | null {
  if (current === null) {
    return KNOCKOUT_PHASE_SEQUENCE[0] ?? null;
  }
  const index = KNOCKOUT_PHASE_SEQUENCE.indexOf(current);
  if (index < 0 || index >= KNOCKOUT_PHASE_SEQUENCE.length - 1) {
    return null;
  }
  return KNOCKOUT_PHASE_SEQUENCE[index + 1] ?? null;
}

export function mergeKnockoutParticipantIds(
  groupAIds: DangoId[],
  groupBIds: DangoId[]
): DangoId[] {
  return [...groupAIds, ...groupBIds];
}
