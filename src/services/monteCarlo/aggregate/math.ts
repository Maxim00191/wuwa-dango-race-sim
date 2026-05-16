import type { PlacementCountVector } from "@/types/monteCarlo";

export function toPercent(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return (value / total) * 100;
}

export function sumCounts(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}

export function meanPlacementFromCounts(
  counts: PlacementCountVector
): number | null {
  const total = sumCounts(counts);
  if (total <= 0) {
    return null;
  }
  const weightedPlacementSum = counts.reduce(
    (sum, count, placementIndex) => sum + count * (placementIndex + 1),
    0
  );
  return weightedPlacementSum / total;
}

export function toRatio(numerator: number, denominator: number): number | null {
  if (denominator <= 0) {
    return null;
  }
  return numerator / denominator;
}
