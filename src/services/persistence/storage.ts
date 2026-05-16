export type StorageBackend = "local" | "session";

function resolveStorage(backend: StorageBackend): Storage | null {
  if (typeof globalThis.window === "undefined") {
    return null;
  }
  try {
    return backend === "local"
      ? globalThis.localStorage
      : globalThis.sessionStorage;
  } catch {
    return null;
  }
}

export function readStorageValue(
  key: string,
  backend: StorageBackend = "local"
): string | null {
  const storage = resolveStorage(backend);
  if (!storage) {
    return null;
  }
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorageValue(
  key: string,
  value: string,
  backend: StorageBackend = "local"
): void {
  const storage = resolveStorage(backend);
  if (!storage) {
    return;
  }
  try {
    storage.setItem(key, value);
  } catch {
    return;
  }
}

export function removeStorageValue(
  key: string,
  backend: StorageBackend = "local"
): void {
  const storage = resolveStorage(backend);
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(key);
  } catch {
    return;
  }
}
