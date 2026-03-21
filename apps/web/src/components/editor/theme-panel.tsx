import { ChevronLeft as ChevronLeftIcon, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { FONT_FAMILIES } from "@/lib/editor/tiptap";

export type ThemeObj = {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  headingFont?: string;
  bodyFont?: string;
};

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
        className="size-7 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
      />
      <div className="flex-1">
        <label className="font-sans text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">{label}</label>
        <input
          type="text"
          value={value || ""}
          placeholder={fallback}
          onChange={(e) => onChange(e.target.value || undefined)}
          onKeyDown={(e) => e.stopPropagation()}
          className="w-full rounded-md border border-border bg-surface px-2 py-1 font-mono text-[11px] text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-ring"
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
        className="w-full rounded-md border border-border bg-surface px-2 py-1.5 font-sans text-[11px] text-foreground outline-none focus:border-ring"
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

export function ThemePanel({ theme, onUpdate, onClose }: {
  theme?: ThemeObj | null;
  onUpdate: (t: ThemeObj) => void;
  onClose: () => void;
}) {
  const t = theme || {};

  return (
    <>
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2.5">
        <button onClick={onClose} className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-surface-container hover:text-foreground">
          <ChevronLeftIcon className="size-3.5" />
        </button>
        <Palette className="size-3.5 text-muted-foreground" />
        <span className="font-sans text-xs font-semibold text-foreground">Presentation Theme</span>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
        <section>
          <p className="mb-2.5 font-sans text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Colors</p>
          <div className="flex flex-col gap-2.5">
            <ThemeColorRow label="Primary" value={t.primaryColor} fallback="#4e6073" onChange={(v) => onUpdate({ primaryColor: v })} />
            <ThemeColorRow label="Secondary" value={t.secondaryColor} fallback="#6b8e7b" onChange={(v) => onUpdate({ secondaryColor: v })} />
            <ThemeColorRow label="Background" value={t.backgroundColor} fallback="#faf9f8" onChange={(v) => onUpdate({ backgroundColor: v })} />
            <ThemeColorRow label="Surface" value={t.surfaceColor} fallback="#ffffff" onChange={(v) => onUpdate({ surfaceColor: v })} />
            <ThemeColorRow label="Text" value={t.textColor} fallback="#2f3333" onChange={(v) => onUpdate({ textColor: v })} />
          </div>
        </section>

        <section>
          <p className="mb-2.5 font-sans text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Typography</p>
          <div className="flex flex-col gap-2.5">
            <ThemeFontRow label="Heading Font" value={t.headingFont} onChange={(v) => onUpdate({ headingFont: v })} />
            <ThemeFontRow label="Body Font" value={t.bodyFont} onChange={(v) => onUpdate({ bodyFont: v })} />
          </div>
        </section>

        {(t.primaryColor || t.secondaryColor || t.backgroundColor || t.surfaceColor || t.textColor || t.headingFont || t.bodyFont) && (
          <button
            onClick={() => onUpdate({ primaryColor: undefined, secondaryColor: undefined, backgroundColor: undefined, surfaceColor: undefined, textColor: undefined, headingFont: undefined, bodyFont: undefined })}
            className="self-start font-sans text-[10px] font-medium text-muted-foreground hover:text-foreground"
          >
            Reset to defaults
          </button>
        )}
      </div>
    </>
  );
}
