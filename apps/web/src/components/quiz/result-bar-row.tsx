import { cn } from "@Prezzy/ui/lib/utils";
import { QUIZ_OPTION_LABELS, alpha } from "@/lib/quiz-constants";

export function ResultBarRow({
  index,
  option,
  count,
  barWidth,
  isCorrect,
  hasCorrectOption,
  barFill,
  correctColor,
  correctColorDim,
  surfaceMuted,
  textColor,
  textSub,
}: {
  index: number;
  option: string;
  count: number;
  barWidth: number;
  isCorrect: boolean;
  hasCorrectOption: boolean;
  barFill: string;
  correctColor: string;
  correctColorDim: string;
  surfaceMuted: string;
  textColor: string;
  textSub: string;
}) {
  return (
    <div className="flex items-center gap-[0.6em]">
      <span
        className={cn(
          "grid size-[1.6em] shrink-0 place-items-center rounded-lg font-display text-[0.48em] font-bold leading-[1.7]",
        )}
        style={{
          backgroundColor: isCorrect ? correctColor : surfaceMuted,
          color: isCorrect ? "#fff" : textSub,
        }}
      >
        {QUIZ_OPTION_LABELS[index]}
      </span>

      <div className="flex flex-1 flex-col gap-[0.15em]">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "font-sans text-[0.42em] font-medium",
              isCorrect && "font-semibold",
            )}
            style={{ color: isCorrect ? correctColorDim : alpha(textColor, 0.7) }}
          >
            {option}
            {isCorrect && (
              <span className="ml-[0.5em] text-[0.85em]" style={{ color: correctColor }}>{"✓"}</span>
            )}
          </span>
          <span
            className="font-display text-[0.42em] font-bold tabular-nums"
            style={{ color: isCorrect ? correctColorDim : textSub }}
          >
            {count}
          </span>
        </div>
        <div className="h-[0.4em] w-full overflow-hidden rounded-full" style={{ backgroundColor: surfaceMuted }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.max(barWidth, 2)}%`,
              backgroundColor: barFill,
              opacity: isCorrect ? 1 : hasCorrectOption ? 0.35 : 0.7,
            }}
          />
        </div>
      </div>
    </div>
  );
}
