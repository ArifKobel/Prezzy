import { useEffect, useRef, useState } from "react";

export function QuestionCountdown({
  onDone,
  accentColor,
  textColor,
  surfaceColor,
}: {
  onDone?: () => void;
  accentColor?: string;
  textColor?: string;
  surfaceColor?: string;
}) {
  const [count, setCount] = useState(5);
  const circumference = 2 * Math.PI * 42;
  const firedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => {
        const next = c - 1;
        if (next <= 0 && !firedRef.current) {
          firedRef.current = true;
          onDone?.();
        }
        return Math.max(0, next);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onDone]);

  const pct = count / 5;
  const ringColor = accentColor || "#22574a";
  const numColor = textColor || "#231f1c";
  const trackColor = surfaceColor || "#e9e1d3";

  return (
    <div className="relative flex size-[4em] items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke={trackColor} strokeWidth="3.5" />
        <circle
          cx="50" cy="50" r="42" fill="none"
          stroke={ringColor}
          strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={`${pct * circumference} ${circumference}`}
          className="transition-[stroke-dasharray] duration-1000 ease-linear"
        />
      </svg>
      <span
        key={count}
        className="font-display text-[1.6em] font-black tabular-nums animate-in zoom-in-75 duration-300"
        style={{ color: numColor }}
      >
        {count}
      </span>
    </div>
  );
}
