import {
  StrictMode,
  type ComponentType,
  type ReactNode,
} from "react";
import App from "@/App";
import { AppProviders } from "@/app/AppProviders";
import { DEFAULT_APP_PROVIDERS } from "@/app/defaultAppProviders";
import type { AppProviderComponent } from "@/app/providerComposition";
import { ENABLE_STRICT_MODE } from "@/config/bootstrap";

export type ApplicationRootComponent = ComponentType;

export type CreateApplicationTreeOptions = {
  RootComponent?: ApplicationRootComponent;
  providers?: readonly AppProviderComponent[];
  strictModeEnabled?: boolean;
};

export function createApplicationTree(
  options: CreateApplicationTreeOptions = {}
): ReactNode {
  const RootComponent = options.RootComponent ?? App;
  const providers = options.providers ?? DEFAULT_APP_PROVIDERS;
  const strictModeEnabled = options.strictModeEnabled ?? ENABLE_STRICT_MODE;

  const tree = (
    <AppProviders providers={providers}>
      <RootComponent />
    </AppProviders>
  );

  if (!strictModeEnabled) {
    return tree;
  }

  return <StrictMode>{tree}</StrictMode>;
}
