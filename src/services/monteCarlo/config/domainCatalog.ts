import type { RaceMode } from "@/types/game";
import type {
  CellEffectAnalyticsKey,
  MonteCarloRaceContext,
  StackRoleKey,
} from "@/types/monteCarlo";

export const STACK_ROLE_KEYS: StackRoleKey[] = [
  "solo",
  "driver",
  "passenger",
  "crown",
];

export const CELL_EFFECT_KEYS: CellEffectAnalyticsKey[] = [
  "propulsionDevice",
  "hindranceDevice",
  "timeRift",
];

export const RACE_MODES: RaceMode[] = [
  "normal",
  "tournamentPreliminary",
  "tournamentFinal",
  "customFinal",
  "knockoutGroup",
  "knockoutBracket",
  "knockoutFinal",
];

export const RACE_CONTEXTS: MonteCarloRaceContext[] = [
  "sprint",
  "preliminary",
  "final",
  "knockoutGroup",
  "knockoutBracket",
  "knockoutFinal",
];
