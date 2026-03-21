import { cn } from "@Prezzy/ui/lib/utils";
import { useEffect, useRef, useState } from "react";
import { isLightColor } from "@/components/editor/toolbar/color-utils";

const PRESET_COLORS = [
  "#000000", "#ffffff", "#2f3333", "#6b7280", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6",
];

export function TextColorPicker({
  color,
  onChange,
}: {
  color: string | null;
  onChange: (color: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        title="Text color"
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        className={cn(
          "flex size-7 items-center justify-center rounded-md transition-all",
          open
            ? "bg-primary/10"
            : "hover:bg-surface-container",
        )}
      >
        {color ? (
          <div
            className="flex size-5 items-center justify-center rounded"
            style={{ backgroundColor: isLightColor(color) ? "#1a1a1a" : color }}
          >
            <span
              className="text-[11px] font-bold leading-none"
              style={{ color: isLightColor(color) ? color : "#ffffff" }}
            >A</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold leading-none text-foreground">A</span>
            <div className="mt-px h-[2px] w-3.5 rounded-full bg-foreground" />
          </div>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[156px] rounded-lg border border-border bg-card p-2 shadow-lg">
          <div className="grid grid-cols-5 gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onMouseDown={(e) => { e.preventDefault(); onChange(c); setOpen(false); }}
                className={cn(
                  "aspect-square w-full rounded-md border transition-transform hover:scale-110",
                  c === color ? "border-primary ring-1 ring-primary" : "border-border/50",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
            <input
              type="color"
              value={color || "#000000"}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                const hex = e.target.value;
                clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => onChange(hex), 100);
              }}
              className="size-6 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5"
            />
            <span className="font-sans text-[9px] text-muted-foreground">Custom</span>
          </div>
        </div>
      )}
    </div>
  );
}
