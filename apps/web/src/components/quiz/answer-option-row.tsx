import { QUIZ_OPTION_LABELS } from "@/lib/quiz-constants";

export function AnswerOptionRow({
  index,
  option,
  accentBg,
  accentFg,
  textColor,
}: {
  index: number;
  option: string;
  accentBg: string;
  accentFg: string;
  textColor: string;
}) {
  return (
    <div className="flex items-center gap-[0.6em] rounded-[var(--slide-radius)] bg-[var(--slide-surface)] px-[0.9em] py-[0.6em]">
      <span
        className="grid size-[1.6em] shrink-0 place-items-center rounded-lg font-display text-[0.5em] font-bold leading-[1.7]"
        style={{ backgroundColor: accentBg, color: accentFg }}
      >
        {QUIZ_OPTION_LABELS[index]}
      </span>
      <span className="flex-1 font-sans text-[0.5em] font-medium" style={{ color: textColor }}>
        {option}
      </span>
    </div>
  );
}
