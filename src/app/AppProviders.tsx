import { type ReactNode } from "react";
import { DEFAULT_APP_PROVIDERS } from "@/app/defaultAppProviders";
import {
  composeProviders,
  type AppProviderComponent,
} from "@/app/providerComposition";

export type AppProvidersProps = {
  children: ReactNode;
  providers?: readonly AppProviderComponent[];
};

export function AppProviders({
  children,
  providers = DEFAULT_APP_PROVIDERS,
}: AppProvidersProps) {
  return <>{composeProviders(children, providers)}</>;
}
