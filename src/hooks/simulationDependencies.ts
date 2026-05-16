import { createContext, useContext } from "react";
import { createReplayGameBridge } from "@/hooks/createReplayGameBridge";
import { useGame } from "@/hooks/useGame";
import { useGameShellSpectate } from "@/hooks/useGameShellSpectate";
import { useKnockoutLineup } from "@/hooks/useKnockoutLineup";
import { useKnockoutTournament } from "@/hooks/useKnockoutTournament";
import { useReplayTimeline } from "@/hooks/useReplayTimeline";
import { useTournament } from "@/hooks/useTournament";

export type SimulationDependencies = {
  useGame: typeof useGame;
  useReplayTimeline: typeof useReplayTimeline;
  useGameShellSpectate: typeof useGameShellSpectate;
  createReplayGameBridge: typeof createReplayGameBridge;
  useKnockoutLineup: typeof useKnockoutLineup;
  useKnockoutTournament: typeof useKnockoutTournament;
  useTournament: typeof useTournament;
};

export const defaultSimulationDependencies: SimulationDependencies = {
  useGame,
  useReplayTimeline,
  useGameShellSpectate,
  createReplayGameBridge,
  useKnockoutLineup,
  useKnockoutTournament,
  useTournament,
};

export const SimulationDependenciesContext = createContext<SimulationDependencies>(
  defaultSimulationDependencies
);

export function useSimulationDependencies(): SimulationDependencies {
  return useContext(SimulationDependenciesContext);
}

export function mergeSimulationDependencies(
  base: SimulationDependencies = defaultSimulationDependencies,
  overrides?: Partial<SimulationDependencies>
): SimulationDependencies {
  if (!overrides) {
    return base;
  }
  return { ...base, ...overrides };
}
