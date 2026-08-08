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
    <div className="flex items-center gap-8 rounded-2xl bg-surface-container-lowest p-6 shadow-[0_12px_40px_rgb(35_31_28_/_0.05)]">
      <button
        onClick={openEditor}
        className="group w-[46%] max-w-[480px] shrink-0 overflow-hidden rounded-xl bg-surface-container shadow-[0_4px_16px_rgb(35_31_28_/_0.06)] transition-all hover:shadow-[0_12px_32px_rgb(35_31_28_/_0.12)]"
      >
        <div className="aspect-[16/10]">
          <PresentationThumbnail presentationId={p.id} />
        </div>
      </button>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="font-sans text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60">
          Edited {timeAgo}
        </p>
        <h3 className="mt-1.5 truncate font-display text-2xl font-semibold tracking-tight text-foreground">
          {p.title}
        </h3>

        {p.joinCode && (
          <div className="mt-5 flex items-center justify-between gap-2.5 rounded-lg bg-surface-container px-3.5 py-2.5">
            <span className="font-sans text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
              Join code
            </span>
            <span className="font-mono text-sm font-semibold tracking-[0.12em] text-foreground">
              {p.joinCode}
            </span>
          </div>
        )}

        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={openEditor}
            className="flex items-center gap-2 rounded-md bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-dim))] px-5 py-2.5 font-sans text-xs font-medium text-primary-foreground shadow-[0_4px_12px_rgb(34_87_74_/_0.25)] transition-all hover:scale-[1.02] active:scale-[0.99]"
          >
            Continue editing <ArrowRight className="size-3.5" />
          </button>
          <button
            onClick={() => navigate({ to: `/present/${p.id}` })}
            className="flex items-center gap-2 rounded-md px-4 py-2.5 font-sans text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-container hover:text-foreground"
          >
            <Play className="size-3 fill-current" /> Present
          </button>
        </div>
      </div>
    </div>
  );
}
