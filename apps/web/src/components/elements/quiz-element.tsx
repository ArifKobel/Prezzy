import { cn } from "@Prezzy/ui/lib/utils";
import {
  QUIZ_OPTION_LABELS,
  deriveOptionAccents,
  alpha,
  resolveElementStyle,
  type PresentationTheme,
} from "@/lib/quiz-constants";
import type { SlideElement } from "@/components/slide-canvas";

export function QuizElement({
  el,
  theme,
}: {
  el: SlideElement;
  theme?: PresentationTheme | null;
}) {
  const question = el.props?.question || "Your question here";
  const options: string[] = el.props?.options ?? ["Option A", "Option B"];
  const correctOption = el.props?.correctOption as number | undefined;

  const s = resolveElementStyle(el.props, theme);
  const bg = s.backgroundColor || "#faf9f8";
  const text = s.textColor || "#2f3333";
  const textMuted = alpha(text, 0.3);
  const textFaint = alpha(text, 0.25);
  const optionAccents = deriveOptionAccents(s.accentColor);
  const correctColor = s.accentColor ? optionAccents[1].bg : "#6b8e7b";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl px-[6%] py-[5%]" style={{ backgroundColor: bg }}>
      <p className="mb-[3%] text-center font-sans text-[0.3em] font-medium uppercase tracking-[0.1em]" style={{ color: textMuted }}>
        Quiz
      </p>
      <div className="mb-[5%] text-center font-display text-[1.1em] font-bold leading-tight tracking-tight" style={{ color: text }} dangerouslySetInnerHTML={{ __html: question }} />
      <div className="flex flex-1 flex-col justify-center gap-[0.5em]">
        {options.map((opt, i) => {
          const isCorrect = correctOption === i;
          const optAccent = optionAccents[i % optionAccents.length];
          return (
            <div
              key={i}
              className={cn(
                "flex items-center gap-[0.6em] rounded-xl px-[0.9em] py-[0.55em]",
                isCorrect
                  ? ""
                  : "bg-white shadow-[0_2px_12px_rgba(47,51,51,0.04)]",
              )}
              style={isCorrect ? { backgroundColor: alpha(correctColor, 0.1) } : undefined}
            >
              <span
                className="grid size-[1.5em] shrink-0 place-items-center rounded-lg font-display text-[0.48em] font-bold leading-[1.7]"
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
      <div className="mt-[4%] flex items-center justify-center gap-[0.5em]">
        <span className="font-sans text-[0.28em]" style={{ color: textFaint }}>
          {el.props?.timerSeconds ?? 20}s
        </span>
        {el.props?.timeScoring !== false && (
          <span className="font-sans text-[0.28em]" style={{ color: textFaint }}>
            · speed bonus
          </span>
        )}
      </div>
    </div>
  );
}
