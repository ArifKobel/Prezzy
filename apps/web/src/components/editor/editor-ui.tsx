import { cn } from "@Prezzy/ui/lib/utils";
import {
  ArrowRight,
  Circle,
  Diamond,
  Hexagon,
  Square,
  Star,
  Triangle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ToolbarBtn({ icon, label, onClick, disabled, className }: {
  icon: React.ReactNode; label: string; onClick?: () => void; disabled?: boolean; className?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-sans text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-all hover:bg-surface-container hover:text-foreground disabled:pointer-events-none disabled:opacity-40", className)}
    >{icon}{label}</button>
  );
}

export function TabBtn({ label, active, onClick, className }: { label: string; active?: boolean; onClick?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn("px-3 py-2 font-sans text-[10px] font-medium uppercase tracking-widest transition-colors", active ? "border-b-2 border-primary text-foreground" : "border-b-2 border-transparent text-muted-foreground hover:text-foreground", className)}>
      {label}
    </button>
  );
}

export function ElementTile({ icon, label, onClick, disabled }: {
  icon: React.ReactNode; label: string; onClick?: () => void; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl bg-surface-container p-4 text-center transition-all hover:scale-[1.02] hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="text-foreground">{icon}</span>
      <span className="font-sans text-[9px] font-medium uppercase tracking-widest text-muted-foreground">{label}</span>
    </button>
  );
}

export function InteractiveCard({ icon, title, subtitle, onClick, disabled }: { icon: React.ReactNode; title: string; subtitle: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cn("flex w-full items-center gap-3 rounded-xl bg-surface-container p-3 text-left transition-all", disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:scale-[1.01] hover:bg-surface-container-high")}>
      <div className="flex shrink-0 items-center justify-center rounded-lg bg-tertiary-container p-2">
        <span className="text-foreground">{icon}</span>
      </div>
      <div>
        <p className="font-sans text-xs font-medium text-foreground">{title}</p>
        <p className="font-sans text-[10px] text-muted-foreground">{subtitle}</p>
      </div>
    </button>
  );
}

export function ShapeIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case "circle":    return <Circle className={className} />;
    case "triangle":  return <Triangle className={className} />;
    case "diamond":   return <Diamond className={className} />;
    case "star":      return <Star className={className} />;
    case "hexagon":   return <Hexagon className={className} />;
    case "arrow-right": return <ArrowRight className={className} />;
    case "pill":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect x="1" y="6" width="22" height="12" rx="6" />
        </svg>
      );
    default: return <Square className={className} />;
  }
}

export function SectionLabel({ label }: { icon?: React.ReactNode; label: string }) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <span className="font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">{label}</span>
    </div>
  );
}

export function PropSlider({ label, value, onChange, min = 0, max = 100 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; icon?: React.ReactNode;
}) {
  const [local, setLocal] = useState(value);
  const dragging = useRef(false);
  const localRef = useRef(local);

  useEffect(() => {
    if (!dragging.current) setLocal(value);
  }, [value]);

  function handleChange(v: number) {
    setLocal(v);
    localRef.current = v;
  }

  function commit() {
    dragging.current = false;
    onChange(localRef.current);
  }

  return (
    <section className="flex items-center gap-2">
      <span className="w-[72px] shrink-0 truncate font-sans text-[10px] text-muted-foreground" title={label}>{label}</span>
      <input
        type="range" min={min} max={max} value={local}
        onChange={(e) => handleChange(Number(e.target.value))}
        onPointerDown={() => { dragging.current = true; }}
        onPointerUp={commit}
        onLostPointerCapture={commit}
        className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-surface-container-high accent-primary"
      />
      <span className="w-7 text-right font-sans text-[10px] tabular-nums text-muted-foreground">{local}</span>
    </section>
  );
}

export function PropNumberInput({ label, value, onChange, min, max }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  function clamp(n: number) {
    return Math.max(min ?? -Infinity, Math.min(max ?? Infinity, n));
  }

  function commit(v: string) {
    const n = parseFloat(v);
    if (!isNaN(n)) onChange(Math.round(clamp(n) * 100) / 100);
  }

  function stepBy(delta: number) {
    const n = clamp((parseFloat(draft) || 0) + delta);
    setDraft(String(n));
    onChange(n);
  }

  return (
    <label className="flex cursor-text items-center border border-transparent bg-surface-container/70 pl-2 transition-colors focus-within:border-ring hover:border-border">
      <span className="w-4 shrink-0 select-none font-sans text-[10px] text-muted-foreground/60">{label}</span>
      <input
        type="text" inputMode="numeric" value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9.\-]/g, ""))}
        onFocus={(e) => { setFocused(true); e.target.select(); }}
        onBlur={(e) => { setFocused(false); commit(e.target.value); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { commit((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).blur(); }
          if (e.key === "Escape") { setDraft(String(value)); (e.target as HTMLInputElement).blur(); }
          if (e.key === "ArrowUp") { e.preventDefault(); stepBy(e.shiftKey ? 10 : 1); }
          if (e.key === "ArrowDown") { e.preventDefault(); stepBy(e.shiftKey ? -10 : -1); }
          e.stopPropagation();
        }}
        className="w-full min-w-0 bg-transparent py-1.5 pr-2 font-sans text-[11px] tabular-nums text-foreground outline-none"
      />
    </label>
  );
}
