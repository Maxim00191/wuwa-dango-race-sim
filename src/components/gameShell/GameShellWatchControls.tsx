import type { ReactNode } from "react";
import type { GameShellControlDisabledState } from "@/services/gameShellControls";
import type { GameShellSpectate } from "@/types/gameShell";
import { useTranslation } from "@/i18n/useTranslation";
import { ControlCluster } from "@/components/gameShell/ControlCluster";
import { suppressMouseDownFocus } from "@/components/gameShell/suppressMouseDownFocus";

type GameShellWatchControlsProps = {
  disabled: GameShellControlDisabledState;
  startControls: ReactNode;
  resetAdjacentControls?: ReactNode;
  playTurnEnabled: boolean;
  autoPlayEnabled: boolean;
  onAutoPlayEnabledChange: (nextValue: boolean) => void;
  onPlayTurn: () => void;
  onStepAction: () => void;
  onReset: () => void;
  spectate?: GameShellSpectate;
};

export function GameShellWatchControls({
  disabled,
  startControls,
  resetAdjacentControls,
  playTurnEnabled,
  autoPlayEnabled,
  onAutoPlayEnabledChange,
  onPlayTurn,
  onStepAction,
  onReset,
  spectate,
}: GameShellWatchControlsProps) {
  const { t } = useTranslation();
  const autoActive = spectate ? spectate.autoActive : autoPlayEnabled;

  return (
    <ControlCluster label={t("game.controls.watch")}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-5 gap-2 sm:flex sm:flex-wrap sm:gap-2">
          {startControls}
          <button
            type="button"
            onMouseDown={suppressMouseDownFocus}
            onClick={spectate ? spectate.onStep : onStepAction}
            disabled={disabled.nextTurnDisabled}
            className="inline-flex min-h-9 items-center justify-center rounded-full bg-violet-500 px-3 py-1.5 text-xs font-semibold text-violet-950 shadow-lg shadow-violet-900/40 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:min-h-11 sm:px-5 sm:py-2 sm:text-sm dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
          >
            {t("game.controls.step")}
          </button>
          <button
            type="button"
            onMouseDown={suppressMouseDownFocus}
            onClick={spectate ? spectate.onPlayTurn : onPlayTurn}
            disabled={disabled.playTurnDisabled}
            className="inline-flex min-h-9 items-center justify-center rounded-full bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-lg shadow-sky-900/40 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:min-h-11 sm:px-5 sm:py-2 sm:text-sm dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
          >
            {playTurnEnabled || Boolean(spectate?.playTurnBusy)
              ? t("game.controls.playingTurn")
              : t("game.controls.playTurn")}
          </button>
          <AutoRunButton
            autoActive={autoActive}
            disabled={disabled.autoRunDisabled}
            onEnable={() =>
              spectate ? spectate.onToggleAuto() : onAutoPlayEnabledChange(true)
            }
            onDisable={() =>
              spectate ? spectate.onToggleAuto() : onAutoPlayEnabledChange(false)
            }
          />
          {resetAdjacentControls}
          <button
            type="button"
            onMouseDown={suppressMouseDownFocus}
            onClick={onReset}
            className="inline-flex min-h-9 items-center justify-center rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-rose-50 shadow-lg shadow-rose-950/35 transition hover:bg-rose-500 sm:min-h-11 sm:px-5 sm:py-2 sm:text-sm"
          >
            {t("game.controls.reset")}
          </button>
        </div>
      </div>
    </ControlCluster>
  );
}

function AutoRunButton({
  autoActive,
  disabled,
  onEnable,
  onDisable,
}: {
  autoActive: boolean;
  disabled: boolean;
  onEnable: () => void;
  onDisable: () => void;
}) {
  const { t } = useTranslation();
  const dimmed = disabled ? "opacity-55" : "";

  if (autoActive) {
    return (
      <span
        className={`relative inline-flex overflow-hidden rounded-full p-[3px] shadow-lg shadow-violet-900/25 dark:shadow-violet-950/40 ${dimmed}`}
      >
        <span className="pause-auto-run-rainbow__wrap">
          <span aria-hidden className="pause-auto-run-rainbow__spin" />
        </span>
        <button
          type="button"
          onMouseDown={suppressMouseDownFocus}
          onClick={onDisable}
          disabled={disabled}
          className="relative z-10 inline-flex min-h-9 items-center justify-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 sm:min-h-11 sm:px-5 sm:py-2 sm:text-sm dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
        >
          {t("game.controls.pauseAuto")}
        </button>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex rounded-full bg-[linear-gradient(90deg,#f43f5e,#fb923c,#fbbf24,#4ade80,#38bdf8,#818cf8,#e879f9,#f43f5e)] p-[3px] shadow-lg shadow-violet-900/25 dark:shadow-violet-950/40 ${dimmed}`}
    >
      <button
        type="button"
        onMouseDown={suppressMouseDownFocus}
        onClick={onEnable}
        disabled={disabled}
        className="inline-flex min-h-9 items-center justify-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 sm:min-h-11 sm:px-5 sm:py-2 sm:text-sm dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
      >
        {t("game.controls.autoRun")}
      </button>
    </span>
  );
}
