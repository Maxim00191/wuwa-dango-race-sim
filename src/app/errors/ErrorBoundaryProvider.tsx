import type { ReactNode } from "react";
import { AppErrorBoundary } from "@/app/errors/AppErrorBoundary";

export function ErrorBoundaryProvider({ children }: { children: ReactNode }) {
  return <AppErrorBoundary>{children}</AppErrorBoundary>;
}
