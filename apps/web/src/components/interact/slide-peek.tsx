import type { LeaderboardEntry, PresentationTheme, SlideElement } from "@Prezzy/shared";
import { Maximize2, X } from "lucide-react";
import { useState } from "react";
import { LiveDot } from "@/components/interact/live-dot";
import { SlideCanvas, type ElementResponses } from "@/components/slide-canvas";

export function SlidePeek({
  elements,
  theme,
  responses,
  leaderboard,
  variant = "panel",
}: {
  elements: SlideElement[];
  theme?: PresentationTheme | null;
  responses?: ElementResponses;
  leaderboard?: LeaderboardEntry[];
  variant?: "panel" | "bar";
}) {
  const [open, setOpen] = useState(false);

  const canvas = (
    <SlideCanvas
      elements={elements}
      scaleToFit
      theme={theme}
      responses={responses}
      leaderboard={leaderboard}
      className="h-full w-full"
    />
  );

  return (
    <>
      {variant === "panel" ? (
        <div className="w-full bg-[#1b1e22] p-3 shadow-[0_10px_30px_rgb(27_30_34_/_0.3)]">
          <div className="mb-2 flex items-center justify-between">
            <LiveDot />
            <span className="flex items-center gap-1 font-sans text-[10px] font-bold uppercase tracking-wider text-[#f6f3ed]/50">
              <Maximize2 className="size-3" /> Enlarge
            </span>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="w-full bg-[#fffdf8] p-1 text-left shadow-[0_4px_16px_rgb(0_0_0_/_0.4)] transition-transform active:scale-[0.98]"
          >
            <div className="pointer-events-none aspect-video w-full overflow-hidden bg-surface-container">
              {canvas}
            </div>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 bg-[#1b1e22] p-2 pr-3.5 text-left shadow-[0_8px_24px_rgb(27_30_34_/_0.3)] transition-transform active:scale-[0.99]"
        >
          <div className="w-24 shrink-0 bg-[#fffdf8] p-0.5">
            <div className="pointer-events-none aspect-video w-full overflow-hidden bg-surface-container">
              {canvas}
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <LiveDot />
            <span className="font-sans text-[11px] font-semibold text-[#f6f3ed]/60">
              Tap to view the slide
            </span>
          </div>
          <Maximize2 className="size-4 shrink-0 text-[#f6f3ed]/50" />
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#14171a]/95 p-3"
          onClick={() => setOpen(false)}
        >
          <button
            className="absolute right-4 top-4 flex size-9 items-center justify-center text-[#f6f3ed]/80 transition-colors hover:text-[#f6f3ed]"
            title="Close"
          >
            <X className="size-5" />
          </button>
          <div className="w-full max-w-5xl bg-[#fffdf8] p-2 shadow-[0_20px_60px_rgb(0_0_0_/_0.5)]">
            <div className="aspect-video w-full overflow-hidden">{canvas}</div>
          </div>
        </div>
      )}
    </>
  );
}
