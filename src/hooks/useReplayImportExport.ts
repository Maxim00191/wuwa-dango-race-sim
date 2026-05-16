import { useCallback } from "react";
import { useNotification } from "@/app/notifications/useNotification";
import { useTranslation } from "@/i18n/useTranslation";
import type { useReplayTimeline } from "@/hooks/useReplayTimeline";
import { parseReplayJsonText } from "@/services/replayImport";

type ReplayImportExportSource = Pick<
  ReturnType<typeof useReplayTimeline>,
  "readReplayFromJsonText" | "exportRecordJson"
>;

export function useReplayImportExport(replay: ReplayImportExportSource) {
  const { t } = useTranslation();
  const notify = useNotification();

  const handleImport = useCallback(
    (payload: string) => {
      const parsed = parseReplayJsonText(payload);
      if (!parsed.ok) {
        notify(t("game.replay.importInvalid"));
        return;
      }
      replay.readReplayFromJsonText(payload);
    },
    [notify, replay, t]
  );

  const handleExportCopy = useCallback(() => {
    const raw = replay.exportRecordJson();
    if (!raw) {
      return;
    }
    void navigator.clipboard.writeText(raw);
  }, [replay]);

  return { handleImport, handleExportCopy };
}
