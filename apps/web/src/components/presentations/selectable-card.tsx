import type { Presentation } from "@Prezzy/shared";
import { useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { formatTimeAgo } from "@/components/dashboard/shell";
import { PresentationThumbnail } from "@/components/presentation-thumbnail";

export function SelectableCard({ presentation: p, isSelected, anySelected, onToggle }: {
  presentation: Presentation;
  isSelected: boolean;
  anySelected: boolean;
  onToggle: () => void;
}) {
  const navigate = useNavigate();
  const timeAgo = p.updatedAt ? formatTimeAgo(p.updatedAt) : p.createdAt ? formatTimeAgo(p.createdAt) : "";

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest transition-all duration-200 ${
        isSelected
          ? "ring-2 ring-primary shadow-[0_12px_40px_rgba(78,96,115,0.12)]"
          : "shadow-[0_12px_40px_rgba(47,51,51,0.04)] hover:shadow-[0_12px_40px_rgba(47,51,51,0.1)]"
      }`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`absolute left-3 top-3 z-10 flex size-[18px] items-center justify-center rounded-[4px] border-[1.5px] backdrop-blur-sm transition-all duration-150 ${
          isSelected
            ? "border-primary bg-primary text-primary-foreground"
            : anySelected
              ? "border-white/60 bg-white/40"
              : "border-white/60 bg-white/40 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100"
        }`}
      >
        {isSelected && <Check className="size-3" strokeWidth={2.5} />}
      </button>

      {isSelected && <div className="pointer-events-none absolute inset-0 z-[5] rounded-xl bg-primary/[0.03]" />}

      <button
        onClick={() => navigate({ to: "/editor/$presentationId", params: { presentationId: p.id } })}
        className="flex flex-1 flex-col text-left"
      >
        <div className="aspect-[16/10] overflow-hidden bg-surface-container transition-colors group-hover:bg-surface-container-high">
          <PresentationThumbnail presentationId={p.id} />
        </div>
        <div className="px-4 py-3.5">
          <p className="font-display text-[13px] font-semibold leading-snug text-foreground">{p.title}</p>
          {timeAgo && <p className="mt-1 font-sans text-[11px] text-muted-foreground/70">Edited {timeAgo}</p>}
        </div>
      </button>
    </div>
  );
}
