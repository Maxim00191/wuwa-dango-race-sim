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
