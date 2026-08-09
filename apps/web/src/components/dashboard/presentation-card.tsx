import type { Presentation } from "@Prezzy/shared";
import { useNavigate } from "@tanstack/react-router";
import { formatTimeAgo } from "@/components/dashboard/shell";
import { PresentationThumbnail } from "@/components/presentation-thumbnail";

export function PresentationCard({ presentation: p }: { presentation: Presentation }) {
  const navigate = useNavigate();
  const timeAgo = p.updatedAt ? formatTimeAgo(p.updatedAt) : p.createdAt ? formatTimeAgo(p.createdAt) : "";

  return (
    <button
      onClick={() => navigate({ to: "/editor/$presentationId", params: { presentationId: p.id } })}
      className="group flex h-full flex-col gap-3 text-left"
    >
      <div className="w-full bg-[#fffdf8] p-1.5 shadow-[0_1px_3px_rgb(27_30_34_/_0.15),0_8px_20px_rgb(27_30_34_/_0.12)] transition-transform group-hover:scale-[1.02]">
        <div className="aspect-video overflow-hidden bg-surface-container">
          <PresentationThumbnail presentationId={p.id} theme={p.theme} />
        </div>
      </div>
      <div>
        <p className="font-display text-sm font-bold text-foreground">{p.title}</p>
        {timeAgo && <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">Edited {timeAgo}</p>}
      </div>
    </button>
  );
}
