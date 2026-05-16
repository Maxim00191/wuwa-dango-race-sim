import { useContext, useMemo, type ReactNode } from "react";
import {
  SimulationDependenciesContext,
  mergeSimulationDependencies,
  type SimulationDependencies,
} from "@/hooks/simulationDependencies";

export type SimulationDependenciesProviderProps = {
  children: ReactNode;
  value?: Partial<SimulationDependencies>;
};

export function SimulationDependenciesProvider({
  children,
  value,
}: SimulationDependenciesProviderProps) {
  const parent = useContext(SimulationDependenciesContext);
  const resolved = useMemo(
    () => mergeSimulationDependencies(parent, value),
    [parent, value]
  );

  return (
    <SimulationDependenciesContext.Provider value={resolved}>
      {children}
    </SimulationDependenciesContext.Provider>
  );
}

export function ScopedSimulationDependenciesProvider({
  children,
  value,
}: SimulationDependenciesProviderProps) {
  return (
    <SimulationDependenciesProvider value={value}>
      {children}
    </SimulationDependenciesProvider>
  );
}
