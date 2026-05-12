import { useMemo } from "react";
import { useTheme } from "@/hooks/useTheme";
import { ABBY_ID } from "@/constants/ids";
import {
  accessibleTextHexForFill,
  colorWithAlpha,
  resolveOutlineHex,
  themeSurfaceHex,
  themeSafeColor,
  type ThemeMode,
} from "@/services/colorUtils";
import type { DangoId } from "@/types/game";

const BASIC_ACCENT_PALETTE = [
  "#38bdf8",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#94a3b8",
] as const;

const DANGO_ACCENT_OVERRIDES: Partial<Record<DangoId, string>> = {
  aemeath: "#e28bad",
  cartethyia: "#d4b483",
  carlotta: "#FFDBDB",
  chisa: "#4B000A",
  denia: "#FFB3DE",
  augusta: "#FF0000",
  calcharo: "#A7B1C1",
  changli: "#E15B6F",
  hiyuki: "#CFCFFF",
  iuno: "#0060AA",
  jinhsi: "#F9FFF5",
  lynae: "#DCC1A4",
  luukHerssen: "#FFE374",
  mornye: "#A5A7FF",
  phrolova: "#7EA381",
  phoebe: "#eab308",
  shorekeeper: "#5FA5FF",
  sigrika: "#fb923c",
};

function hashStringId(entityId: string): number {
  return entityId
    .split("")
    .reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0);
}

export function accentFillHexForDango(entityId: DangoId): string {
  if (entityId === ABBY_ID) {
    return "#8B15AF";
  }
  const override = DANGO_ACCENT_OVERRIDES[entityId];
  if (override) {
    return override;
  }
  return BASIC_ACCENT_PALETTE[hashStringId(entityId) % BASIC_ACCENT_PALETTE.length]!;
}

export function contrastingInkHexForFill(fillHex: string): string {
  return accessibleTextHexForFill(fillHex);
}

export type SafeDangoColorTokens = {
  baseHex: string;
  baseInkHex: string;
  chartHex: string;
  chartInkHex: string;
  uiOutlineHex: string;
  uiOutlineSoftHex: string;
  surfaceHex: string;
};

export function resolveSafeDangoColorTokens(
  entityId: DangoId,
  mode: ThemeMode
): SafeDangoColorTokens {
  const baseHex = accentFillHexForDango(entityId);
  const surfaceHex = themeSurfaceHex(mode, "panel");
  const chartHex = themeSafeColor(baseHex, {
    mode,
    backgroundHex: surfaceHex,
    minContrast: 3.2,
  });
  const uiOutlineHex = resolveOutlineHex(baseHex, surfaceHex);
  return {
    baseHex,
    baseInkHex: contrastingInkHexForFill(baseHex),
    chartHex,
    chartInkHex: contrastingInkHexForFill(chartHex),
    uiOutlineHex,
    uiOutlineSoftHex: colorWithAlpha(uiOutlineHex, mode === "dark" ? 0.42 : 0.22),
    surfaceHex,
  };
}

export function useSafeDangoColors() {
  const { mode } = useTheme();
  return useMemo(() => {
    const cache = new Map<DangoId, SafeDangoColorTokens>();
    return (entityId: DangoId): SafeDangoColorTokens => {
      const cached = cache.get(entityId);
      if (cached) {
        return cached;
      }
      const next = resolveSafeDangoColorTokens(entityId, mode);
      cache.set(entityId, next);
      return next;
    };
  }, [mode]);
}
