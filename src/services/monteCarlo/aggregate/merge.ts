import { NON_ADDITIVE_AGGREGATE_KEYS } from "@/services/monteCarlo/config/aggregateKeys";
import type { MonteCarloAggregateSnapshot } from "@/types/monteCarlo";

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function cloneAdditiveValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(cloneAdditiveValue);
  }
  if (isPlainRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cloneAdditiveValue(entry)])
    );
  }
  return value;
}

function mergeAdditiveValue(target: unknown, source: unknown): unknown {
  if (typeof source === "number") {
    return (typeof target === "number" ? target : 0) + source;
  }
  if (Array.isArray(source)) {
    const targetArray = Array.isArray(target) ? target : [];
    const length = Math.max(targetArray.length, source.length);
    return Array.from({ length }, (_, index) =>
      mergeAdditiveValue(targetArray[index], source[index] ?? 0)
    );
  }
  if (isPlainRecord(source)) {
    const merged = isPlainRecord(target)
      ? { ...target }
      : ({} as Record<string, unknown>);
    for (const [key, value] of Object.entries(source)) {
      if (value === undefined) {
        continue;
      }
      merged[key] = mergeAdditiveValue(merged[key], value);
    }
    return merged;
  }
  return cloneAdditiveValue(source);
}

export function absorbMonteCarloAggregateIntoAggregate(
  target: MonteCarloAggregateSnapshot,
  source: Partial<MonteCarloAggregateSnapshot>
): void {
  const mutableTarget = target as unknown as Record<string, unknown>;
  const sourceRecord = source as unknown as Record<string, unknown>;
  for (const key of Object.keys(source) as (keyof MonteCarloAggregateSnapshot)[]) {
    if (NON_ADDITIVE_AGGREGATE_KEYS.has(key)) {
      continue;
    }
    if (key === "minTurns") {
      if (source.minTurns !== undefined) {
        target.minTurns = Math.min(target.minTurns, source.minTurns);
      }
      continue;
    }
    if (key === "maxTurns") {
      if (source.maxTurns !== undefined) {
        target.maxTurns = Math.max(target.maxTurns, source.maxTurns);
      }
      continue;
    }
    const sourceValue = sourceRecord[key];
    if (sourceValue === undefined) {
      continue;
    }
    mutableTarget[key] = mergeAdditiveValue(mutableTarget[key], sourceValue);
  }
}
