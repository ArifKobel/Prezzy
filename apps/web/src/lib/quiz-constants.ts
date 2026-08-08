import type { ElementProps } from "@Prezzy/shared";

export const QUIZ_OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];


function hexToHsl(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hue = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) hue = ((b - r) / d + 2) / 6;
    else hue = ((r - g) / d + 4) / 6;
  }

  return [Math.round(hue * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function darken(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, l - amount));
}

export function lighten(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.min(100, l + amount));
}

export function alpha(hex: string, ratio: number): string {
  const [h, s, l] = hexToHsl(hex);
  const targetL = l + (100 - l) * (1 - ratio);
  return hslToHex(h, Math.round(s * ratio), Math.round(targetL));
}


const DEFAULT_ACCENT = "#22574a";

const DEFAULT_OPTION_HUES = [
  "#22574a",
  "#a48246",
  "#6d3622",
  "#518fb8",
  "#44315e",
  "#4e7956",
];


const OPTION_HUE_OFFSETS = [0, 140, 40, 200, 80, 270];

export function deriveOptionAccents(
  accentColor?: string,
): Array<{ bg: string; fg: string }> {
  if (!accentColor) {
    return DEFAULT_OPTION_HUES.map((bg) => ({ bg, fg: "#f2f7f3" }));
  }

  const [h, s, l] = hexToHsl(accentColor);
  const bgS = Math.max(25, Math.min(50, s));
  const bgL = Math.max(30, Math.min(50, l));

  return OPTION_HUE_OFFSETS.map((offset) => ({
    bg: hslToHex((h + offset) % 360, bgS, bgL),
    fg: "#f2f7f3",
  }));
}

export function deriveBarFills(accentColor?: string): string[] {
  return deriveOptionAccents(accentColor).map((a) => a.bg);
}

export function deriveOptionClasses(accentColor?: string): string[] {
  const accents = deriveOptionAccents(accentColor);
  return accents.map((a) => `bg-[${a.bg}] hover:bg-[${darken(a.bg, 8)}]`);
}


export const QUIZ_OPTION_ACCENTS = deriveOptionAccents();
export const QUIZ_BAR_FILLS = deriveBarFills();
export const QUIZ_OPTION_COLORS = deriveOptionClasses();


export function timerColor(ratio: number, accentColor?: string): string {
  const accent = accentColor || DEFAULT_ACCENT;
  if (ratio > 0.5) return accent;
  if (ratio > 0.2) return "#8b7355";
  return "#fe8b70";
}

export function timerTextColor(ratio: number, accentColor?: string): string {
  const accent = accentColor || "#231f1c";
  if (ratio > 0.5) return accent;
  if (ratio > 0.2) return "#8b7355";
  return "#fe8b70";
}


export interface ElementStyle {
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface PresentationTheme {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  headingFont?: string;
  bodyFont?: string;
}

export function getElementStyle(props?: ElementProps | null): ElementStyle {
  return {
    accentColor: props?.accentColor,
    backgroundColor: props?.backgroundColor,
    textColor: props?.textColor,
  };
}

export function resolveElementStyle(
  props?: ElementProps | null,
  theme?: PresentationTheme | null,
): ElementStyle {
  const el = getElementStyle(props);
  return {
    accentColor: el.accentColor || theme?.primaryColor,
    backgroundColor: el.backgroundColor || theme?.backgroundColor,
    textColor: el.textColor || theme?.textColor,
  };
}


export function deriveCloudPalette(accentColor?: string): string[] {
  if (!accentColor) {
    return ["#22574a", "#a48246", "#6d3622", "#518fb8", "#44315e", "#4e7956", "#8e5775", "#8e8780"];
  }
  const [h, s] = hexToHsl(accentColor);
  const basS = Math.max(20, Math.min(45, s));
  return [0, 30, 60, 140, 200, 250, 310, 170].map((offset) =>
    hslToHex((h + offset) % 360, basS, 42 + (offset % 3) * 6),
  );
}
