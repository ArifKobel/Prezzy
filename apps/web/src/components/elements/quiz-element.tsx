import type { ResolvedSlideTheme } from "@Prezzy/shared";
import { cn } from "@Prezzy/ui/lib/utils";
import {
  QUIZ_OPTION_LABELS,
  deriveOptionAccents,
  alpha,
  resolveElementStyle,
} from "@/lib/quiz-constants";
import type { SlideElement } from "@/components/slide-canvas";

export function QuizElement({
  el,
  theme,
}: {
  el: SlideElement;
  theme?: ResolvedSlideTheme | null;
}) {
  const question = el.props?.question || "Your question here";
  const options: string[] = el.props?.options ?? ["Option A", "Option B"];
  const correctOption = el.props?.correctOption as number | undefined;

  const s = resolveElementStyle(el.props, theme);
  const bg = s.backgroundColor;
  const text = s.textColor || "#231f1c";
  const optionAccents = deriveOptionAccents(s.accentColor);
  const correctColor = s.accentColor ? optionAccents[1].bg : "#4e8f6f";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden px-[6%] py-[5%]" style={{ backgroundColor: bg, borderRadius: "var(--slide-radius)" }}>
      <div className="mb-[5%] text-center text-[1.6em] font-bold [font-family:var(--slide-font-heading)] leading-tight tracking-tight" style={{ color: text }} dangerouslySetInnerHTML={{ __html: question }} />
      <div className="flex flex-1 flex-col justify-center gap-[0.5em]">
        {options.map((opt, i) => {
          const isCorrect = correctOption === i;
          const optAccent = optionAccents[i % optionAccents.length];
          return (
            <div
              key={i}
              className={cn(
                "flex items-center gap-[0.6em] rounded-[var(--slide-radius)] px-[0.9em] py-[0.55em]",
                isCorrect
                  ? ""
                  : "bg-[var(--slide-surface)]",
              )}
              style={isCorrect ? { backgroundColor: alpha(correctColor, 0.1) } : undefined}
            >
              <span
                className="grid size-[1.5em] shrink-0 place-items-center rounded-[calc(var(--slide-radius)*0.6)] text-[0.48em] font-bold leading-[1.7]"
                style={{
                  backgroundColor: isCorrect ? correctColor : optAccent.bg,
                  color: optAccent.fg,
                }}
              >
                {QUIZ_OPTION_LABELS[i]}
              </span>
              <span
                className={cn(
                  "flex-1 font-sans text-[0.5em] font-medium",
                  isCorrect && "font-semibold",
                )}
                style={{ color: isCorrect ? alpha(correctColor, 0.85) : text }}
              >
                {opt}
              </span>
              {isCorrect && (
                <span className="text-[0.5em] font-bold" style={{ color: correctColor }}>{"✓"}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
