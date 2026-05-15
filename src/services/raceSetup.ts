import { FINISH_LINE_CELL_INDEX } from "@/constants/board";
import { ABBY_ID } from "@/constants/ids";
import { text, type LocalizedText } from "@/i18n";
import {
  addClockwise,
  addCounterClockwise,
  clockwiseDistanceAhead,
} from "@/services/circular";
import {
  fullLapWinDistanceInClockwiseSteps,
  winDistanceFromStartCellToFinish,
} from "@/services/raceDistance";
import type { KnockoutPhaseId } from "@/services/knockout/bracket";
import { entityOrderFromStackTopToBottom } from "@/services/stackActorOrder";
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

const SPRINT_START_CELL_INDEX = addClockwise(FINISH_LINE_CELL_INDEX, 1);

function createRaceSetup(
  mode: RaceMode,
  label: LocalizedText,
  shortLabel: LocalizedText,
  selectedBasicIds: DangoId[],
  startingStacks: RaceStartingStack[],
  options: {
    raceWinDistanceInClockwiseSteps: number;
    startingDisplacementById?: Partial<Record<DangoId, number>>;
    seededFirstTurnActorOrder?: DangoId[];
  }
): RaceSetup {
  return {
    mode,
    label,
    shortLabel,
    selectedBasicIds: [...selectedBasicIds],
    startingStacks,
    startingDisplacementById: {
      ...options.startingDisplacementById,
    },
    raceWinDistanceInClockwiseSteps: options.raceWinDistanceInClockwiseSteps,
    seededFirstTurnActorOrder: options.seededFirstTurnActorOrder
      ? [...options.seededFirstTurnActorOrder]
      : undefined,
  };
}

function buildSprintStartingStacks(selectedBasicIds: DangoId[]): {
  stacks: RaceStartingStack[];
  seededFirstTurnActorOrder: DangoId[];
  raceWinDistanceInClockwiseSteps: number;
} {
  const racersBottomToTop = shuffleOrderStableCopy(selectedBasicIds);
  const stacks: RaceStartingStack[] = [];
  if (racersBottomToTop.length > 0) {
    stacks.push({
      cellIndex: SPRINT_START_CELL_INDEX,
      stackBottomToTop: racersBottomToTop,
    });
  }
  stacks.push({
    cellIndex: FINISH_LINE_CELL_INDEX,
    stackBottomToTop: [ABBY_ID],
  });
  const turnOrderStackBottomToTop = [ABBY_ID, ...racersBottomToTop];
  return {
    stacks,
    seededFirstTurnActorOrder:
      entityOrderFromStackTopToBottom(turnOrderStackBottomToTop),
    raceWinDistanceInClockwiseSteps: winDistanceFromStartCellToFinish(
      SPRINT_START_CELL_INDEX
    ),
  };
}

function raceModeForKnockoutPhase(phase: KnockoutPhaseId): RaceMode {
  if (phase === "groupA" || phase === "groupB") {
    return "knockoutGroup";
  }
  if (phase === "finals") {
    return "knockoutFinal";
  }
  return "knockoutBracket";
}

export function createKnockoutSprintRaceSetup(
  selectedBasicIds: DangoId[],
  phase: KnockoutPhaseId
): RaceSetup {
  const sprintStart = buildSprintStartingStacks(selectedBasicIds);
  const label = text(`simulation.labels.knockout.${phase}`);
  return createRaceSetup(
    raceModeForKnockoutPhase(phase),
    label,
    label,
    selectedBasicIds,
    sprintStart.stacks,
    {
      raceWinDistanceInClockwiseSteps:
        sprintStart.raceWinDistanceInClockwiseSteps,
      seededFirstTurnActorOrder: sprintStart.seededFirstTurnActorOrder,
    }
  );
}

export function createNormalRaceSetup(selectedBasicIds: DangoId[]): RaceSetup {
  const sprintStart = buildSprintStartingStacks(selectedBasicIds);
  return createRaceSetup(
    "normal",
    text("simulation.labels.normalRace"),
    text("simulation.labels.normalRace"),
    selectedBasicIds,
    sprintStart.stacks,
    {
      raceWinDistanceInClockwiseSteps:
        sprintStart.raceWinDistanceInClockwiseSteps,
      seededFirstTurnActorOrder: sprintStart.seededFirstTurnActorOrder,
    }
  );
}

export function createTournamentPreliminaryRaceSetup(
  selectedBasicIds: DangoId[]
): RaceSetup {
  const sprintStart = buildSprintStartingStacks(selectedBasicIds);
  return createRaceSetup(
    "tournamentPreliminary",
    text("simulation.labels.tournamentPreliminary"),
    text("simulation.labels.tournamentPreliminary"),
    selectedBasicIds,
    sprintStart.stacks,
    {
      raceWinDistanceInClockwiseSteps:
        sprintStart.raceWinDistanceInClockwiseSteps,
      seededFirstTurnActorOrder: sprintStart.seededFirstTurnActorOrder,
    }
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

function getFinalStartingDisplacementForCell(cellIndex: number): number {
  if (cellIndex === FINISH_LINE_CELL_INDEX) {
    return 0;
  }
  return -clockwiseDistanceAhead(cellIndex, FINISH_LINE_CELL_INDEX);
}

function buildFinalStartingDisplacementById(
  placements: DangoId[]
): Partial<Record<DangoId, number>> {
  const displacementById: Partial<Record<DangoId, number>> = {};
  for (const [placementIndex, basicId] of placements.entries()) {
    const cellIndex = getFinalStartCellIndexForPlacement(placementIndex);
    const displacement = getFinalStartingDisplacementForCell(cellIndex);
    if (displacement === 0) {
      continue;
    }
    displacementById[basicId] = displacement;
  }
  return displacementById;
}

function createFinalRaceSetup(
  mode: RaceMode,
  label: LocalizedText,
  shortLabel: LocalizedText,
  placements: DangoId[]
): RaceSetup {
  const selectedBasicIds = sanitizeFinalPlacements(placements, placements);
  return createRaceSetup(
    mode,
    label,
    shortLabel,
    selectedBasicIds,
    buildFinalStartingStacks(selectedBasicIds),
    {
      raceWinDistanceInClockwiseSteps: fullLapWinDistanceInClockwiseSteps(),
      startingDisplacementById: buildFinalStartingDisplacementById(
        selectedBasicIds
      ),
    }
  );
}

export function createTournamentFinalRaceSetup(
  placements: DangoId[]
): RaceSetup {
  return createFinalRaceSetup(
    "tournamentFinal",
    text("simulation.labels.tournamentFinal"),
    text("simulation.labels.tournamentFinal"),
    placements
  );
}

export function createCustomFinalRaceSetup(placements: DangoId[]): RaceSetup {
  return createFinalRaceSetup(
    "customFinal",
    text("simulation.labels.customFinal"),
    text("simulation.labels.customFinal"),
    placements
  );
}

export function deriveBasicPlacementsFromRace(state: GameState): DangoId[] {
  const activeBasicIdSet = new Set(state.activeBasicIds);
  return orderedRacerIdsForLeaderboard(state).filter((id) =>
    activeBasicIdSet.has(id)
  );
}
