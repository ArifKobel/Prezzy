import { cn } from "@Prezzy/ui/lib/utils";
import { X } from "lucide-react";

import { SLIDE_LAYOUTS } from "@/lib/slide-layouts";

export function LayoutPicker({ onPick, onClose }: {
  onPick: (layoutId: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-[2px]" onClick={onClose}>
      <div className="flex max-h-[80vh] w-[640px] flex-col rounded-xl border border-border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-3.5">
          <h3 className="font-sans text-sm font-semibold text-foreground">Choose a Layout</h3>
          <button onClick={onClose} className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-container hover:text-foreground">
            <X className="size-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2.5 overflow-y-auto p-4">
          {SLIDE_LAYOUTS.filter((l) => l.id !== "blank").map((layout) => (
            <button
              key={layout.id}
              onClick={() => onPick(layout.id)}
              className="group flex flex-col items-center gap-1.5 rounded-lg border border-border bg-surface p-2 transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded bg-surface-container">
                {layout.slots.map((slot, i) => (
                  <div
                    key={i}
                    className={cn(
                      "absolute rounded-[2px]",
                      slot.type === "heading" ? "bg-foreground/20" :
                      slot.type === "text" ? "bg-foreground/10" :
                      slot.type === "image" ? "bg-primary/15" :
                      slot.type === "shape" ? "bg-primary/25" :
                      "bg-primary/20",
                    )}
                    style={{
                      left: `${slot.x}%`, top: `${slot.y}%`,
                      width: `${slot.width}%`, height: `${slot.height}%`,
                    }}
                  />
                ))}
              </div>
              <div className="text-center">
                <p className="font-sans text-[10px] font-medium text-foreground">{layout.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
