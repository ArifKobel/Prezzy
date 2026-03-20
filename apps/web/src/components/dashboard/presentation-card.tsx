import type { Doc } from "@Prezzy/backend/convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { formatTimeAgo } from "@/components/dashboard/shell";
import { PresentationThumbnail } from "@/components/presentation-thumbnail";

export function PresentationCard({ presentation: p }: { presentation: Doc<"presentations"> }) {
  const navigate = useNavigate();
  const timeAgo = p.updatedAt ? formatTimeAgo(p.updatedAt) : p.createdAt ? formatTimeAgo(p.createdAt) : "";

  return (
    <button
      onClick={() => navigate({ to: "/editor/$presentationId", params: { presentationId: p._id } })}
      className="group flex flex-col rounded-xl bg-surface-container-lowest text-left shadow-[0_12px_40px_rgba(47,51,51,0.04)] transition-all hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(47,51,51,0.08)]"
    >
      <div className="aspect-[16/10] overflow-hidden rounded-t-xl bg-surface-container">
        <PresentationThumbnail presentationId={p._id} />
      </div>
      <div className="px-4 py-3">
        <p className="font-display text-sm font-medium text-foreground">{p.title}</p>
        {timeAgo && <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">Edited {timeAgo}</p>}
      </div>
    </button>
  );
}
