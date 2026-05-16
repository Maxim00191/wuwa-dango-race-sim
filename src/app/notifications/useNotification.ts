import { useContext } from "react";
import { NotificationContext } from "@/app/notifications/notificationContext";

export function useNotification() {
  const notify = useContext(NotificationContext);
  if (!notify) {
    throw new Error("useNotification requires NotificationProvider");
  }
  return notify;
}
