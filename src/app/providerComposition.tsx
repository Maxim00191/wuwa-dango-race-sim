import { type ComponentType, type ReactNode } from "react";

export type AppProviderComponent = ComponentType<{ children: ReactNode }>;

export function composeProviders(
  children: ReactNode,
  providers: readonly AppProviderComponent[]
): ReactNode {
  return providers.reduceRight(
    (acc, Provider) => <Provider>{acc}</Provider>,
    children
  );
}
