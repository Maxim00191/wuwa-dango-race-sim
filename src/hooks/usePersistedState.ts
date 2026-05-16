import { useCallback, useEffect, useState } from "react";
import {
  readStorageValue,
  writeStorageValue,
  type StorageBackend,
} from "@/services/persistence/storage";

export type UsePersistedStateOptions<T> = {
  backend?: StorageBackend;
  read: (raw: string | null) => T;
  write: (value: T) => string | null;
  isEqual?: (left: T, right: T) => boolean;
};

export function usePersistedState<T>(
  key: string,
  {
    backend = "local",
    read,
    write,
    isEqual = Object.is,
  }: UsePersistedStateOptions<T>
): [T, (value: T | ((previous: T) => T)) => void] {
  const [state, setState] = useState<T>(() =>
    read(readStorageValue(key, backend))
  );

  const setPersistedState = useCallback(
    (next: T | ((previous: T) => T)) => {
      setState((previous) => {
        const resolved =
          typeof next === "function"
            ? (next as (value: T) => T)(previous)
            : next;
        return isEqual(previous, resolved) ? previous : resolved;
      });
    },
    [isEqual]
  );

  useEffect(() => {
    const serialized = write(state);
    if (serialized === null) {
      return;
    }
    writeStorageValue(key, serialized, backend);
  }, [backend, key, state, write]);

  return [state, setPersistedState];
}
