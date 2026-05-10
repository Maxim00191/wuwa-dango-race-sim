import { ABBY_ID } from "@/constants/ids";
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
  aemeath: "#f9a8d4",
  carlotta: "#ffffff",
  chisa: "#020617",
  lynae: "#d6b48f",
  mornye: "#c7d2fe",
  shorekeeper: "#3b82f6",
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

function parseHexTriplet(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return null;
  }
  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value)) {
    return null;
  }
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export function contrastingInkHexForFill(fillHex: string): string {
  const rgb = parseHexTriplet(fillHex);
  if (!rgb) {
    return "#f8fafc";
  }
  const luminance =
    (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.62 ? "#0f172a" : "#f8fafc";
}
