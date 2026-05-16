import { PLAYBACK_SPEED_OPTIONS } from "@/hooks/playbackSettings";
import { usePlaybackSettings } from "@/hooks/usePlaybackSettings";
import { useTranslation } from "@/i18n/useTranslation";
import { ControlCluster } from "@/components/gameShell/ControlCluster";
import { suppressMouseDownFocus } from "@/components/gameShell/suppressMouseDownFocus";

export function GameShellPlaybackCluster() {
  const { t } = useTranslation();
  const { speedMultiplier, setSpeedMultiplier } = usePlaybackSettings();

  return (
    <ControlCluster label={t("nav.playback.label")}>
      <div className="grid grid-cols-4 gap-1 rounded-full border border-slate-200 bg-slate-50/90 p-1 shadow-inner shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-950/70 dark:shadow-slate-950/30">
        {PLAYBACK_SPEED_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onMouseDown={suppressMouseDownFocus}
            onClick={() => setSpeedMultiplier(option)}
            aria-pressed={option === speedMultiplier}
            aria-label={t("nav.playback.optionAria", { speed: option })}
            className={`min-h-9 rounded-full px-2 py-1.5 text-xs font-semibold transition sm:min-h-11 sm:px-3 sm:py-2 sm:text-sm sm:min-w-[3.5rem] ${
              option === speedMultiplier
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 dark:bg-slate-100 dark:text-slate-950 dark:shadow-slate-100/10"
                : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
          >
            {option}x
          </button>
        ))}
      </div>
    </ControlCluster>
  );
}
