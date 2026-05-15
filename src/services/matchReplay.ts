import {
  createInitialGameState,
  reduceGameState,
} from "@/services/gameEngine";
import {
  commitEngineFrameToBuffer,
  serializeBoardEffectAssignments,
  serializeEngineFrame,
} from "@/services/replaySerialization";
import type { GameState, RaceSetup } from "@/types/game";
import type {
  BoardEffectAssignmentJson,
  MatchGameFrameJson,
  MatchRecord,
} from "@/types/replay";

export {
  commitEngineFrameToBuffer,
  engineFramesPhysicallyEqual,
  materializeGameStateFromFrame,
  serializeBoardEffectAssignments,
  serializeEngineFrame,
} from "@/services/replaySerialization";

export function boardEffectAssignmentsToMap(
  rows: BoardEffectAssignmentJson[]
): Map<number, string | null> {
  return new Map(rows.map((row) => [row.cellIndex, row.effectId]));
}

export function engineFramesDeepEqual(
  left: MatchGameFrameJson,
  right: MatchGameFrameJson
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function liveEngineMatchesFrame(
  state: GameState,
  frame: MatchGameFrameJson
): boolean {
  return engineFramesDeepEqual(serializeEngineFrame(state), frame);
}

export function compileSingleRaceMatchRecord(
  setup: RaceSetup,
  boardEffectByCellIndex: Map<number, string | null>
): MatchRecord {
  const board = serializeBoardEffectAssignments(boardEffectByCellIndex);
  let working = createInitialGameState();
  working = reduceGameState(
    working,
    { type: "START", setup },
    boardEffectByCellIndex
  );
  let frames: MatchGameFrameJson[] = [serializeEngineFrame(working)];
  const safetyCap = 250_000;
  let iterations = 0;
  while (working.phase === "running" && !working.winnerId) {
    if (iterations >= safetyCap) {
      break;
    }
    iterations += 1;
    const previousStamp = working.playbackStamp;
    working = reduceGameState(
      working,
      { type: "STEP_ACTION" },
      boardEffectByCellIndex
    );
    if (
      working.playbackStamp === previousStamp &&
      working.phase === "running" &&
      !working.winnerId
    ) {
      break;
    }
    frames = commitEngineFrameToBuffer(frames, serializeEngineFrame(working));
  }
  return {
    schemaVersion: 1,
    setup,
    board,
    frames,
  };
}

export function encodeMatchRecordJson(record: MatchRecord): string {
  return JSON.stringify(record);
}

export function parseMatchRecordJson(payload: string): MatchRecord {
  const parsed = JSON.parse(payload) as MatchRecord;
  if (
    !parsed ||
    parsed.schemaVersion !== 1 ||
    !Array.isArray(parsed.frames) ||
    !parsed.setup ||
    !Array.isArray(parsed.board)
  ) {
    throw new Error("Invalid match record");
  }
  return parsed;
}

export function findFrameIndexForTurnIndex(
  frames: readonly MatchGameFrameJson[],
  targetTurnIndex: number
): number {
  if (frames.length === 0) {
    return 0;
  }
  let bestIndex = 0;
  for (let index = 0; index < frames.length; index++) {
    if (frames[index]!.turnIndex >= targetTurnIndex) {
      return index;
    }
    bestIndex = index;
  }
  return bestIndex;
}
