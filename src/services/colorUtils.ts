export type ThemeMode = "light" | "dark";

export type ThemeSurfaceRole = "app" | "panel" | "muted";

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

type HslColor = {
  h: number;
  s: number;
  l: number;
};

const FALLBACK_COLOR_HEX = "#6366f1";
const LIGHT_TEXT_HEX = "#f8fafc";
const DARK_TEXT_HEX = "#0f172a";

const THEME_SURFACE_HEX: Record<ThemeMode, Record<ThemeSurfaceRole, string>> = {
  light: {
    app: "#f8fafc",
    panel: "#ffffff",
    muted: "#e2e8f0",
  },
  dark: {
    app: "#020617",
    panel: "#0f172a",
    muted: "#1e293b",
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeHexCharacterPair(value: string): string {
  return value.length === 1 ? `${value}${value}` : value;
}

export function normalizeHexColor(hex: string): string {
  const raw = hex.trim().replace(/^#/, "");
  if (raw.length === 3) {
    return `#${normalizeHexCharacterPair(raw[0] ?? "0")}${normalizeHexCharacterPair(
      raw[1] ?? "0"
    )}${normalizeHexCharacterPair(raw[2] ?? "0")}`.toLowerCase();
  }
  if (raw.length === 6) {
    return `#${raw}`.toLowerCase();
  }
  return FALLBACK_COLOR_HEX;
}

export function parseHexColor(hex: string): RgbColor | null {
  const normalized = normalizeHexColor(hex).replace("#", "");
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

function toHexChannel(value: number): string {
  return clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
}

export function rgbToHex(color: RgbColor): string {
  return `#${toHexChannel(color.r)}${toHexChannel(color.g)}${toHexChannel(color.b)}`;
}

function rgbToHsl(color: RgbColor): HslColor {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  if (delta === 0) {
    return { h: 0, s: 0, l };
  }
  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === r) {
    h = ((g - b) / delta) % 6;
  } else if (max === g) {
    h = (b - r) / delta + 2;
  } else {
    h = (r - g) / delta + 4;
  }
  return {
    h: (h * 60 + 360) % 360,
    s,
    l,
  };
}

function hueToRgb(p: number, q: number, t: number): number {
  let normalized = t;
  if (normalized < 0) {
    normalized += 1;
  }
  if (normalized > 1) {
    normalized -= 1;
  }
  if (normalized < 1 / 6) {
    return p + (q - p) * 6 * normalized;
  }
  if (normalized < 1 / 2) {
    return q;
  }
  if (normalized < 2 / 3) {
    return p + (q - p) * (2 / 3 - normalized) * 6;
  }
  return p;
}

function hslToRgb(color: HslColor): RgbColor {
  if (color.s === 0) {
    const value = color.l * 255;
    return { r: value, g: value, b: value };
  }
  const q =
    color.l < 0.5
      ? color.l * (1 + color.s)
      : color.l + color.s - color.l * color.s;
  const p = 2 * color.l - q;
  const h = color.h / 360;
  return {
    r: hueToRgb(p, q, h + 1 / 3) * 255,
    g: hueToRgb(p, q, h) * 255,
    b: hueToRgb(p, q, h - 1 / 3) * 255,
  };
}

function toLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const rgb = parseHexColor(hex);
  if (!rgb) {
    return relativeLuminance(FALLBACK_COLOR_HEX);
  }
  return (
    0.2126 * toLinear(rgb.r) +
    0.7152 * toLinear(rgb.g) +
    0.0722 * toLinear(rgb.b)
  );
}

export function contrastRatio(foregroundHex: string, backgroundHex: string): number {
  const lighter = Math.max(
    relativeLuminance(foregroundHex),
    relativeLuminance(backgroundHex)
  );
  const darker = Math.min(
    relativeLuminance(foregroundHex),
    relativeLuminance(backgroundHex)
  );
  return (lighter + 0.05) / (darker + 0.05);
}

export function themeSurfaceHex(
  mode: ThemeMode,
  role: ThemeSurfaceRole = "panel"
): string {
  return THEME_SURFACE_HEX[mode][role];
}

export function colorWithAlpha(hex: string, alpha: number): string {
  const rgb = parseHexColor(hex) ?? parseHexColor(FALLBACK_COLOR_HEX)!;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`;
}

export function blendHexColors(
  foregroundHex: string,
  backgroundHex: string,
  foregroundAlpha: number
): string {
  const foreground = parseHexColor(foregroundHex) ?? parseHexColor(FALLBACK_COLOR_HEX)!;
  const background = parseHexColor(backgroundHex) ?? parseHexColor(FALLBACK_COLOR_HEX)!;
  const alpha = clamp(foregroundAlpha, 0, 1);
  return rgbToHex({
    r: foreground.r * alpha + background.r * (1 - alpha),
    g: foreground.g * alpha + background.g * (1 - alpha),
    b: foreground.b * alpha + background.b * (1 - alpha),
  });
}

export function accessibleTextHexForFill(fillHex: string): string {
  const lightContrast = contrastRatio(LIGHT_TEXT_HEX, fillHex);
  const darkContrast = contrastRatio(DARK_TEXT_HEX, fillHex);
  return lightContrast >= darkContrast ? LIGHT_TEXT_HEX : DARK_TEXT_HEX;
}

export function ensureContrastColor(
  colorHex: string,
  options: {
    backgroundHex: string;
    minContrast: number;
    direction?: "lighter" | "darker";
  }
): string {
  const normalizedColorHex = normalizeHexColor(colorHex);
  const normalizedBackgroundHex = normalizeHexColor(options.backgroundHex);
  if (
    contrastRatio(normalizedColorHex, normalizedBackgroundHex) >=
    options.minContrast
  ) {
    return normalizedColorHex;
  }
  const rgb = parseHexColor(normalizedColorHex);
  if (!rgb) {
    return normalizedColorHex;
  }
  const baseHsl = rgbToHsl(rgb);
  const preferredDirection =
    options.direction ??
    (relativeLuminance(normalizedBackgroundHex) < 0.5 ? "lighter" : "darker");
  const searchTarget = preferredDirection === "lighter" ? 1 : 0;
  const contrastAtBound = contrastRatio(
    rgbToHex(
      hslToRgb({
        ...baseHsl,
        l: searchTarget,
      })
    ),
    normalizedBackgroundHex
  );
  if (contrastAtBound < options.minContrast) {
    const fallbackTarget = preferredDirection === "lighter" ? 0 : 1;
    return rgbToHex(
      hslToRgb({
        ...baseHsl,
        l: fallbackTarget,
      })
    );
  }
  let low = Math.min(baseHsl.l, searchTarget);
  let high = Math.max(baseHsl.l, searchTarget);
  let candidateHex = normalizedColorHex;
  for (let iteration = 0; iteration < 28; iteration += 1) {
    const nextLightness = (low + high) / 2;
    const nextHex = rgbToHex(
      hslToRgb({
        ...baseHsl,
        l: nextLightness,
      })
    );
    const nextContrast = contrastRatio(nextHex, normalizedBackgroundHex);
    if (nextContrast >= options.minContrast) {
      candidateHex = nextHex;
      if (preferredDirection === "lighter") {
        high = nextLightness;
      } else {
        low = nextLightness;
      }
    } else if (preferredDirection === "lighter") {
      low = nextLightness;
    } else {
      high = nextLightness;
    }
  }
  return candidateHex;
}

export function themeSafeColor(
  colorHex: string,
  options: {
    mode: ThemeMode;
    surfaceRole?: ThemeSurfaceRole;
    backgroundHex?: string;
    minContrast?: number;
  }
): string {
  const backgroundHex =
    options.backgroundHex ?? themeSurfaceHex(options.mode, options.surfaceRole ?? "panel");
  return ensureContrastColor(colorHex, {
    backgroundHex,
    minContrast: options.minContrast ?? 3,
  });
}

export function resolveOutlineHex(
  fillHex: string,
  backgroundHex: string
): string {
  const safeHex = ensureContrastColor(fillHex, {
    backgroundHex,
    minContrast: 3,
  });
  const candidates = [LIGHT_TEXT_HEX, DARK_TEXT_HEX, safeHex];
  return candidates.reduce(
    (bestHex, candidateHex) => {
      const candidateScore = Math.min(
        contrastRatio(candidateHex, fillHex),
        contrastRatio(candidateHex, backgroundHex)
      );
      const bestScore = Math.min(
        contrastRatio(bestHex, fillHex),
        contrastRatio(bestHex, backgroundHex)
      );
      return candidateScore > bestScore ? candidateHex : bestHex;
    },
    safeHex
  );
}
