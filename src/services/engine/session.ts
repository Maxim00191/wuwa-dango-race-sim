import { FINISH_LINE_CELL_INDEX } from "@/constants/board";
import { ABBY_ID } from "@/constants/ids";
import { shuffleOrderStableCopy } from "@/services/engine/core/random";
import type { DangoId, GameState } from "@/types/game";
import type { RaceSetup } from "@/types/game";

export function createRunningSessionFromSetup(setup: RaceSetup): GameState {
  const entities: GameState["entities"] = {};
  const startingDisplacementById = setup.startingDisplacementById;
  for (const id of setup.selectedBasicIds) {
    entities[id] = {
      id,
      cellIndex: FINISH_LINE_CELL_INDEX,
      raceDisplacement: startingDisplacementById[id] ?? 0,
      skillState: id === "aemeath" ? { hasUsedMidpointLeap: false } : {},
    };
  }
  entities[ABBY_ID] = {
    id: ABBY_ID,
    cellIndex: FINISH_LINE_CELL_INDEX,
    raceDisplacement: 0,
    skillState: {},
  };
  const cells = new Map<number, DangoId[]>();
  for (const { cellIndex, stackBottomToTop } of setup.startingStacks) {
    cells.set(cellIndex, [...stackBottomToTop]);
    for (const entityId of stackBottomToTop) {
      const runtime = entities[entityId];
      if (!runtime) {
        continue;
      }
      entities[entityId] = {
        ...runtime,
        cellIndex,
      };
    }
  }
  return {
    phase: "running",
    mode: setup.mode,
    label: setup.label,
    shortLabel: setup.shortLabel,
    turnIndex: 0,
    cells,
    entityOrder: shuffleOrderStableCopy([...setup.selectedBasicIds, ABBY_ID]),
    entities,
    activeBasicIds: [...setup.selectedBasicIds],
    winnerId: null,
    abbyPendingTeleportToStart: false,
    lastRollById: {},
    log: [],
    lastTurnPlayback: null,
    pendingTurn: null,
    actLastNextRoundOrderCounter: 0,
    playbackStamp: 0,
  };
}

