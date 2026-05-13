import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const KONAMI_KEYS = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
] as const;

const TOAST_MS = 1500;
const BUILD_STAMP_CLICKS = 5;
const BUILD_STAMP_WINDOW_MS = 3200;

type ToastAnchor = { x: number; y: number };

type ToastState = {
  message: string;
  anchor?: ToastAnchor;
};

type RevealFn = (message: string, options?: { anchor?: ToastAnchor }) => void;

const AuthorRevealContext = createContext<RevealFn | null>(null);

function useAuthorReveal(): RevealFn {
  const ctx = useContext(AuthorRevealContext);
  if (!ctx) {
    throw new Error("AuthorEasterEggProvider is required");
  }
  return ctx;
}

function shouldIgnoreKeyTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function AuthorEasterEggProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const konamiIndexRef = useRef(0);

  const reveal = useCallback((message: string, options?: { anchor?: ToastAnchor }) => {
    setToast({ message, anchor: options?.anchor });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const onDocumentClick = (e: MouseEvent) => {
      if (e.detail !== 3) return;
      reveal("By Maxim0191", { anchor: { x: e.clientX, y: e.clientY } });
    };
    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [reveal]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreKeyTarget(e.target)) return;
      const expected = KONAMI_KEYS[konamiIndexRef.current];
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === expected) {
        konamiIndexRef.current += 1;
        if (konamiIndexRef.current >= KONAMI_KEYS.length) {
          konamiIndexRef.current = 0;
          reveal("Maxim0191");
        }
        return;
      }
      konamiIndexRef.current = key === KONAMI_KEYS[0] ? 1 : 0;
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reveal]);

  return (
    <AuthorRevealContext.Provider value={reveal}>
      {children}
      {toast ? (
        <div
          className="pointer-events-none fixed z-[100]"
          style={
            toast.anchor
              ? {
                  left: toast.anchor.x,
                  top: toast.anchor.y,
                  transform: "translate(-50%, calc(-100% - 10px))",
                }
              : {
                  bottom: "1.5rem",
                  left: "50%",
                  transform: "translateX(-50%)",
                }
          }
          role="status"
          aria-live="polite"
        >
          <div className="max-w-[min(90vw,20rem)] animate-banner-pop rounded-full border border-slate-300/80 bg-white/95 px-4 py-2 text-center text-xs font-medium tracking-wide text-slate-700 shadow-lg shadow-slate-900/15 dark:border-slate-600/80 dark:bg-slate-900/95 dark:text-slate-200 dark:shadow-black/40">
            {toast.message}
          </div>
        </div>
      ) : null}
    </AuthorRevealContext.Provider>
  );
}

type SecretBuildTimestampProps = {
  dateTime: string;
  children: ReactNode;
};

export function SecretBuildTimestamp({
  dateTime,
  children,
}: SecretBuildTimestampProps) {
  const reveal = useAuthorReveal();
  const streakRef = useRef({ count: 0, windowStart: 0 });

  const onClick = () => {
    const now = Date.now();
    const streak = streakRef.current;
    if (now - streak.windowStart > BUILD_STAMP_WINDOW_MS) {
      streak.count = 1;
      streak.windowStart = now;
    } else {
      streak.count += 1;
    }
    if (streak.count >= BUILD_STAMP_CLICKS) {
      streak.count = 0;
      streak.windowStart = 0;
      reveal("Maxim0191");
    }
  };

  return (
    <time dateTime={dateTime} onClick={onClick}>
      {children}
    </time>
  );
}
