import { timerColor, timerTextColor } from "@/lib/quiz-constants";

export function AnswerTimer({
  pct,
  secs,
  accentColor,
  trackColor,
}: {
  pct: number;
  secs: number;
  accentColor?: string;
  trackColor: string;
}) {
  return (
    <div className="relative flex size-[6em] items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke={trackColor} strokeWidth="3.5" />
        <circle
          cx="50" cy="50" r="42" fill="none"
          strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={`${pct * 263.9} 263.9`}
          className="transition-[stroke-dasharray] duration-200"
          style={{ stroke: timerColor(pct, accentColor) }}
        />
      </svg>
      <span
        className="font-display text-[1.6em] font-black tabular-nums tracking-tight"
        style={{ color: timerTextColor(pct, accentColor) }}
      >
        {secs}
      </span>
    </div>
  );
}
