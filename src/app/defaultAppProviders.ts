import { AuthorEasterEggProvider } from "@/components/AuthorEasterEgg";
import { ErrorBoundaryProvider } from "@/app/errors/ErrorBoundaryProvider";
import { GlobalErrorHandlerBridge } from "@/app/errors/GlobalErrorHandlerBridge";
import { NotificationProvider } from "@/app/notifications/NotificationProvider";
import { ApplicationWorkspaceProvider } from "@/app/ApplicationWorkspaceProvider";
import { PlaybackSettingsProvider } from "@/hooks/PlaybackSettingsProvider";
import { SimulationDependenciesProvider } from "@/hooks/SimulationDependenciesProvider";
import { LanguageProvider } from "@/i18n/LanguageContext";
import type { AppProviderComponent } from "@/app/providerComposition";

export const DEFAULT_APP_PROVIDERS: readonly AppProviderComponent[] = [
  LanguageProvider,
  PlaybackSettingsProvider,
  NotificationProvider,
  GlobalErrorHandlerBridge,
  SimulationDependenciesProvider,
  AuthorEasterEggProvider,
  ApplicationWorkspaceProvider,
  ErrorBoundaryProvider,
];
