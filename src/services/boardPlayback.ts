import { clockwiseDistanceBetweenInclusive } from "@/services/circular";
import {
  cloneCellMap,
  findCellIndexForEntity,
  relocateActorLedPortionCellsOnly,
  teleportEntitySliceCellsOnly,
} from "@/services/stateCells";
import { ABBY_ID } from "@/constants/ids";
import type {
  CellIndex,
  DangoId,
  GameState,
  PlaybackSegment,
  TravelDirection,
} from "@/types/game";

export type AtomicPlaybackStep =
  | {
      kind: "hop";
      actorId: DangoId;
      travelingIds: DangoId[];
      direction: TravelDirection;
      fromCell: CellIndex;
      toCell: CellIndex;
    }
  | {
      kind: "teleport";
      entityIds: DangoId[];
      fromCell: CellIndex;
      toCell: CellIndex;
    }
  | {
      kind: "slide";
      travelingIds: DangoId[];
      direction: TravelDirection;
      fromCell: CellIndex;
      toCell: CellIndex;
    };

export function expandPlaybackToAtomicSteps(
  segments: PlaybackSegment[],
  initialCells: Map<number, DangoId[]>
): AtomicPlaybackStep[] {
  let cells = cloneCellMap(initialCells);
  const atomic: AtomicPlaybackStep[] = [];
  for (const segment of segments) {
    if (
      segment.kind === "idle" ||
      segment.kind === "roll" ||
      segment.kind === "skill" ||
      segment.kind === "cellEffect" ||
      segment.kind === "victory"
    ) {
      continue;
    }
    if (segment.kind === "hops") {
      let fromCell = findCellIndexForEntity(cells, segment.actorId);
      if (fromCell === null) {
        continue;
      }
      for (const toCell of segment.cellsPath) {
        atomic.push({
          kind: "hop",
          actorId: segment.actorId,
          travelingIds: segment.travelingIds,
          direction: segment.direction,
          fromCell,
          toCell,
        });
        const stack = cells.get(fromCell)!;
        const actorIndexInStack = stack.indexOf(segment.actorId);
        cells = relocateActorLedPortionCellsOnly(
          cells,
          fromCell,
          toCell,
          stack,
          actorIndexInStack
        );
        fromCell = toCell;
      }
      continue;
    }
    if (segment.kind === "teleport") {
      atomic.push({
        kind: "teleport",
        entityIds: segment.entityIds,
        fromCell: segment.fromCell,
        toCell: segment.toCell,
      });
      cells = teleportEntitySliceCellsOnly(
        cells,
        segment.fromCell,
        segment.toCell,
        segment.entityIds
      );
      continue;
    }
    if (segment.kind === "slide") {
      atomic.push({
        kind: "slide",
        travelingIds: segment.travelingIds,
        direction: segment.direction,
        fromCell: segment.fromCell,
        toCell: segment.toCell,
      });
      cells = teleportEntitySliceCellsOnly(
        cells,
        segment.fromCell,
        segment.toCell,
        segment.travelingIds
      );
    }
  }
  return atomic;
}

export function expandPlaybackToSegmentAtomicChunks(
  segments: PlaybackSegment[],
  initialCells: Map<number, DangoId[]>
): AtomicPlaybackStep[][] {
  let cells = cloneCellMap(initialCells);
  const chunks: AtomicPlaybackStep[][] = [];
  for (const segment of segments) {
    const chunk: AtomicPlaybackStep[] = [];
    if (
      segment.kind === "idle" ||
      segment.kind === "roll" ||
      segment.kind === "skill" ||
      segment.kind === "cellEffect" ||
      segment.kind === "victory"
    ) {
      chunks.push(chunk);
      continue;
    }
    if (segment.kind === "hops") {
      let fromCell = findCellIndexForEntity(cells, segment.actorId);
      if (fromCell === null) {
        chunks.push(chunk);
        continue;
      }
      for (const toCell of segment.cellsPath) {
        chunk.push({
          kind: "hop",
          actorId: segment.actorId,
          travelingIds: segment.travelingIds,
          direction: segment.direction,
          fromCell,
          toCell,
        });
        const stack = cells.get(fromCell)!;
        const actorIndexInStack = stack.indexOf(segment.actorId);
        cells = relocateActorLedPortionCellsOnly(
          cells,
          fromCell,
          toCell,
          stack,
          actorIndexInStack
        );
        fromCell = toCell;
      }
      chunks.push(chunk);
      continue;
    }
    if (segment.kind === "teleport") {
      chunk.push({
        kind: "teleport",
        entityIds: segment.entityIds,
        fromCell: segment.fromCell,
        toCell: segment.toCell,
      });
      cells = teleportEntitySliceCellsOnly(
        cells,
        segment.fromCell,
        segment.toCell,
        segment.entityIds
      );
      chunks.push(chunk);
      continue;
    }
    if (segment.kind === "slide") {
      chunk.push({
        kind: "slide",
        travelingIds: segment.travelingIds,
        direction: segment.direction,
        fromCell: segment.fromCell,
        toCell: segment.toCell,
      });
      cells = teleportEntitySliceCellsOnly(
        cells,
        segment.fromCell,
        segment.toCell,
        segment.travelingIds
      );
      chunks.push(chunk);
    }
  }
  return chunks;
}

export function applyAtomicCellsStep(
  cells: Map<number, DangoId[]>,
  step: AtomicPlaybackStep
): Map<number, DangoId[]> {
  if (step.kind === "hop") {
    const stack = cells.get(step.fromCell);
    if (!stack) {
      return cells;
    }
    const actorIndexInStack = stack.indexOf(step.actorId);
    if (actorIndexInStack === -1) {
      return cells;
    }
    return relocateActorLedPortionCellsOnly(
      cells,
      step.fromCell,
      step.toCell,
      stack,
      actorIndexInStack
    );
  }
  if (step.kind === "teleport") {
    return teleportEntitySliceCellsOnly(
      cells,
      step.fromCell,
      step.toCell,
      step.entityIds
    );
  }
  return teleportEntitySliceCellsOnly(
    cells,
    step.fromCell,
    step.toCell,
    step.travelingIds
  );
}

export function applyAtomicStepToEntities(
  entities: GameState["entities"],
  step: AtomicPlaybackStep
): GameState["entities"] {
  if (step.kind === "teleport") {
    let nextEntities = { ...entities };
    for (const id of step.entityIds) {
      const runtime = nextEntities[id];
      if (!runtime) {
        continue;
      }
      nextEntities = {
        ...nextEntities,
        [id]: {
          ...runtime,
          cellIndex: step.toCell,
          raceDisplacement: id === ABBY_ID ? 0 : runtime.raceDisplacement,
        },
      };
    }
    return nextEntities;
  }
  const delta =
    step.direction === "clockwise"
      ? clockwiseDistanceBetweenInclusive(step.fromCell, step.toCell)
      : -clockwiseDistanceBetweenInclusive(step.toCell, step.fromCell);
  let nextEntities = { ...entities };
  for (const id of step.travelingIds) {
    const runtime = nextEntities[id];
    if (!runtime) {
      continue;
    }
    nextEntities = {
      ...nextEntities,
      [id]: {
        ...runtime,
        cellIndex: step.toCell,
        raceDisplacement: runtime.raceDisplacement + delta,
      },
    };
  }
  return nextEntities;
}
