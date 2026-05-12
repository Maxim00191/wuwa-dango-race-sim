import type { DangoId } from "@/types/game";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslatableContent } from "@/i18n";
import { useSafeDangoColors } from "@/services/dangoColors";
import {
  accessibleTextHexForFill,
  blendHexColors,
  colorWithAlpha,
  themeSurfaceHex,
} from "@/services/colorUtils";

export type BroadcastBannerPayload = {
  variant:
    | "turn"
    | "roll"
    | "skill"
    | "idle"
    | "teleport"
    | "slide"
    | "effect"
    | "victory";
  headline: TranslatableContent;
  detail?: TranslatableContent;
  accentDangoId?: DangoId;
};

type BroadcastBannerProps = {
  payload: BroadcastBannerPayload | null;
};

const variantShell: Record<
  BroadcastBannerPayload["variant"],
  string
> = {
  turn:
    "border-slate-300/90 bg-white/92 shadow-md shadow-slate-900/12 ring-1 ring-slate-400/35 dark:border-slate-600/80 dark:bg-slate-950/85 dark:shadow-slate-950/50 dark:ring-slate-500/40",
  roll:
    "border-sky-400/55 bg-sky-50/96 shadow-md shadow-sky-900/15 ring-1 ring-sky-400/35 dark:border-sky-500/50 dark:bg-sky-950/90 dark:shadow-sky-950/45 dark:ring-sky-400/35",
  skill:
    "border-amber-400/85 bg-amber-50/98 shadow-md shadow-amber-900/18 ring-2 ring-amber-400/45 animate-pulse dark:border-amber-400/70 dark:bg-amber-950/95 dark:shadow-amber-950/45 dark:ring-amber-300/60",
  idle:
    "border-slate-300/85 bg-white/94 shadow-sm shadow-slate-900/10 ring-1 ring-slate-400/30 dark:border-slate-600/70 dark:bg-slate-950/88 dark:shadow-slate-950/45 dark:ring-slate-500/35",
  teleport:
    "border-fuchsia-400/55 bg-fuchsia-50/96 shadow-md shadow-fuchsia-900/15 ring-1 ring-fuchsia-400/40 dark:border-fuchsia-500/45 dark:bg-fuchsia-950/90 dark:shadow-fuchsia-950/45 dark:ring-fuchsia-400/40",
  slide:
    "border-emerald-400/55 bg-emerald-50/96 shadow-md shadow-emerald-900/15 ring-1 ring-emerald-400/35 dark:border-emerald-500/45 dark:bg-emerald-950/90 dark:shadow-emerald-950/45 dark:ring-emerald-400/35",
  effect:
    "border-violet-400/60 bg-violet-50/96 shadow-md shadow-violet-900/15 ring-1 ring-violet-400/40 dark:border-violet-500/50 dark:bg-violet-950/90 dark:shadow-violet-950/45 dark:ring-violet-400/40",
  victory:
    "border-amber-300/80 bg-gradient-to-br from-amber-500/95 via-orange-600/95 to-rose-700/95 shadow-lg shadow-amber-900/25 ring-2 ring-amber-300/70 dark:from-amber-600/95 dark:via-orange-700/95 dark:to-rose-800/95 dark:shadow-amber-950/55 dark:ring-amber-200/70",
};

const headlineClass: Record<BroadcastBannerPayload["variant"], string> = {
  turn: "text-xs font-bold leading-tight text-slate-900 dark:text-white sm:text-sm",
  roll: "text-xs font-bold leading-tight text-sky-900 dark:text-sky-50 sm:text-sm",
  skill: "text-xs font-extrabold leading-tight text-amber-950 dark:text-amber-50 sm:text-sm",
  idle: "text-[11px] font-semibold leading-snug text-slate-800 dark:text-slate-50 sm:text-xs",
  teleport: "text-[11px] font-bold leading-snug text-fuchsia-950 dark:text-fuchsia-50 sm:text-xs",
  slide: "text-[11px] font-bold leading-snug text-emerald-950 dark:text-emerald-50 sm:text-xs",
  effect: "text-[11px] font-bold leading-snug text-violet-950 dark:text-violet-50 sm:text-xs",
  victory:
    "text-sm font-black leading-tight tracking-tight text-white drop-shadow-sm sm:text-base",
};

export function BroadcastBanner({ payload }: BroadcastBannerProps) {
  const { tText } = useTranslation();
  const { mode } = useTheme();
  const getSafeDangoColors = useSafeDangoColors();
  if (!payload) {
    return null;
  }
  const accentHex = payload.accentDangoId
    ? getSafeDangoColors(payload.accentDangoId).chartHex
    : null;
  const accentTextHex =
    accentHex !== null
      ? accessibleTextHexForFill(
          blendHexColors(accentHex, themeSurfaceHex(mode, "app"), 0.52)
        )
      : null;
  const accentShell =
    accentHex !== null
      ? {
          backgroundColor: `color-mix(in srgb, ${accentHex} 52%, var(--banner-mix-bg))`,
          borderColor: `color-mix(in srgb, ${accentHex} 75%, var(--banner-mix-border))`,
          boxShadow: `0 5px 14px -6px color-mix(in srgb, ${accentHex} 40%, var(--banner-mix-shadow))`,
        }
      : undefined;
  const wrapperClass = accentHex
    ? `pointer-events-none m-auto w-full max-w-[14rem] rounded-lg border px-2.5 py-1.5 text-center backdrop-blur-md sm:max-w-[15rem] ${
        payload.variant === "skill" ? "animate-pulse" : ""
      }`
    : `pointer-events-none m-auto w-full max-w-[14rem] rounded-lg px-2.5 py-1.5 text-center shadow-sm shadow-slate-900/10 backdrop-blur-md dark:shadow-slate-950/40 sm:max-w-[15rem] ${variantShell[payload.variant]}`;
  const headlineResolved =
    accentHex !== null
      ? "text-xs font-bold leading-tight drop-shadow-sm sm:text-sm"
      : headlineClass[payload.variant];
  const detailResolved =
    accentHex !== null
      ? payload.variant === "victory"
        ? "mt-0.5 text-[9px] font-normal tracking-normal sm:text-[10px]"
        : "mt-0.5 text-[10px] font-normal leading-snug sm:text-[11px]"
      : payload.variant === "victory"
        ? "mt-0.5 text-[9px] font-normal tracking-normal text-amber-100/85 sm:text-[10px]"
        : "mt-0.5 text-[10px] font-normal leading-snug text-slate-600 dark:text-slate-300 sm:text-[11px]";
  return (
    <div className={wrapperClass} style={accentShell}>
      <p className={headlineResolved} style={accentTextHex ? { color: accentTextHex } : undefined}>
        {tText(payload.headline)}
      </p>
      {payload.detail ? (
        <p
          className={detailResolved}
          style={
            accentTextHex
              ? {
                  color:
                    payload.variant === "victory"
                      ? colorWithAlpha(accentTextHex, 0.82)
                      : colorWithAlpha(accentTextHex, 0.9),
                }
              : undefined
          }
        >
          {tText(payload.detail)}
        </p>
      ) : null}
    </div>
  );
}
