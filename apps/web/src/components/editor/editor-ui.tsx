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

export function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-surface-container hover:text-foreground">
      {children}
    </button>
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

export function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="mb-2 flex items-center gap-1.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="font-sans text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

export function PropSlider({ label, value, onChange, min = 0, max = 100, icon }: {
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
    <section>
      {icon != null && <SectionLabel icon={icon} label={label} />}
      <div className="flex items-center gap-3">
        <input
          type="range" min={min} max={max} value={local}
          onChange={(e) => handleChange(Number(e.target.value))}
          onPointerDown={() => { dragging.current = true; }}
          onPointerUp={commit}
          onLostPointerCapture={commit}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-surface-container accent-primary"
        />
        <span className="w-8 text-right font-sans text-[11px] tabular-nums text-muted-foreground">{local}</span>
      </div>
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

  function commit(v: string) {
    const n = parseFloat(v);
    if (!isNaN(n)) {
      const clamped = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, n));
      onChange(Math.round(clamped * 100) / 100);
    }
  }

  return (
    <div className="flex flex-col gap-0.5">
      <label className="font-sans text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">{label}</label>
      <input
        type="text" inputMode="numeric" value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9.\-]/g, ""))}
        onFocus={() => setFocused(true)}
        onBlur={(e) => { setFocused(false); commit(e.target.value); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { commit((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).blur(); }
          if (e.key === "Escape") { setDraft(String(value)); (e.target as HTMLInputElement).blur(); }
          e.stopPropagation();
        }}
        className="w-full rounded-md border border-border bg-surface px-2 py-1.5 font-mono text-[11px] text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-ring"
      />
    </div>
  );
}
