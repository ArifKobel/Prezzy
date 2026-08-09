import type { Presentation } from "@Prezzy/shared";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Play } from "lucide-react";
import { formatTimeAgo } from "@/components/dashboard/shell";
import { PresentationThumbnail } from "@/components/presentation-thumbnail";

export function ContinueCard({ presentation: p }: { presentation: Presentation }) {
  const navigate = useNavigate();
  const timeAgo = formatTimeAgo(p.updatedAt || p.createdAt);

  function openEditor() {
    navigate({ to: "/editor/$presentationId", params: { presentationId: p.id } });
  }

  return (
    <div className="flex items-center gap-10 bg-[#1b1e22] p-7 shadow-[0_14px_40px_rgb(27_30_34_/_0.25)]">
      <button
        onClick={openEditor}
        className="group w-[42%] max-w-[440px] shrink-0 bg-[#fffdf8] p-2 shadow-[0_4px_16px_rgb(0_0_0_/_0.45)] transition-transform hover:scale-[1.01]"
      >
        <div className="aspect-video overflow-hidden bg-surface-container">
          <PresentationThumbnail presentationId={p.id} theme={p.theme} />
        </div>
      </button>

      <div className="flex min-w-0 flex-1 flex-col items-start">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#f6f3ed]/50">
          Edited {timeAgo}
        </p>
        <h3 className="mt-1.5 max-w-full truncate font-display text-3xl font-extrabold tracking-tight text-[#f6f3ed]">
          {p.title}
        </h3>

        <div className="mt-7 flex items-center gap-2">
          <button
            onClick={openEditor}
            className="flex items-center gap-2 bg-primary px-5 py-2.5 font-sans text-xs font-bold text-primary-foreground transition-colors hover:bg-primary-dim"
          >
            Continue editing <ArrowRight className="size-3.5" />
          </button>
          <button
            onClick={() => navigate({ to: `/present/${p.id}` })}
            className="flex items-center gap-2 px-4 py-2.5 font-sans text-xs font-semibold text-[#f6f3ed]/70 transition-colors hover:bg-[#f6f3ed]/10 hover:text-[#f6f3ed]"
          >
            <Play className="size-3 fill-current" /> Present
          </button>
        </div>

        {p.joinCode && (
          <p className="mt-6 font-sans text-xs text-[#f6f3ed]/50">
            Join code
            <span className="ml-2 font-mono text-sm font-semibold tracking-[0.15em] text-[#f6f3ed]">{p.joinCode}</span>
          </p>
        )}
      </div>
    </div>
  );
}
