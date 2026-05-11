import {
  accentFillHexForDango,
  contrastingInkHexForFill,
} from "@/services/dangoColors";
import type { DangoId } from "@/types/game";
import type {
  PlacementCountMatrix,
  PlacementCountVector,
} from "@/types/monteCarlo";

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseHexTriplet(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return null;
  }
  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value)) {
    return null;
  }
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
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

export function colorWithAlpha(hex: string, alpha: number): string {
  const rgb = parseHexTriplet(hex);
  if (!rgb) {
    return `rgba(99, 102, 241, ${clamp(alpha, 0, 1)})`;
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`;
}

export function derivePlacementRow(
  basicId: DangoId,
  counts: PlacementCountVector,
  getLabel: (basicId: DangoId) => string
): PlacementRowDatum {
  const total = sumCounts(counts);
  const accentHex = accentFillHexForDango(basicId);
  const rates = counts.map((count) => toPercent(count, total));
  if (total === 0) {
    return {
      basicId,
      label: getLabel(basicId),
      accentHex,
      accentInkHex: contrastingInkHexForFill(accentHex),
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
    accentHex,
    accentInkHex: contrastingInkHexForFill(accentHex),
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
  getLabel: (basicId: DangoId) => string
): PlacementRowDatum[] {
  return basicIds.map((basicId) =>
    derivePlacementRow(
      basicId,
      placementCountsByBasicId[basicId] ?? [],
      getLabel
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
