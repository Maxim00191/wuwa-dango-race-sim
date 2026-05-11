import { useCallback, useSyncExternalStore } from "react";
import type { ThemeMode } from "@/services/colorUtils";

const STORAGE_KEY = "dango-scramble-color-mode";

const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

const listeners = new Set<() => void>();

function readStoredThemeMode(): ThemeMode | null {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }
  return null;
}

function readResolvedThemeMode(): ThemeMode {
  if (typeof document === "undefined") {
    return "light";
  }
  if (document.documentElement.classList.contains("dark")) {
    return "dark";
  }
  return "light";
}

function syncThemeDom(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
}

function emitThemeChange() {
  listeners.forEach((listener) => listener());
}

function resolvePreferredThemeMode(): ThemeMode {
  const storedMode = readStoredThemeMode();
  if (storedMode) {
    return storedMode;
  }
  if (typeof window !== "undefined" && window.matchMedia(THEME_MEDIA_QUERY).matches) {
    return "dark";
  }
  return "light";
}

function subscribeToThemeStore(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  if (typeof window === "undefined") {
    return () => {
      listeners.delete(onStoreChange);
    };
  }
  const mediaQuery = window.matchMedia(THEME_MEDIA_QUERY);
  const handleMediaChange = () => {
    if (readStoredThemeMode() !== null) {
      return;
    }
    syncThemeDom(resolvePreferredThemeMode());
    emitThemeChange();
  };
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) {
      return;
    }
    syncThemeDom(resolvePreferredThemeMode());
    emitThemeChange();
  };
  mediaQuery.addEventListener("change", handleMediaChange);
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(onStoreChange);
    mediaQuery.removeEventListener("change", handleMediaChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function getThemeSnapshot(): ThemeMode {
  return readResolvedThemeMode();
}

export function useTheme() {
  const mode: ThemeMode = useSyncExternalStore(
    subscribeToThemeStore,
    getThemeSnapshot,
    () => "light"
  );
  const isDark = mode === "dark";

  const applyMode = useCallback((nextMode: ThemeMode) => {
    syncThemeDom(nextMode);
    window.localStorage.setItem(STORAGE_KEY, nextMode);
    emitThemeChange();
  }, []);

  const applyDark = useCallback(
    (nextDark: boolean) => {
      applyMode(nextDark ? "dark" : "light");
    },
    [applyMode]
  );

  const toggle = useCallback(() => {
    applyMode(mode === "dark" ? "light" : "dark");
  }, [applyMode, mode]);

  return { isDark, mode, toggle, applyDark, applyMode };
}
