import type { ResolvedSlideTheme } from "@Prezzy/shared";

export const THEME_TOKENS = ["bg", "surface", "text", "muted", "heading", "accent"] as const;

export type ThemeToken = (typeof THEME_TOKENS)[number];

const isThemeToken = (value: string): value is ThemeToken =>
  (THEME_TOKENS as readonly string[]).includes(value);

export function themeColorVar(value?: string): string | undefined {
  if (!value) return undefined;
  return isThemeToken(value) ? `var(--slide-${value})` : value;
}

export function themeColorValue(value?: string, theme?: ResolvedSlideTheme | null): string | undefined {
  if (!value) return undefined;
  return isThemeToken(value) ? theme?.[value] : value;
}
