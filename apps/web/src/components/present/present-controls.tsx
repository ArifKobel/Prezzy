import { cn } from "@Prezzy/ui/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Maximize,
  Minimize,
  X,
} from "lucide-react";

export function PresentControls({
  visible,
  slideIndex,
  totalSlides,
  quizStepLabel,
  isFirst,
  isLast,
  isFullscreen,
  onExit,
  onPrev,
  onNext,
  onToggleFullscreen,
}: {
  visible: boolean;
  slideIndex: number;
  totalSlides: number;
  quizStepLabel: string | null;
  isFirst: boolean;
  isLast: boolean;
  isFullscreen: boolean;
  onExit: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleFullscreen: () => void;
}) {
  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-4 transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onExit}
        className="flex items-center gap-2 rounded-lg bg-black/60 px-3 py-2 font-sans text-xs text-white/70 backdrop-blur-md transition-colors hover:bg-black/80 hover:text-white"
      >
        <X className="size-3.5" />
        Exit
      </button>

      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className="flex size-8 items-center justify-center rounded-lg bg-black/60 text-white/70 backdrop-blur-md transition-colors hover:bg-black/80 hover:text-white disabled:opacity-30"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex flex-col items-center">
          <span className="min-w-[60px] text-center font-sans text-xs tabular-nums text-white/70">
            {slideIndex + 1} / {totalSlides}
          </span>
          {quizStepLabel && (
            <span className="text-center font-sans text-[10px] font-medium text-white/40">
              {quizStepLabel}
            </span>
          )}
        </div>
        <button
          onClick={onNext}
          disabled={isLast}
          className="flex size-8 items-center justify-center rounded-lg bg-black/60 text-white/70 backdrop-blur-md transition-colors hover:bg-black/80 hover:text-white disabled:opacity-30"
        >
          <ArrowRight className="size-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleFullscreen}
          className="flex size-8 items-center justify-center rounded-lg bg-black/60 text-white/70 backdrop-blur-md transition-colors hover:bg-black/80 hover:text-white"
        >
          {isFullscreen ? (
            <Minimize className="size-3.5" />
          ) : (
            <Maximize className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
