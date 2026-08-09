import type { PresentationTheme, ResolvedSlideTheme, SlideThemeTokens } from "./index";

export interface SlideThemePreset {
  id: string;
  label: string;
  tokens: SlideThemeTokens & Pick<Required<SlideThemeTokens>, "bg" | "text" | "accent" | "fontHeading" | "fontBody">;
}

export const SLIDE_THEME_PRESETS: SlideThemePreset[] = [
  {
    id: "clean",
    label: "Clean",
    tokens: {
      bg: "#ffffff",
      text: "#1c1d20",
      accent: "#3b5bdb",
      fontHeading: "'Inter Variable', sans-serif",
      fontBody: "'Inter Variable', sans-serif",
    },
  },
  {
    id: "ink",
    label: "Ink",
    tokens: {
      bg: "#17181c",
      text: "#f4f2ec",
      accent: "#e8734a",
      fontHeading: "'Space Grotesk Variable', sans-serif",
      fontBody: "'Inter Variable', sans-serif",
    },
  },
  {
    id: "editorial",
    label: "Editorial",
    tokens: {
      bg: "#fffcf5",
      text: "#221f1a",
      accent: "#1f513f",
      fontHeading: "'Playfair Display Variable', serif",
      fontBody: "'Bitter Variable', serif",
    },
  },
  {
    id: "bold",
    label: "Bold",
    tokens: {
      bg: "#ffffff",
      text: "#0d0d0d",
      accent: "#ff4d00",
      fontHeading: "'Bebas Neue', sans-serif",
      fontBody: "'Archivo Variable', sans-serif",
      radius: 0,
    },
  },
  {
    id: "slate",
    label: "Slate",
    tokens: {
      bg: "#eef1f4",
      text: "#1f2937",
      accent: "#0f766e",
      fontHeading: "'Sora Variable', sans-serif",
      fontBody: "'Inter Variable', sans-serif",
    },
  },
];

export const DEFAULT_SLIDE_THEME_ID = "clean";

function presetById(id?: string): SlideThemePreset {
  return SLIDE_THEME_PRESETS.find((p) => p.id === id) ?? SLIDE_THEME_PRESETS[0];
}

function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function mixHex(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return a;
  const ch = pa.map((v, i) => clamp255(v + (pb[i] - v) * t));
  return `#${ch.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function legacyThemeTokens(theme: PresentationTheme): SlideThemeTokens {
  const t: SlideThemeTokens = {};
  if (theme.backgroundColor) t.bg = theme.backgroundColor;
  if (theme.surfaceColor) t.surface = theme.surfaceColor;
  else if (theme.secondaryColor) t.surface = theme.secondaryColor;
  if (theme.textColor) t.text = theme.textColor;
  if (theme.primaryColor) t.accent = theme.primaryColor;
  if (theme.headingFont) t.fontHeading = theme.headingFont;
  if (theme.bodyFont) t.fontBody = theme.bodyFont;
  return t;
}

export function resolveSlideTheme(theme?: PresentationTheme | null, slideBg?: string | null): ResolvedSlideTheme {
  const preset = presetById(theme?.base);
  const tokens: SlideThemeTokens = {
    ...preset.tokens,
    ...(theme ? legacyThemeTokens(theme) : {}),
    ...theme?.overrides,
  };
  if (slideBg) tokens.bg = slideBg;

  const bg = tokens.bg ?? "#ffffff";
  const text = tokens.text ?? "#1c1d20";
  return {
    bg,
    text,
    accent: tokens.accent ?? "#3b5bdb",
    surface: tokens.surface ?? mixHex(bg, text, 0.06),
    muted: tokens.muted ?? mixHex(text, bg, 0.42),
    heading: tokens.heading ?? text,
    fontHeading: tokens.fontHeading ?? "'Inter Variable', sans-serif",
    fontBody: tokens.fontBody ?? "'Inter Variable', sans-serif",
    radius: tokens.radius ?? 8,
  };
}
