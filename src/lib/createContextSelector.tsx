import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type ContextSelector<T, U> = (value: T) => U;

type ContextStore<T> = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  setSnapshot: (value: T) => void;
};

function createContextStore<T>(initial: T): ContextStore<T> {
  let snapshot = initial;
  const listeners = new Set<() => void>();

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return snapshot;
    },
    setSnapshot(value) {
      if (Object.is(snapshot, value)) {
        return;
      }
      snapshot = value;
      listeners.forEach((listener) => listener());
    },
  };
}

export function createContextSelector<T>(displayName: string) {
  const Context = createContext<ContextStore<T> | null>(null);
  Context.displayName = `${displayName}Store`;

  function Provider({
    value,
    children,
  }: {
    value: T;
    children: ReactNode;
  }) {
    const storeRef = useRef<ContextStore<T> | null>(null);
    if (!storeRef.current) {
      storeRef.current = createContextStore(value);
    }

    useEffect(() => {
      storeRef.current?.setSnapshot(value);
    }, [value]);

    return (
      <Context.Provider value={storeRef.current}>{children}</Context.Provider>
    );
  }
  Provider.displayName = `${displayName}Provider`;

  function useStore(): ContextStore<T> {
    const store = useContext(Context);
    if (!store) {
      throw new Error(`${displayName} requires a matching Provider`);
    }
    return store;
  }

  function useContextValue(): T {
    const store = useStore();
    return useSyncExternalStore(
      store.subscribe,
      store.getSnapshot,
      store.getSnapshot
    );
  }

  function useContextSelector<U>(
    selector: ContextSelector<T, U>,
    isEqual: (left: U, right: U) => boolean = Object.is
  ): U {
    const store = useStore();
    const selectorRef = useRef(selector);
    const isEqualRef = useRef(isEqual);
    selectorRef.current = selector;
    isEqualRef.current = isEqual;

    const selectionRef = useRef<U | undefined>(undefined);

    const getSelection = useCallback(() => {
      const next = selectorRef.current(store.getSnapshot());
      const previous = selectionRef.current;
      if (previous !== undefined && isEqualRef.current(previous, next)) {
        return previous;
      }
      selectionRef.current = next;
      return next;
    }, [store]);

    return useSyncExternalStore(
      store.subscribe,
      getSelection,
      getSelection
    );
  }

  return {
    Context,
    Provider,
    useContextValue,
    useContextSelector,
  };
}
