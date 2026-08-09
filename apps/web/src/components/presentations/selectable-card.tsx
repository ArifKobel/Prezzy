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
    <div className="group relative">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`absolute left-3 top-3 z-10 flex size-[18px] items-center justify-center border-[1.5px] transition-all duration-150 ${
          isSelected
            ? "border-primary bg-primary text-primary-foreground"
            : anySelected
              ? "border-foreground/40 bg-[#fffdf8]/80"
              : "border-foreground/40 bg-[#fffdf8]/80 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100"
        }`}
      >
        {isSelected && <Check className="size-3" strokeWidth={2.5} />}
      </button>

      <button
        onClick={() => navigate({ to: "/editor/$presentationId", params: { presentationId: p.id } })}
        className="flex h-full w-full flex-col gap-3 text-left"
      >
        <div
          className={`w-full bg-[#fffdf8] p-1.5 transition-all ${
            isSelected
              ? "ring-2 ring-primary shadow-[0_8px_20px_rgb(200_64_31_/_0.18)]"
              : "shadow-[0_1px_3px_rgb(27_30_34_/_0.15),0_8px_20px_rgb(27_30_34_/_0.12)] group-hover:scale-[1.02]"
          }`}
        >
          <div className="aspect-video overflow-hidden bg-surface-container">
            <PresentationThumbnail presentationId={p.id} theme={p.theme} />
          </div>
        </div>
        <div>
          <p className="font-display text-sm font-bold text-foreground">{p.title}</p>
          {timeAgo && <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">Edited {timeAgo}</p>}
        </div>
      </button>
    </div>
  );
}
