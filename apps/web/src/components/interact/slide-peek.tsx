import type { PresentationTheme, SlideElement } from "@Prezzy/shared";
import { Maximize2, X } from "lucide-react";
import { useState } from "react";
import { LiveDot } from "@/components/interact/live-dot";
import { SlideCanvas } from "@/components/slide-canvas";

export function SlidePeek({
  elements,
  theme,
}: {
  elements: SlideElement[];
  theme?: PresentationTheme | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex w-full flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <LiveDot />
          <span className="flex items-center gap-1 font-sans text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Maximize2 className="size-3" /> Tap to enlarge
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="w-full bg-[#fffdf8] p-1.5 text-left shadow-[0_1px_3px_rgb(27_30_34_/_0.15),0_8px_20px_rgb(27_30_34_/_0.12)] transition-transform active:scale-[0.98]"
        >
          <div className="pointer-events-none aspect-video w-full overflow-hidden bg-surface-container">
            <SlideCanvas elements={elements} scaleToFit theme={theme} className="h-full w-full" />
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
            <div className="aspect-video w-full overflow-hidden">
              <SlideCanvas elements={elements} scaleToFit theme={theme} className="h-full w-full" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
