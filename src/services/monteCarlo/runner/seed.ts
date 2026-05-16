import { RUNNER_SEED_SPACE } from "@/services/monteCarlo/config/runnerTiming";

export function createSeedBase(): number {
  return Math.floor(Math.random() * RUNNER_SEED_SPACE) >>> 0;
}
