import type { DangoId } from "@/types/game";
import { accentFillHexForDango } from "@/services/dangoColors";

export type BroadcastBannerPayload = {
  variant: "turn" | "roll" | "skill" | "idle" | "teleport" | "slide" | "victory";
  headline: string;
  detail?: string;
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
    "border-slate-600/80 bg-slate-950/85 shadow-xl shadow-slate-950/60 ring-1 ring-slate-500/40",
  roll:
    "border-sky-500/50 bg-sky-950/90 shadow-xl shadow-sky-950/50 ring-1 ring-sky-400/35",
  skill:
    "border-amber-400/70 bg-amber-950/95 shadow-xl shadow-amber-950/55 ring-2 ring-amber-300/60 animate-pulse",
  idle:
    "border-slate-600/70 bg-slate-950/88 shadow-lg shadow-slate-950/55 ring-1 ring-slate-500/35",
  teleport:
    "border-fuchsia-500/45 bg-fuchsia-950/90 shadow-xl shadow-fuchsia-950/50 ring-1 ring-fuchsia-400/40",
  slide:
    "border-emerald-500/45 bg-emerald-950/90 shadow-xl shadow-emerald-950/50 ring-1 ring-emerald-400/35",
  victory:
    "border-amber-300/80 bg-gradient-to-br from-amber-600/95 via-orange-700/95 to-rose-800/95 shadow-2xl shadow-amber-950/70 ring-2 ring-amber-200/70",
};

const headlineClass: Record<BroadcastBannerPayload["variant"], string> = {
  turn: "text-base font-bold leading-tight text-white sm:text-lg",
  roll: "text-base font-bold leading-tight text-sky-50 sm:text-lg",
  skill: "text-base font-extrabold leading-tight text-amber-50 sm:text-lg",
  idle: "text-sm font-semibold leading-snug text-slate-50 sm:text-base",
  teleport: "text-sm font-bold leading-snug text-fuchsia-50 sm:text-base",
  slide: "text-sm font-bold leading-snug text-emerald-50 sm:text-base",
  victory:
    "text-lg font-black uppercase leading-tight tracking-[0.06em] text-white drop-shadow-md sm:text-xl",
};

export function BroadcastBanner({ payload }: BroadcastBannerProps) {
  if (!payload) {
    return null;
  }
  const accentHex = payload.accentDangoId
    ? accentFillHexForDango(payload.accentDangoId)
    : null;
  const accentShell =
    accentHex !== null
      ? {
          backgroundColor: `color-mix(in srgb, ${accentHex} 52%, #0f172a)`,
          borderColor: `color-mix(in srgb, ${accentHex} 75%, #1e293b)`,
          boxShadow: `0 14px 32px -10px color-mix(in srgb, ${accentHex} 45%, #020617)`,
        }
      : undefined;
  const wrapperClass = accentHex
    ? `pointer-events-none m-auto w-full max-w-sm rounded-2xl border-2 px-4 py-3 text-center backdrop-blur-md sm:max-w-sm ${
        payload.variant === "skill" ? "animate-pulse" : ""
      }`
    : `pointer-events-none m-auto w-full max-w-sm rounded-2xl px-4 py-3 text-center shadow-lg shadow-slate-950/50 backdrop-blur-md sm:max-w-sm ${variantShell[payload.variant]}`;
  const headlineResolved =
    accentHex !== null
      ? "text-base font-bold leading-tight text-white drop-shadow-sm sm:text-lg"
      : headlineClass[payload.variant];
  const detailResolved =
    accentHex !== null
      ? payload.variant === "victory"
        ? "mt-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/90 sm:text-xs"
        : "mt-1.5 text-xs font-medium leading-snug text-white/85 sm:text-[13px]"
      : payload.variant === "victory"
        ? "mt-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-100/95 sm:text-xs"
        : "mt-1.5 text-xs font-medium leading-snug text-slate-200/90 sm:text-[13px]";
  return (
    <div className={wrapperClass} style={accentShell}>
      <p className={headlineResolved}>{payload.headline}</p>
      {payload.detail ? <p className={detailResolved}>{payload.detail}</p> : null}
    </div>
  );
}
