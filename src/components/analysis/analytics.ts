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
  resolveColors?: PlacementRowColorResolver
): PlacementRowDatum {
  const total = sumCounts(counts);
  const fallbackAccentHex = accentFillHexForDango(basicId);
  const colorTokens = resolveColors?.(basicId) ?? {
    accentHex: fallbackAccentHex,
    accentInkHex: contrastingInkHexForFill(fallbackAccentHex),
  };
  const rates = counts.map((count) => toPercent(count, total));
  if (total === 0) {
    return {
      basicId,
      label: getLabel(basicId),
      accentHex: colorTokens.accentHex,
      accentInkHex: colorTokens.accentInkHex,
      counts,
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
  const weightedPlacementSum = counts.reduce(
    (sum, count, placementIndex) => sum + count * (placementIndex + 1),
    0
  );
  const meanPlacement = weightedPlacementSum / total;
  const variance =
    counts.reduce((sum, count, placementIndex) => {
      const delta = placementIndex + 1 - meanPlacement;
      return sum + count * delta * delta;
    }, 0) / total;
  const standardDeviation = Math.sqrt(variance);
  const theoreticalMaxStandardDeviation =
    counts.length > 1 ? (counts.length - 1) / 2 : 1;
  const stabilityScore =
    theoreticalMaxStandardDeviation > 0
      ? clamp(
          100 * (1 - standardDeviation / theoreticalMaxStandardDeviation),
          0,
          100
        )
      : 100;
  const podiumSpan = Math.min(3, counts.length);
  const bottomTwoStart = Math.max(counts.length - 2, 0);
  const podiumRate = toPercent(
    counts.slice(0, podiumSpan).reduce((sum, count) => sum + count, 0),
    total
  );
  const bottomTwoRate = toPercent(
    counts.slice(bottomTwoStart).reduce((sum, count) => sum + count, 0),
    total
  );
  const boomBustRate = toPercent(
    (counts[0] ?? 0) + (counts[counts.length - 1] ?? 0),
    total
  );
  return {
    basicId,
    label: getLabel(basicId),
    accentHex: colorTokens.accentHex,
    accentInkHex: colorTokens.accentInkHex,
    counts,
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
  return basicIds.map((basicId) =>
    derivePlacementRow(
      basicId,
      placementCountsByBasicId[basicId] ?? [],
      getLabel,
      resolveColors
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
