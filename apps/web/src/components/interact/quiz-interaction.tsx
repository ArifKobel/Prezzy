import type { SlideElement } from "@Prezzy/shared";
import { Check, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useResponses } from "@/lib/api/interact";
import { useInteractSession } from "@/components/interact/session-context";
import {
  QUIZ_OPTION_LABELS,
  deriveOptionAccents,
  timerColor,
} from "@/lib/quiz-constants";

const KRAN = "#c8401f";
const OPTION_ACCENTS = deriveOptionAccents(KRAN);
const CORRECT = OPTION_ACCENTS[1]?.bg ?? "#4e8f6f";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
      {children}
    </p>
  );
}

export function QuizInteraction({ element }: { element: SlideElement }) {
  const { participantId, quizState, submit } = useInteractSession();

  const question = element.props?.question || "Question";
  const options: string[] = element.props?.options ?? [];
  const correctOption: number | undefined = element.props?.correctOption;
  const timerSeconds: number = element.props?.timerSeconds ?? 20;

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
      <div className="flex w-full flex-col items-center gap-3 border border-border bg-card px-5 py-8 text-center">
        <Eyebrow>Quiz</Eyebrow>
        <h2 className="font-display text-xl font-extrabold tracking-tight text-foreground">
          {question}
        </h2>
        <p className="font-sans text-sm text-muted-foreground">
          {phase === "question" ? "Get ready — options are coming!" : "Waiting for the presenter to start..."}
        </p>
        <Loader2 className="size-5 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <Eyebrow>Quiz</Eyebrow>
      <h2 className="text-balance text-center font-display text-2xl font-extrabold tracking-tight text-foreground">
        {question}
      </h2>

      {phase === "answering" && (
        <div className="flex w-full flex-col items-center gap-1.5">
          <div className="h-1.5 w-full overflow-hidden bg-surface-container">
            <div
              className="h-full transition-all duration-200"
              style={{
                width: `${(remaining / timerSeconds) * 100}%`,
                backgroundColor: timerColor(remaining / timerSeconds, KRAN),
              }}
            />
          </div>
          <span
            className="font-display text-3xl font-extrabold tabular-nums tracking-tight"
            style={{ color: timerColor(remaining / timerSeconds, KRAN) }}
          >
            {Math.ceil(remaining)}
          </span>
        </div>
      )}

      {voted && !isResults && (
        <div className="flex w-full flex-col items-center gap-1.5 border border-border bg-card py-5">
          <Check className="size-5 text-primary" />
          <p className="font-sans text-sm font-bold text-foreground">Answer locked in!</p>
          <p className="font-sans text-xs text-muted-foreground">Waiting for results...</p>
        </div>
      )}

      {(!voted || isResults) && (
        <div className="flex w-full flex-col gap-2.5">
          {options.map((opt, i) => {
            const isThisCorrect = correctOption === i;
            const wasChosen = voted === opt;
            const optAccent = OPTION_ACCENTS[i % OPTION_ACCENTS.length];

            const faded = revealed && !isThisCorrect && !wasChosen;
            const fill = revealed
              ? isThisCorrect
                ? CORRECT
                : wasChosen
                  ? "var(--destructive)"
                  : "var(--surface-container)"
              : optAccent?.bg;
            const ink = faded ? "var(--muted-foreground)" : revealed ? "#ffffff" : optAccent?.fg;

            return (
              <button
                key={i}
                onClick={() => handleVote(opt)}
                disabled={!canAnswer || submitting}
                className={`flex w-full items-center gap-3.5 px-4 py-4 text-left shadow-[0_2px_8px_rgb(27_30_34_/_0.12)] transition-transform active:scale-[0.97] disabled:active:scale-100 ${
                  faded ? "opacity-60 shadow-none" : ""
                }`}
                style={{ backgroundColor: fill, color: ink }}
              >
                <span
                  className="grid size-8 shrink-0 place-items-center font-display text-sm font-extrabold"
                  style={{ backgroundColor: faded ? "rgb(27 30 34 / 0.08)" : "rgb(255 255 255 / 0.22)" }}
                >
                  {QUIZ_OPTION_LABELS[i]}
                </span>
                <span className="flex-1 font-sans text-base font-bold">{opt}</span>
                {revealed && isThisCorrect && <Check className="size-5" />}
                {revealed && wasChosen && !isThisCorrect && <X className="size-5 opacity-70" />}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p className="font-sans text-xs font-bold text-destructive">
          Couldn't send your answer — tap again.
        </p>
      )}

      {!voted && phase === "answering" && remaining <= 0 && (
        <div className="w-full border border-border bg-card py-4 text-center">
          <p className="font-sans text-sm font-bold text-destructive">Time's up!</p>
        </div>
      )}

      {revealed && voted && (
        <div className="w-full border border-border bg-card py-5 text-center">
          <p
            className="font-display text-lg font-extrabold tracking-tight"
            style={{ color: isCorrect ? CORRECT : "var(--destructive)" }}
          >
            {isCorrect ? "Correct!" : "Wrong!"}
          </p>
          {isCorrect && myResponse?.score != null && (
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              +{myResponse.score.toLocaleString()} points
            </p>
          )}
          {!isCorrect && (
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              The correct answer was <strong className="text-foreground">{correctAnswer}</strong>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
