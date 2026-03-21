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
    <div className="flex items-center gap-[0.6em] rounded-xl bg-white px-[0.9em] py-[0.6em] shadow-[0_2px_12px_rgba(47,51,51,0.04)]">
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
