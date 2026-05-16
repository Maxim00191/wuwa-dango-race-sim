import { isValidBasicSelection } from "@/services/gameEngine";
import type { DangoId } from "@/types/game";

export type RacePhase = "idle" | "running" | "finished";

export function resolveActiveLineupBasicIds(
  phase: RacePhase,
  selectedBasicIds: DangoId[],
  activeBasicIds: DangoId[]
): DangoId[] {
  if (phase === "idle") {
    return selectedBasicIds;
  }
  return activeBasicIds;
}

export function isMapSelectorDisabled(input: {
  phase: RacePhase;
  isAnimating: boolean;
  replayLoaded: boolean;
}): boolean {
  return (
    input.phase === "running" || input.isAnimating || input.replayLoaded
  );
}

export function isNormalMonteCarloRunDisabled(
  lineupBasicIds: DangoId[],
  isAnimating: boolean,
  replayLoaded: boolean
): boolean {
  return (
    !isValidBasicSelection(lineupBasicIds) || isAnimating || replayLoaded
  );
}

export function isNormalStartDisabled(input: {
  phase: RacePhase;
  isAnimating: boolean;
  lineupBasicIds: DangoId[];
  replayLoaded: boolean;
}): boolean {
  return (
    input.phase === "running" ||
    input.isAnimating ||
    !isValidBasicSelection(input.lineupBasicIds) ||
    input.replayLoaded
  );
}

export function isKnockoutMonteCarloRunDisabled(
  lineupReady: boolean,
  isAnimating: boolean,
  replayLoaded: boolean
): boolean {
  return !lineupReady || isAnimating || replayLoaded;
}

export function isKnockoutStartDisabled(input: {
  controlsLocked: boolean;
  lineupReady: boolean;
  replayLoaded: boolean;
}): boolean {
  return input.controlsLocked || !input.lineupReady || input.replayLoaded;
}

export function isRaceControlsLocked(
  phase: RacePhase,
  isAnimating: boolean
): boolean {
  return phase === "running" || isAnimating;
}
