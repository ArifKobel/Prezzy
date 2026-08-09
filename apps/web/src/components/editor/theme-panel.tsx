import type { PresentationTheme, SlideThemeTokens } from "@Prezzy/shared";
import {
  SLIDE_THEME_PRESETS,
  legacyThemeTokens,
  resolveSlideTheme,
} from "@Prezzy/shared/theme";
import { ChevronLeft as ChevronLeftIcon, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { FONT_FAMILIES } from "@/lib/editor/tiptap";

export type ThemePatch = { [K in keyof PresentationTheme]?: PresentationTheme[K] | null };

const LEGACY_NULLS: ThemePatch = {
  primaryColor: null,
  secondaryColor: null,
  backgroundColor: null,
  surfaceColor: null,
  textColor: null,
  headingFont: null,
  bodyFont: null,
};

function explicitTokens(theme?: PresentationTheme | null): SlideThemeTokens {
  if (!theme) return {};
  return { ...legacyThemeTokens(theme), ...theme.overrides };
}

function ThemeColorRow({ label, value, fallback, onChange }: {
  label: string; value?: string; fallback: string; onChange: (v: string | undefined) => void;
}) {
  const [localColor, setLocalColor] = useState(value || fallback);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocalColor(value || fallback);
  }, [value, fallback]);

  const handleColorInput = (v: string) => {
    setLocalColor(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(v), 300);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={localColor}
        onChange={(e) => handleColorInput(e.target.value)}
        className="size-7 cursor-pointer border border-border bg-transparent p-0.5"
      />
      <div className="flex-1">
        <label className="font-sans text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">{label}</label>
        <input
          type="text"
          value={value || ""}
          placeholder={fallback}
          onChange={(e) => onChange(e.target.value || undefined)}
          onKeyDown={(e) => e.stopPropagation()}
          className="w-full border border-border bg-surface px-2 py-1 font-mono text-[11px] text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-ring"
        />
      </div>
    </div>
  );
}

function ThemeFontRow({ label, value, onChange }: {
  label: string; value?: string; onChange: (v: string | undefined) => void;
}) {
  const allOptions = [{ label: "Default", value: "" }, ...FONT_FAMILIES];
  return (
    <div>
      <label className="mb-1 block font-sans text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">{label}</label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full border border-border bg-surface px-2 py-1.5 font-sans text-[11px] text-foreground outline-none focus:border-ring"
        style={{ fontFamily: value || undefined }}
      >
        {allOptions.map((f) => (
          <option key={f.value} value={f.value} style={{ fontFamily: f.value || undefined }}>
            {f.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function PresetCard({ id, label, active, onSelect }: {
  id: string; label: string; active: boolean; onSelect: () => void;
}) {
  const t = resolveSlideTheme({ base: id });
  return (
    <button
      onClick={onSelect}
      className={`group flex flex-col gap-1 text-left ${active ? "" : "opacity-90 hover:opacity-100"}`}
    >
      <div
        className={`aspect-video w-full overflow-hidden border p-2 transition-shadow ${
          active ? "border-primary ring-1 ring-primary" : "border-border group-hover:shadow-sm"
        }`}
        style={{ backgroundColor: t.bg }}
      >
        <p className="text-[11px] font-bold leading-tight" style={{ color: t.heading, fontFamily: t.fontHeading }}>
          Aa
        </p>
        <p className="mt-0.5 text-[6px] leading-snug" style={{ color: t.muted, fontFamily: t.fontBody }}>
          The quick brown fox
        </p>
        <div className="mt-1.5 h-1 w-6" style={{ backgroundColor: t.accent }} />
      </div>
      <span className={`font-sans text-[10px] ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>
    </button>
  );
}

export function ThemePanel({ theme, onUpdate, onClose }: {
  theme?: PresentationTheme | null;
  onUpdate: (t: ThemePatch) => void;
  onClose: () => void;
}) {
  const tokens = explicitTokens(theme);
  const resolved = resolveSlideTheme(theme);
  const activeBase = theme?.base ?? (Object.keys(tokens).length === 0 ? "clean" : null);
  const hasCustomizations = Object.keys(tokens).length > 0;

  function setToken<K extends keyof SlideThemeTokens>(key: K, value: SlideThemeTokens[K] | undefined) {
    const next = { ...tokens };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onUpdate({ base: theme?.base ?? null, overrides: next, ...LEGACY_NULLS });
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2.5">
        <button onClick={onClose} className="flex size-6 items-center justify-center text-muted-foreground transition-all hover:bg-surface-container hover:text-foreground">
          <ChevronLeftIcon className="size-3.5" />
        </button>
        <Palette className="size-3.5 text-muted-foreground" />
        <span className="font-sans text-xs font-semibold text-foreground">Theme</span>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
        <section>
          <p className="mb-2.5 font-sans text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Presets</p>
          <div className="grid grid-cols-2 gap-2.5">
            {SLIDE_THEME_PRESETS.map((p) => (
              <PresetCard
                key={p.id}
                id={p.id}
                label={p.label}
                active={activeBase === p.id && !hasCustomizations}
                onSelect={() => onUpdate({ base: p.id, overrides: null, ...LEGACY_NULLS })}
              />
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2.5 font-sans text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Customize</p>
          <div className="flex flex-col gap-2.5">
            <ThemeColorRow label="Background" value={tokens.bg} fallback={resolved.bg} onChange={(v) => setToken("bg", v)} />
            <ThemeColorRow label="Text" value={tokens.text} fallback={resolved.text} onChange={(v) => setToken("text", v)} />
            <ThemeColorRow label="Accent" value={tokens.accent} fallback={resolved.accent} onChange={(v) => setToken("accent", v)} />
            <ThemeColorRow label="Surface" value={tokens.surface} fallback={resolved.surface} onChange={(v) => setToken("surface", v)} />
          </div>
        </section>

        <section>
          <p className="mb-2.5 font-sans text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Typography</p>
          <div className="flex flex-col gap-2.5">
            <ThemeFontRow label="Heading Font" value={tokens.fontHeading} onChange={(v) => setToken("fontHeading", v)} />
            <ThemeFontRow label="Body Font" value={tokens.fontBody} onChange={(v) => setToken("fontBody", v)} />
          </div>
        </section>

        {hasCustomizations && (
          <button
            onClick={() => onUpdate({ base: theme?.base ?? "clean", overrides: null, ...LEGACY_NULLS })}
            className="self-start font-sans text-[10px] font-medium text-muted-foreground hover:text-foreground"
          >
            Reset customizations
          </button>
        )}
      </div>
    </>
  );
}
