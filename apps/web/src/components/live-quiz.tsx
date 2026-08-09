import { useEffect, useRef, useState } from "react";
import { useResponses } from "@/lib/api/interact";
import {
  deriveOptionAccents,
  deriveBarFills,
  alpha,
  type ElementStyle,
} from "@/lib/quiz-constants";
import { AnswerOptionRow } from "@/components/quiz/answer-option-row";
import { AnswerTimer } from "@/components/quiz/answer-timer";
import { QuestionCountdown } from "@/components/quiz/question-countdown";
import { QuizLobby } from "@/components/quiz/quiz-lobby";
import { ResultBarRow } from "@/components/quiz/result-bar-row";

export type QuizPhase = "lobby" | "question" | "answering" | "results";

interface LiveQuizProps {
  elementId: string;
  question: string;
  options: string[];
  correctOption?: number;
  timerSeconds: number;
  timeScoring: boolean;
  phase: QuizPhase;
  startedAt: number;
  participantCount?: number;
  onTimerEnd?: () => void;
  onQuestionEnd?: () => void;
  style?: ElementStyle;
}

export function LiveQuizElement({
  elementId,
  question,
  options,
  correctOption,
  timerSeconds,
  timeScoring,
  phase,
  startedAt,
  participantCount,
  onTimerEnd,
  onQuestionEnd,
  style,
}: LiveQuizProps) {
  const { data: responses } = useResponses(elementId);
  const responseCount = responses?.length ?? 0;

  const [remaining, setRemaining] = useState(timerSeconds);
  const timedOutRef = useRef(false);

  const accent = style?.accentColor;
  const bg = style?.backgroundColor || "#f6f2ea";
  const text = style?.textColor || "#231f1c";
  const textMuted = alpha(text, 0.3);
  const textSub = alpha(text, 0.5);
  const textFaint = alpha(text, 0.2);
  const surfaceMuted = alpha(text, 0.06);
  const optionAccents = deriveOptionAccents(accent);
  const barFills = deriveBarFills(accent);
  const correctColor = accent ? optionAccents[1].bg : "#4e8f6f";
  const correctColorDim = alpha(correctColor, 0.7);

  useEffect(() => {
    if (phase !== "answering" || startedAt <= 0) {
      timedOutRef.current = false;
      setRemaining(timerSeconds);
      return;
    }
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const left = Math.max(0, timerSeconds - elapsed);
      setRemaining(left);
      if (left <= 0 && !timedOutRef.current) {
        timedOutRef.current = true;
        onTimerEnd?.();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [phase, startedAt, timerSeconds, onTimerEnd]);

  if (phase === "lobby") {
    return (
      <QuizLobby
        question={question}
        participantCount={participantCount}
        bg={bg}
        text={text}
        textMuted={textMuted}
        textSub={textSub}
        textFaint={textFaint}
        surfaceMuted={surfaceMuted}
        dotColor={correctColor}
      />
    );
  }

  if (phase === "question") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center" style={{ backgroundColor: bg }}>
        <QuestionCountdown onDone={onQuestionEnd} accentColor={accent} textColor={text} surfaceColor={surfaceMuted} />

        <h2 className="mt-[5%] max-w-[70%] text-center [font-family:var(--slide-font-heading)] text-[1.8em] font-bold leading-[1.1] tracking-tight" style={{ color: text }} dangerouslySetInnerHTML={{ __html: question }} />

        <p className="mt-[5%] font-sans text-[0.36em] font-medium" style={{ color: textMuted }}>
          Answer on your device
        </p>
      </div>
    );
  }

  if (phase === "answering") {
    const pct = remaining / timerSeconds;
    const secs = Math.ceil(remaining);

    return (
      <div className="flex h-full w-full" style={{ backgroundColor: bg }}>
        <div className="flex w-[38%] flex-col items-center justify-center">
          <AnswerTimer pct={pct} secs={secs} accentColor={accent} trackColor={surfaceMuted} />

          <div className="mt-4 flex items-center justify-center rounded-full px-[12px] py-[4px]" style={{ backgroundColor: surfaceMuted }}>
            <span className="font-sans text-[10px] font-medium leading-none" style={{ color: textSub }}>
              {responseCount} answer{responseCount !== 1 ? "s" : ""}
            </span>
          </div>

          {timeScoring && (
            <p className="mt-3 font-sans text-[9px]" style={{ color: textFaint }}>
              Faster = more points
            </p>
          )}
        </div>

        <div className="flex w-[62%] flex-col justify-center pr-[6%]">
          <h2 className="mb-[5%] [font-family:var(--slide-font-heading)] text-[1.1em] font-bold leading-[1.2] tracking-tight" style={{ color: text }} dangerouslySetInnerHTML={{ __html: question }} />

          <div className="flex flex-col gap-[0.5em]">
            {options.map((opt, i) => {
              const optAccent = optionAccents[i % optionAccents.length];
              return (
                <AnswerOptionRow
                  key={i}
                  index={i}
                  option={opt}
                  accentBg={optAccent.bg}
                  accentFg={optAccent.fg}
                  textColor={text}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const total = responseCount;
  const counts = options.map(
    (opt) => responses?.filter((r) => r.value === opt).length ?? 0,
  );
  const maxCount = Math.max(...counts, 1);

  return (
    <div className="flex h-full w-full flex-col px-[6%] py-[5%]" style={{ backgroundColor: bg }}>
      <div className="mb-[5%] flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-1 font-sans text-[0.3em] font-medium uppercase tracking-[0.1em]" style={{ color: textMuted }}>
            Results
          </p>
          <h2 className="[font-family:var(--slide-font-heading)] text-[1.1em] font-bold leading-[1.15] tracking-tight" style={{ color: text }} dangerouslySetInnerHTML={{ __html: question }} />
        </div>
        <div className="ml-4 mt-1 flex shrink-0 items-center justify-center rounded-full px-[10px] py-[3px]" style={{ backgroundColor: surfaceMuted }}>
          <span className="font-sans text-[10px] font-medium leading-none" style={{ color: textSub }}>
            {total} answer{total !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-[0.7em]">
        {options.map((opt, i) => {
          const isCorrect = correctOption === i;
          const count = counts[i];
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const barFill = isCorrect ? correctColor : barFills[i % barFills.length];

          return (
            <ResultBarRow
              key={i}
              index={i}
              option={opt}
              count={count}
              barWidth={barWidth}
              isCorrect={isCorrect}
              hasCorrectOption={correctOption != null}
              barFill={barFill}
              correctColor={correctColor}
              correctColorDim={correctColorDim}
              surfaceMuted={surfaceMuted}
              textColor={text}
              textSub={textSub}
            />
          );
        })}
      </div>
    </div>
  );
}
