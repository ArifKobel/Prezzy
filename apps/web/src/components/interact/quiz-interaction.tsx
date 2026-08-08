import type { AudienceResponse, SlideElement } from "@Prezzy/shared";
import { cn } from "@Prezzy/ui/lib/utils";
import { Check, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useResponses } from "@/lib/api/interact";
import {
  QUIZ_OPTION_LABELS,
  deriveOptionAccents,
  timerColor,
  timerTextColor,
  alpha,
  resolveElementStyle,
  type PresentationTheme,
} from "@/lib/quiz-constants";

export function QuizInteraction({
  element,
  participantId,
  participantName,
  submitResponse,
  quizState,
  theme,
}: {
  element: SlideElement;
  participantId: string;
  participantName: string;
  submitResponse: (args: {
    elementId: string;
    participantId: string;
    participantName: string;
    value: string;
  }) => Promise<AudienceResponse>;
  quizState: { elementId: string; phase: string; startedAt: number } | null;
  theme?: PresentationTheme | null;
}) {
  const question = element.props?.question || "Question";
  const options: string[] = element.props?.options ?? [];
  const correctOption: number | undefined = element.props?.correctOption;
  const timerSeconds: number = element.props?.timerSeconds ?? 20;
  const elementId = element.id;

  const s = resolveElementStyle(element.props, theme);
  const accentHex = s.accentColor || "#22574a";
  const text = s.textColor || "#231f1c";
  const textMuted = alpha(text, 0.4);
  const textFaint = alpha(text, 0.35);
  const surfaceMuted = alpha(text, 0.06);
  const optionAccents = deriveOptionAccents(s.accentColor);
  const correctColor = s.accentColor ? optionAccents[1].bg : "#4e8f6f";

  const phase = quizState?.elementId === element.id ? quizState.phase : null;
  const startedAt = quizState?.startedAt ?? 0;

  const { data: responses } = useResponses(elementId);
  const existingResponse = responses?.find(
    (r) => r.participantId === participantId,
  );

  const [voted, setVoted] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [remaining, setRemaining] = useState(timerSeconds);

  useEffect(() => {
    if (existingResponse && !voted) {
      setVoted(existingResponse.value);
    }
  }, [existingResponse, voted]);

  useEffect(() => {
    if (phase === "question" || phase === null) {
      setVoted(null);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "answering" || startedAt <= 0) return;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      setRemaining(Math.max(0, timerSeconds - elapsed));
    }, 250);
    return () => clearInterval(interval);
  }, [phase, startedAt, timerSeconds]);

  const canAnswer = phase === "answering" && !voted && remaining > 0;
  const isResults = phase === "results";
  const correctAnswer =
    correctOption != null ? options[correctOption] : undefined;
  const isCorrect = voted != null && voted === correctAnswer;
  const revealed = isResults && correctAnswer != null;

  async function handleVote(option: string) {
    if (!canAnswer) return;
    setSubmitting(true);
    try {
      await submitResponse({
        elementId,
        participantId,
        participantName,
        value: option,
      });
      setVoted(option);
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === null || phase === "lobby") {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <p className="font-sans text-xs font-medium uppercase tracking-[0.1em]" style={{ color: alpha(accentHex, 0.5) }}>
          Quiz
        </p>
        <h2 className="text-center font-display text-xl font-bold" style={{ color: text }}>
          {question}
        </h2>
        <p className="font-sans text-sm" style={{ color: textMuted }}>
          Waiting for the presenter to start...
        </p>
        <Loader2 className="size-5 animate-spin" style={{ color: alpha(accentHex, 0.3) }} />
      </div>
    );
  }

  if (phase === "question") {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <p className="font-sans text-xs font-medium uppercase tracking-[0.1em]" style={{ color: alpha(accentHex, 0.5) }}>
          Quiz
        </p>
        <h2 className="text-center font-display text-xl font-bold" style={{ color: text }}>
          {question}
        </h2>
        <p className="font-sans text-sm" style={{ color: textMuted }}>
          Get ready — options are coming!
        </p>
        <Loader2 className="size-5 animate-spin" style={{ color: alpha(accentHex, 0.3) }} />
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5">
      <p className="font-sans text-xs font-medium uppercase tracking-[0.1em]" style={{ color: alpha(accentHex, 0.5) }}>
        Quiz
      </p>

      <h2 className="text-center font-display text-lg font-bold" style={{ color: text }}>
        {question}
      </h2>

      {phase === "answering" && (
        <div className="flex w-full flex-col items-center gap-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: surfaceMuted }}>
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${(remaining / timerSeconds) * 100}%`,
                backgroundColor: timerColor(remaining / timerSeconds, s.accentColor),
              }}
            />
          </div>
          <span
            className="font-display text-2xl font-black tabular-nums"
            style={{ color: timerTextColor(remaining / timerSeconds, s.accentColor) }}
          >
            {Math.ceil(remaining)}
          </span>
        </div>
      )}

      {voted && !isResults && (
        <div className="flex w-full flex-col items-center gap-2 rounded-xl py-5" style={{ backgroundColor: alpha(accentHex, 0.08) }}>
          <Check className="size-5" style={{ color: accentHex }} />
          <p className="font-sans text-sm font-semibold" style={{ color: accentHex }}>
            Answer locked in!
          </p>
          <p className="font-sans text-xs" style={{ color: textFaint }}>
            Waiting for results...
          </p>
        </div>
      )}

      {(!voted || isResults) && (
        <div className="flex w-full flex-col gap-3">
          {options.map((opt, i) => {
            const isThisCorrect = correctOption === i;
            const wasChosen = voted === opt;
            const optAccent = optionAccents[i % optionAccents.length];

            return (
              <button
                key={i}
                onClick={() => handleVote(opt)}
                disabled={!canAnswer || submitting}
                className={cn(
                  "flex w-full items-center gap-3.5 rounded-xl px-4 py-3.5 text-left transition-all active:scale-[0.98] disabled:active:scale-100",
                  revealed && !isThisCorrect && !wasChosen && "opacity-40",
                )}
                style={{
                  backgroundColor: revealed && isThisCorrect
                    ? correctColor
                    : revealed && wasChosen && !isThisCorrect
                      ? "#fe8b70"
                      : revealed
                        ? surfaceMuted
                        : "#fff",
                  boxShadow: revealed && isThisCorrect
                    ? `0 4px 20px ${alpha(correctColor, 0.3)}`
                    : !revealed
                      ? "0 2px 12px rgb(35 31 28 / 0.04)"
                      : undefined,
                }}
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-lg font-display text-xs font-bold leading-[1.7]"
                  style={{
                    backgroundColor: revealed
                      ? (isThisCorrect || wasChosen ? "rgba(255,255,255,0.2)" : alpha(text, 0.05))
                      : optAccent.bg,
                    color: revealed
                      ? (isThisCorrect || wasChosen ? "#fff" : alpha(text, 0.3))
                      : optAccent.fg,
                  }}
                >
                  {QUIZ_OPTION_LABELS[i]}
                </span>
                <span
                  className="flex-1 font-sans text-sm font-semibold"
                  style={{
                    color: revealed && (isThisCorrect || wasChosen)
                      ? "#fff"
                      : revealed
                        ? alpha(text, 0.3)
                        : text,
                  }}
                >
                  {opt}
                </span>
                {revealed && isThisCorrect && <Check className="size-5 text-white" />}
                {revealed && wasChosen && !isThisCorrect && (
                  <X className="size-5 text-white/70" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {!voted && phase === "answering" && remaining <= 0 && (
        <div className="w-full rounded-xl bg-[#fe8b70]/10 py-4 text-center">
          <p className="font-sans text-sm font-semibold text-[#fe8b70]">
            Time's up!
          </p>
        </div>
      )}

      {revealed && voted && (
        <div
          className="w-full rounded-xl py-5 text-center"
          style={{ backgroundColor: isCorrect ? alpha(correctColor, 0.1) : "rgba(254,139,112,0.1)" }}
        >
          <p
            className="font-display text-base font-bold"
            style={{ color: isCorrect ? correctColor : "#fe8b70" }}
          >
            {isCorrect ? "Correct!" : "Wrong!"}
          </p>
          {!isCorrect && (
            <p className="mt-1 font-sans text-sm" style={{ color: alpha(text, 0.5) }}>
              The correct answer was:{" "}
              <strong style={{ color: text }}>{correctAnswer}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
