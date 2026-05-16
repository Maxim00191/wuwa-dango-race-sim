import { LAP_DISTANCE_IN_CLOCKWISE_STEPS } from "@/constants/board";
import type { GameState } from "@/types/game";

export function createInitialGameState(): GameState {
  return {
    phase: "idle",
    mode: null,
    label: null,
    shortLabel: null,
    turnIndex: 0,
    cells: new Map(),
    entityOrder: [],
    preserveEntityOrderOnFirstTurn: false,
    activeBasicsShareStartingCell: false,
    raceWinDistanceInClockwiseSteps: LAP_DISTANCE_IN_CLOCKWISE_STEPS,
    entities: {},
    activeBasicIds: [],
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
