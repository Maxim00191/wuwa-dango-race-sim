import { logApplicationError } from "@/app/errors/errorLogging";
import type { NotificationLevel } from "@/app/notifications/notificationContext";

export type GlobalErrorNotify = (
  message: string,
  options?: { level?: NotificationLevel }
) => void;

const DEFAULT_UNHANDLED_MESSAGE =
  "An unexpected error occurred. Check the console for details.";

function formatGlobalErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }
  return DEFAULT_UNHANDLED_MESSAGE;
}

export function registerGlobalErrorHandlers(
  notify: GlobalErrorNotify
): () => void {
  const handleWindowError = (event: ErrorEvent): void => {
    logApplicationError(event.error ?? event.message, {
      source: "window.error",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
    notify(formatGlobalErrorMessage(event.error ?? event.message));
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    logApplicationError(event.reason, { source: "unhandledrejection" });
    notify(formatGlobalErrorMessage(event.reason));
  };

  window.addEventListener("error", handleWindowError);
  window.addEventListener("unhandledrejection", handleUnhandledRejection);

  return () => {
    window.removeEventListener("error", handleWindowError);
    window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  };
}
