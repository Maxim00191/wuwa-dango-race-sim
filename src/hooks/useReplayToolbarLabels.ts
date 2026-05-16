import { useMemo } from "react";
import { useTranslation } from "@/i18n/useTranslation";

export function useReplayToolbarLabels() {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      toolbarCaption: t("game.replay.toolbarCaption"),
      idleHint: t("game.replay.idleHint"),
      seekTurnLabel: t("game.replay.seekEngineTurn"),
      seekTurnButton: t("game.replay.seekTurnButton"),
      exportCopy: t("game.replay.exportCopy"),
      import: t("game.replay.import"),
      jumpToPresent: t("game.replay.jumpToPresent"),
      stepBack: t("game.replay.stepBack"),
      stepForward: t("game.replay.stepForward"),
      bannersOn: t("game.replay.bannersOn"),
      bannersOff: t("game.replay.bannersOff"),
    }),
    [t]
  );
}
