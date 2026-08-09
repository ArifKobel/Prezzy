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
}: {
  elements: SlideElement[];
  theme?: PresentationTheme | null;
  responses?: ElementResponses;
  leaderboard?: LeaderboardEntry[];
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
