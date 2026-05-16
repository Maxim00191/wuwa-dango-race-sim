import { createContext } from "react";

export type NotificationLevel = "error" | "info";

export type NotificationPayload = {
  id: string;
  message: string;
  level: NotificationLevel;
};

export type NotifyFn = (
  message: string,
  options?: { level?: NotificationLevel }
) => void;

export const NotificationContext = createContext<NotifyFn | null>(null);
