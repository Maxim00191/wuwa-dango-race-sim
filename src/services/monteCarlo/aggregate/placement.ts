import type { DangoId } from "@/types/game";
import type {
  PlacementCountMatrix,
  PlacementCountVector,
} from "@/types/monteCarlo";

export function createPlacementVector(
  participantCount: number
): PlacementCountVector {
  return Array.from({ length: participantCount }, () => 0);
}

export function createPlacementMatrix(
  participantCount: number
): PlacementCountMatrix {
  return Array.from({ length: participantCount }, () =>
    createPlacementVector(participantCount)
  );
}

export function createPlacementRecord(
  selectedBasicIds: DangoId[],
  participantCount: number
): Record<string, PlacementCountVector> {
  return Object.fromEntries(
    selectedBasicIds.map((basicId) => [
      basicId,
      createPlacementVector(participantCount),
    ])
  );
}

export function createTransitionMatrixRecord(
  selectedBasicIds: DangoId[],
  participantCount: number
): Record<string, PlacementCountMatrix> {
  return Object.fromEntries(
    selectedBasicIds.map((basicId) => [
      basicId,
      createPlacementMatrix(participantCount),
    ])
  );
}

export function absorbPlacementsIntoCounts(
  placements: DangoId[],
  placementCountsByBasicId: Record<string, PlacementCountVector>
): void {
  for (const [placementIndex, basicId] of placements.entries()) {
    const placementCounts = placementCountsByBasicId[basicId];
    if (!placementCounts || placementIndex >= placementCounts.length) {
      continue;
    }
    placementCounts[placementIndex] += 1;
  }
}

export function createPlacementIndexByBasicId(
  placements: DangoId[]
): Record<string, number> {
  return Object.fromEntries(
    placements.map((basicId, placementIndex) => [basicId, placementIndex])
  );
}
