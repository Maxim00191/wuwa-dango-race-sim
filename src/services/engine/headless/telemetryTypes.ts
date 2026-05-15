import type { HeadlessRaceBasicMetrics } from "@/types/monteCarlo";

export type HeadlessRaceTelemetryCollector = {
  basicMetricsById: Record<string, HeadlessRaceBasicMetrics>;
};
