import { cn } from "@Prezzy/ui/lib/utils";
import { useEffect, useRef, useState } from "react";
import { FONT_SIZES } from "@/lib/editor/tiptap";

export function FontSizeInput({
  value, onCommit, onStep, onBlur: onBlurProp, className,
}: {
  value: string;
  onCommit: (v: string) => void;
  onStep: (delta: number) => void;
  onBlur?: () => void;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!focused) setDraft(value); }, [value, focused]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function commit(v: string) {
    const n = parseInt(v, 10);
    if (!isNaN(n) && n >= 1) onCommit(String(n));
  }

  return (
    <div ref={ref} className={cn("relative flex items-center gap-0", className)}>
      <button
        onMouseDown={(e) => { e.preventDefault(); onStep(-1); }}
        className="flex h-7 w-5 items-center justify-center rounded-l-md border border-r-0 border-border bg-surface font-sans text-[11px] text-muted-foreground hover:bg-surface-container hover:text-foreground"
      >−</button>
      <input
        type="text" inputMode="numeric" value={draft} placeholder="—"
        className="h-7 w-10 border-y border-border bg-surface px-1 text-center font-sans text-[11px] text-foreground outline-none hover:bg-surface-container focus:border-ring"
        onMouseDown={() => setOpen(true)}
        onChange={(e) => {
          const v = e.target.value.replace(/[^0-9]/g, "");
          setDraft(v);
          const n = parseInt(v, 10);
          if (!isNaN(n) && n >= 1 && n <= 400) onCommit(String(n));
        }}
        onFocus={() => { setFocused(true); setOpen(true); }}
        onBlur={(e) => { setFocused(false); commit(e.target.value); onBlurProp?.(); }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") { commit((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).blur(); setOpen(false); }
          if (e.key === "Escape") { setDraft(value); (e.target as HTMLInputElement).blur(); setOpen(false); }
        }}
      />
      <button
        onMouseDown={(e) => { e.preventDefault(); onStep(1); }}
        className="flex h-7 w-5 items-center justify-center rounded-r-md border border-l-0 border-border bg-surface font-sans text-[11px] text-muted-foreground hover:bg-surface-container hover:text-foreground"
      >+</button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-card shadow-md">
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              onMouseDown={(e) => { e.preventDefault(); onCommit(size); setDraft(size); setOpen(false); }}
              className={cn(
                "block w-full px-3 py-1 text-left font-sans text-[11px] hover:bg-surface-container whitespace-nowrap",
                size === value ? "text-primary" : "text-foreground",
              )}
            >{size}</button>
          ))}
        </div>
      )}
    </div>
  );
}
