import type { SlideElement } from "@Prezzy/shared";
import { mixHex } from "@Prezzy/shared/theme";
import { Check, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useResponses } from "@/lib/api/interact";
import { useInteractSession } from "@/components/interact/session-context";
import {
  QUIZ_OPTION_LABELS,
  contrastOn,
  deriveOptionAccents,
  timerColor,
} from "@/lib/quiz-constants";

const WRONG = "#e0714f";

function QuizFrame({ children, accent, bg }: { children: React.ReactNode; accent: string; bg: string }) {
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: mixHex(accent, bg, 0.3) }}>
        Quiz
      </p>
      {children}
    </div>
  );
}

export function QuizInteraction({ element }: { element: SlideElement }) {
  const { theme: t, participantId, quizState, submit } = useInteractSession();

  const question = element.props?.question || "Question";
  const options: string[] = element.props?.options ?? [];
  const correctOption: number | undefined = element.props?.correctOption;
  const timerSeconds: number = element.props?.timerSeconds ?? 20;

  const optionAccents = deriveOptionAccents(t.accent);
  const correctColor = optionAccents[1]?.bg ?? t.accent;

  const phase = quizState?.elementId === element.id ? quizState.phase : null;
  const startedAt = quizState?.startedAt ?? 0;

  const { data: responses } = useResponses(element.id);
  const myResponse = responses?.find((r) => r.participantId === participantId);

  const [voted, setVoted] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [remaining, setRemaining] = useState(timerSeconds);

  useEffect(() => {
    if (myResponse && !voted) setVoted(myResponse.value);
  }, [myResponse, voted]);

  useEffect(() => {
    if (phase === "question" || phase === null) {
      setVoted(null);
      setError(false);
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
  const correctAnswer = correctOption != null ? options[correctOption] : undefined;
  const isCorrect = voted != null && voted === correctAnswer;
  const revealed = isResults && correctAnswer != null;

  async function handleVote(option: string) {
    if (!canAnswer || submitting) return;
    setSubmitting(true);
    setError(false);
    try {
      await submit(element.id, option);
      setVoted(option);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === null || phase === "question") {
    return (
      <QuizFrame accent={t.accent} bg={t.bg}>
        <h2 className="text-center text-xl font-bold" style={{ fontFamily: t.fontHeading, color: t.heading }}>
          {question}
        </h2>
        <p className="text-sm" style={{ color: t.muted }}>
          {phase === "question" ? "Get ready — options are coming!" : "Waiting for the presenter to start..."}
        </p>
        <Loader2 className="size-5 animate-spin" style={{ color: mixHex(t.accent, t.bg, 0.5) }} />
      </QuizFrame>
    );
  }

  return (
    <QuizFrame accent={t.accent} bg={t.bg}>
      <h2 className="text-center text-lg font-bold" style={{ fontFamily: t.fontHeading, color: t.heading }}>
        {question}
      </h2>

      {phase === "answering" && (
        <div className="flex w-full flex-col items-center gap-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: t.surface }}>
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${(remaining / timerSeconds) * 100}%`,
                backgroundColor: timerColor(remaining / timerSeconds, t.accent),
              }}
            />
          </div>
          <span
            className="text-2xl font-extrabold tabular-nums"
            style={{ fontFamily: t.fontHeading, color: timerColor(remaining / timerSeconds, t.accent) }}
          >
            {Math.ceil(remaining)}
          </span>
        </div>
      )}

      {voted && !isResults && (
        <div
          className="flex w-full flex-col items-center gap-2 py-5"
          style={{ backgroundColor: t.surface, borderRadius: t.radius }}
        >
          <Check className="size-5" style={{ color: t.accent }} />
          <p className="text-sm font-semibold" style={{ color: t.accent }}>
            Answer locked in!
          </p>
          <p className="text-xs" style={{ color: t.muted }}>
            Waiting for results...
          </p>
        </div>
      )}

      {(!voted || isResults) && (
        <div className="flex w-full flex-col gap-2.5">
          {options.map((opt, i) => {
            const isThisCorrect = correctOption === i;
            const wasChosen = voted === opt;
            const optAccent = optionAccents[i % optionAccents.length];

            const bg = revealed
              ? isThisCorrect
                ? correctColor
                : wasChosen
                  ? WRONG
                  : t.surface
              : t.surface;
            const fg = revealed
              ? isThisCorrect || wasChosen
                ? contrastOn(bg)
                : t.muted
              : t.text;

            return (
              <button
                key={i}
                onClick={() => handleVote(opt)}
                disabled={!canAnswer || submitting}
                className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-transform active:scale-[0.98] disabled:active:scale-100"
                style={{
                  backgroundColor: bg,
                  color: fg,
                  borderRadius: t.radius,
                  opacity: revealed && !isThisCorrect && !wasChosen ? 0.5 : 1,
                }}
              >
                <span
                  className="grid size-8 shrink-0 place-items-center text-xs font-bold"
                  style={{
                    backgroundColor: revealed ? mixHex(bg, fg, 0.15) : optAccent?.bg,
                    color: revealed ? fg : optAccent?.fg,
                    borderRadius: Math.max(0, t.radius - 2),
                    fontFamily: t.fontHeading,
                  }}
                >
                  {QUIZ_OPTION_LABELS[i]}
                </span>
                <span className="flex-1 text-sm font-semibold">{opt}</span>
                {revealed && isThisCorrect && <Check className="size-5" />}
                {revealed && wasChosen && !isThisCorrect && <X className="size-5 opacity-70" />}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-center text-xs font-semibold" style={{ color: WRONG }}>
          Couldn't send your answer — tap again.
        </p>
      )}

      {!voted && phase === "answering" && remaining <= 0 && (
        <div className="w-full py-4 text-center" style={{ backgroundColor: t.surface, borderRadius: t.radius }}>
          <p className="text-sm font-semibold" style={{ color: WRONG }}>
            Time's up!
          </p>
        </div>
      )}

      {revealed && voted && (
        <div
          className="w-full py-5 text-center"
          style={{ backgroundColor: t.surface, borderRadius: t.radius }}
        >
          <p className="text-base font-bold" style={{ fontFamily: t.fontHeading, color: isCorrect ? correctColor : WRONG }}>
            {isCorrect ? "Correct!" : "Wrong!"}
          </p>
          {isCorrect && myResponse?.score != null && (
            <p className="mt-1 text-sm" style={{ color: t.muted }}>
              +{myResponse.score.toLocaleString()} points
            </p>
          )}
          {!isCorrect && (
            <p className="mt-1 text-sm" style={{ color: t.muted }}>
              The correct answer was <strong style={{ color: t.text }}>{correctAnswer}</strong>
            </p>
          )}
        </div>
      )}
    </QuizFrame>
  );
}
