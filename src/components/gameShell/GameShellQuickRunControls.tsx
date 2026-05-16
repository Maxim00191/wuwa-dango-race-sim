import type { GameShellControlDisabledState } from "@/services/gameShellControls";
import { useTranslation } from "@/i18n/useTranslation";
import { ControlCluster } from "@/components/gameShell/ControlCluster";
import { suppressMouseDownFocus } from "@/components/gameShell/suppressMouseDownFocus";

type GameShellQuickRunControlsProps = {
  disabled: GameShellControlDisabledState;
  onInstantTurn: () => void;
  onInstantGame: () => void;
};

export function GameShellQuickRunControls({
  disabled,
  onInstantTurn,
  onInstantGame,
}: GameShellQuickRunControlsProps) {
  const { t } = useTranslation();

  return (
    <ControlCluster label={t("game.controls.quickRuns")}>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <button
          type="button"
          onMouseDown={suppressMouseDownFocus}
          onClick={onInstantTurn}
          disabled={disabled.instantDisabled}
          className="inline-flex min-h-9 items-center justify-center rounded-full bg-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-fuchsia-50 shadow-lg shadow-fuchsia-950/40 transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:min-h-11 sm:px-5 sm:py-2 sm:text-sm dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
        >
          {t("game.controls.instantTurn")}
        </button>
        <button
          type="button"
          onMouseDown={suppressMouseDownFocus}
          onClick={onInstantGame}
          disabled={disabled.instantDisabled}
          className="inline-flex min-h-9 items-center justify-center rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-rose-50 shadow-lg shadow-rose-950/40 transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:min-h-11 sm:px-5 sm:py-2 sm:text-sm dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
        >
          {t("game.controls.instantGame")}
        </button>
      </div>
    </ControlCluster>
  );
}
