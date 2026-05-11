import { FINISH_LINE_CELL_INDEX } from "@/constants/board";
import { ABBY_ID } from "@/constants/ids";
import { addCounterClockwise } from "@/services/circular";
import { orderedRacerIdsForLeaderboard } from "@/services/racerRanking";
import type {
  DangoId,
  GameState,
  RaceMode,
  RaceSetup,
  RaceStartingStack,
} from "@/types/game";

function shuffleOrderStableCopy(ids: DangoId[]): DangoId[] {
  const copy = [...ids];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swapIndex]!;
    copy[swapIndex] = current!;
  }
  return copy;
}

function createRaceSetup(
  mode: RaceMode,
  label: string,
  shortLabel: string,
  selectedBasicIds: DangoId[],
  startingStacks: RaceStartingStack[]
): RaceSetup {
  return {
    mode,
    label,
    shortLabel,
    selectedBasicIds: [...selectedBasicIds],
    startingStacks,
  };
}

function buildNormalStartingStacks(selectedBasicIds: DangoId[]): RaceStartingStack[] {
  return [
    {
      cellIndex: FINISH_LINE_CELL_INDEX,
      stackBottomToTop: [ABBY_ID, ...shuffleOrderStableCopy(selectedBasicIds)],
    },
  ];
}

export function createNormalRaceSetup(selectedBasicIds: DangoId[]): RaceSetup {
  return createRaceSetup(
    "normal",
    "Normal Race",
    "Normal",
    selectedBasicIds,
    buildNormalStartingStacks(selectedBasicIds)
  );
}

export function createTournamentPreliminaryRaceSetup(
  selectedBasicIds: DangoId[]
): RaceSetup {
  return createRaceSetup(
    "tournamentPreliminary",
    "Tournament Preliminary",
    "Preliminary",
    selectedBasicIds,
    buildNormalStartingStacks(selectedBasicIds)
  );
}

export function sanitizeFinalPlacements(
  placements: DangoId[],
  selectedBasicIds: DangoId[]
): DangoId[] {
  const selectedSet = new Set(selectedBasicIds);
  const seen = new Set<DangoId>();
  const ordered = placements.filter((id) => {
    if (!selectedSet.has(id) || seen.has(id)) {
      return false;
    }
    seen.add(id);
    return true;
  });
  for (const basicId of selectedBasicIds) {
    if (!seen.has(basicId)) {
      ordered.push(basicId);
      seen.add(basicId);
    }
  }
  return ordered;
}

export function isValidFinalPlacements(
  placements: DangoId[],
  selectedBasicIds: DangoId[]
): boolean {
  if (placements.length !== selectedBasicIds.length) {
    return false;
  }
  const normalized = sanitizeFinalPlacements(placements, selectedBasicIds);
  return normalized.length === placements.length &&
    normalized.every((id, index) => id === placements[index]);
}

export function createDefaultFinalPlacements(
  selectedBasicIds: DangoId[]
): DangoId[] {
  return sanitizeFinalPlacements(selectedBasicIds, selectedBasicIds);
}

export function getFinalStartCellIndexForPlacement(
  placementIndex: number
): number {
  if (placementIndex <= 0) {
    return FINISH_LINE_CELL_INDEX;
  }
  return addCounterClockwise(
    FINISH_LINE_CELL_INDEX,
    Math.ceil(placementIndex / 2)
  );
}

function buildFinalStartingStacks(placements: DangoId[]): RaceStartingStack[] {
  const normalizedPlacements = [...placements];
  const stacks: RaceStartingStack[] = [];
  const champion = normalizedPlacements[0];
  if (champion) {
    stacks.push({
      cellIndex: FINISH_LINE_CELL_INDEX,
      stackBottomToTop: [ABBY_ID, champion],
    });
  } else {
    stacks.push({
      cellIndex: FINISH_LINE_CELL_INDEX,
      stackBottomToTop: [ABBY_ID],
    });
  }
  for (let placementIndex = 1; placementIndex < normalizedPlacements.length; placementIndex += 2) {
    const topId = normalizedPlacements[placementIndex];
    const bottomId = normalizedPlacements[placementIndex + 1];
    const stackBottomToTop = [bottomId, topId].filter(
      (id): id is DangoId => Boolean(id)
    );
    if (stackBottomToTop.length === 0) {
      continue;
    }
    stacks.push({
      cellIndex: getFinalStartCellIndexForPlacement(placementIndex),
      stackBottomToTop,
    });
  }
  return stacks;
}

function createFinalRaceSetup(
  mode: RaceMode,
  label: string,
  shortLabel: string,
  placements: DangoId[]
): RaceSetup {
  const selectedBasicIds = sanitizeFinalPlacements(placements, placements);
  return createRaceSetup(
    mode,
    label,
    shortLabel,
    selectedBasicIds,
    buildFinalStartingStacks(selectedBasicIds)
  );
}

export function createTournamentFinalRaceSetup(
  placements: DangoId[]
): RaceSetup {
  return createFinalRaceSetup(
    "tournamentFinal",
    "Tournament Final",
    "Final",
    placements
  );
}

export function createCustomFinalRaceSetup(placements: DangoId[]): RaceSetup {
  return createFinalRaceSetup(
    "customFinal",
    "Custom Final",
    "Custom Final",
    placements
  );
}

export function deriveBasicPlacementsFromRace(state: GameState): DangoId[] {
  const activeBasicIdSet = new Set(state.activeBasicIds);
  return orderedRacerIdsForLeaderboard(state).filter((id) =>
    activeBasicIdSet.has(id)
  );
}
