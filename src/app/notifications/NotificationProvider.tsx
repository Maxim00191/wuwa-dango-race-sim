import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  NotificationContext,
  type NotificationLevel,
  type NotificationPayload,
} from "@/app/notifications/notificationContext";

const TOAST_MS = 4000;

type NotificationProviderProps = {
  children: ReactNode;
};

export function NotificationProvider({ children }: NotificationProviderProps) {
  const baseId = useId();
  const sequenceRef = useRef(0);
  const [toast, setToast] = useState<NotificationPayload | null>(null);

  const notify = useCallback(
    (message: string, options?: { level?: NotificationLevel }) => {
      sequenceRef.current += 1;
      setToast({
        id: `${baseId}-${sequenceRef.current}`,
        message,
        level: options?.level ?? "error",
      });
    },
    [baseId]
  );

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timerId = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timerId);
  }, [toast]);

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-6 left-1/2 z-[100] w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2"
        >
          <p
            className={
              toast.level === "error"
                ? "rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-900 shadow-lg dark:border-rose-900/60 dark:bg-rose-950/90 dark:text-rose-100"
                : "rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            }
          >
            {toast.message}
          </p>
        </div>
      ) : null}
    </NotificationContext.Provider>
  );
}
