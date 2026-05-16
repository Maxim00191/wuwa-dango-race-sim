import { useEffect, type ReactNode } from "react";
import { registerGlobalErrorHandlers } from "@/app/errors/globalErrorHandlers";
import { useNotification } from "@/app/notifications/useNotification";

export function GlobalErrorHandlerBridge({ children }: { children: ReactNode }) {
  const notify = useNotification();

  useEffect(() => registerGlobalErrorHandlers(notify), [notify]);

  return children;
}
