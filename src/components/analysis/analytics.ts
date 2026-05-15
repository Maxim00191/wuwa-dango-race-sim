import {
  accentFillHexForDango,
  contrastingInkHexForFill,
} from "@/services/dangoColors";
import type { DangoId } from "@/types/game";
import type {
  PlacementCountMatrix,
  PlacementCountVector,
} from "@/types/monteCarlo";
export { colorWithAlpha } from "@/services/colorUtils";

export type PlacementRowDatum = {
  basicId: DangoId;
  label: string;
  accentHex: string;
  accentInkHex: string;
  counts: PlacementCountVector;
  rates: number[];
  total: number;
  meanPlacement: number;
  variance: number;
  standardDeviation: number;
  stabilityScore: number;
  winRate: number;
  podiumRate: number;
  bottomTwoRate: number;
  boomBustRate: number;
};

export type PlacementRowColorResolver = (
  basicId: DangoId
) => Pick<PlacementRowDatum, "accentHex" | "accentInkHex">;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function sumCounts(counts: number[]): number {
  return counts.reduce((sum, count) => sum + count, 0);
}

export function toPercent(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return (value / total) * 100;
}

export function formatPercent(
  value: number,
  fractionDigits = 1
): string {
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatPlacementLabel(
  translateLabel: (key: string) => string,
  placementIndex: number
): string {
  const key = `common.placements.${placementIndex}`;
  const label = translateLabel(key);
  return label === key ? "" : label;
}

export const FULL_MARATHON_METERS = 42195;

export function formatBatchWallClockMs(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)} ms`;
  }
  const sec = ms / 1000;
  if (sec < 60) {
    return `${sec.toFixed(2)}s`;
  }
  const totalSec = Math.floor(sec);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

export function sumAggregateForwardDisplacementCells(
  selectedBasicIds: string[],
  basicMetricTotalsByBasicId: Record<
    string,
    { ownTurnProgressSum: number; passiveProgressSum: number }
  >
): number {
  return selectedBasicIds.reduce((sum, basicId) => {
    const totals = basicMetricTotalsByBasicId[basicId];
    if (!totals) {
      return sum;
    }
    return (
      sum + totals.ownTurnProgressSum + totals.passiveProgressSum
    );
  }, 0);
}

export function derivePlacementRow(
  basicId: DangoId,
  counts: PlacementCountVector,
  getLabel: (basicId: DangoId) => string,
  resolveColors?: PlacementRowColorResolver,
  placementCount = counts.length
): PlacementRowDatum {
  const normalizedCounts = counts.slice(0, placementCount);
  const total = sumCounts(normalizedCounts);
  const fallbackAccentHex = accentFillHexForDango(basicId);
  const colorTokens = resolveColors?.(basicId) ?? {
    accentHex: fallbackAccentHex,
    accentInkHex: contrastingInkHexForFill(fallbackAccentHex),
  };
  const rates = normalizedCounts.map((count) => toPercent(count, total));
  if (total === 0) {
    return {
      basicId,
      label: getLabel(basicId),
      accentHex: colorTokens.accentHex,
      accentInkHex: colorTokens.accentInkHex,
      counts: normalizedCounts,
      rates,
      total,
      meanPlacement: 0,
      variance: 0,
      standardDeviation: 0,
      stabilityScore: 0,
      winRate: 0,
      podiumRate: 0,
      bottomTwoRate: 0,
      boomBustRate: 0,
    };
  }
  const weightedPlacementSum = normalizedCounts.reduce(
    (sum, count, placementIndex) => sum + count * (placementIndex + 1),
    0
  );
  const meanPlacement = weightedPlacementSum / total;
  const variance =
    normalizedCounts.reduce((sum, count, placementIndex) => {
      const delta = placementIndex + 1 - meanPlacement;
      return sum + count * delta * delta;
    }, 0) / total;
  const standardDeviation = Math.sqrt(variance);
  const theoreticalMaxStandardDeviation =
    normalizedCounts.length > 1 ? (normalizedCounts.length - 1) / 2 : 1;
  const stabilityScore =
    theoreticalMaxStandardDeviation > 0
      ? clamp(
          100 * (1 - standardDeviation / theoreticalMaxStandardDeviation),
          0,
          100
        )
      : 100;
  const podiumSpan = Math.min(3, normalizedCounts.length);
  const bottomTwoStart = Math.max(normalizedCounts.length - 2, 0);
  const podiumRate = toPercent(
    normalizedCounts.slice(0, podiumSpan).reduce((sum, count) => sum + count, 0),
    total
  );
  const bottomTwoRate = toPercent(
    normalizedCounts.slice(bottomTwoStart).reduce((sum, count) => sum + count, 0),
    total
  );
  const boomBustRate = toPercent(
    (normalizedCounts[0] ?? 0) +
      (normalizedCounts[normalizedCounts.length - 1] ?? 0),
    total
  );
  return {
    basicId,
    label: getLabel(basicId),
    accentHex: colorTokens.accentHex,
    accentInkHex: colorTokens.accentInkHex,
    counts: normalizedCounts,
    rates,
    total,
    meanPlacement,
    variance,
    standardDeviation,
    stabilityScore,
    winRate: rates[0] ?? 0,
    podiumRate,
    bottomTwoRate,
    boomBustRate,
  };
}

export function derivePlacementRows(
  basicIds: DangoId[],
  placementCountsByBasicId: Record<string, PlacementCountVector>,
  getLabel: (basicId: DangoId) => string,
  resolveColors?: PlacementRowColorResolver
): PlacementRowDatum[] {
  const placementCount = Math.max(
    0,
    ...basicIds.map((basicId) => {
      const counts = placementCountsByBasicId[basicId] ?? [];
      let lastActivePlacementIndex = -1;
      for (let index = counts.length - 1; index >= 0; index -= 1) {
        if ((counts[index] ?? 0) > 0) {
          lastActivePlacementIndex = index;
          break;
        }
      }
      return lastActivePlacementIndex + 1;
    })
  );
  return basicIds.map((basicId) =>
    derivePlacementRow(
      basicId,
      placementCountsByBasicId[basicId] ?? [],
      getLabel,
      resolveColors,
      placementCount
    )
  );
}

export function rowMaxRate(row: PlacementRowDatum): number {
  return row.rates.reduce((max, rate) => Math.max(max, rate), 0);
}

export function sumMatrixRow(matrix: PlacementCountMatrix, rowIndex: number): number {
  return sumCounts(matrix[rowIndex] ?? []);
}

export function sumMatrixColumn(
  matrix: PlacementCountMatrix,
  columnIndex: number
): number {
  return matrix.reduce(
    (sum, row) => sum + (row[columnIndex] ?? 0),
    0
  );
}
