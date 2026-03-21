import { cn } from "@Prezzy/ui/lib/utils";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ToolbarSelect({
  value, placeholder, options, onChange, className, renderOption, renderLabel, onHover, onHoverEnd,
}: {
  value: string;
  placeholder: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  className?: string;
  renderOption?: (opt: { label: string; value: string }, selected: boolean) => React.ReactNode;
  renderLabel?: (label: string, value: string) => React.ReactNode;
  onHover?: (v: string) => void;
  onHoverEnd?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) { setOpen(false); onHoverEnd?.(); }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onHoverEnd]);

  const matched = options.find((o) => o.value === value);
  const label = matched?.label ?? placeholder;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onMouseDown={(e) => { e.preventDefault(); if (open) onHoverEnd?.(); setOpen((o) => !o); }}
        className="flex h-7 w-full items-center justify-between gap-1 rounded-md border border-border bg-surface px-2 font-sans text-[11px] text-foreground hover:bg-surface-container"
      >
        <span className="truncate">
          {renderLabel ? renderLabel(label, value) : label}
        </span>
        <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 max-h-72 min-w-full overflow-y-auto overflow-x-hidden rounded-md border border-border bg-card shadow-md"
          onMouseLeave={() => onHoverEnd?.()}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onMouseDown={(e) => { e.preventDefault(); onHoverEnd?.(); onChange(opt.value); setOpen(false); }}
              onMouseEnter={() => onHover?.(opt.value)}
              className={cn(
                "block w-full px-3 text-left hover:bg-surface-container whitespace-nowrap",
                opt.value === value ? "text-primary" : "text-foreground",
                !renderOption && "py-1.5 font-sans text-[11px]",
              )}
            >
              {renderOption ? renderOption(opt, opt.value === value) : opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
