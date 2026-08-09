import type { SlideElement } from "@Prezzy/shared";
import { mixHex } from "@Prezzy/shared/theme";
import { Check, Send } from "lucide-react";
import { useState } from "react";
import { useResponses } from "@/lib/api/interact";
import { useInteractSession } from "@/components/interact/session-context";
import { WordCloudElement } from "@/components/elements/word-cloud-element";
import { contrastOn } from "@/lib/quiz-constants";

export function WordCloudInteraction({ element }: { element: SlideElement }) {
  const { theme: t, participantId, submit } = useInteractSession();
  const prompt = element.props?.prompt || "Share a word...";
  const maxResponses = element.props?.maxResponses ?? 1;

  const { data: responses } = useResponses(element.id);
  const myResponseCount = responses?.filter((r) => r.participantId === participantId).length ?? 0;
  const remaining = maxResponses - myResponseCount;
  const limitReached = remaining <= 0;

  const [value, setValue] = useState("");
  const [justSent, setJustSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const word = value.trim();
    if (!word || submitting || limitReached) return;
    setSubmitting(true);
    setError(false);
    try {
      await submit(element.id, word);
      setValue("");
      setJustSent(true);
      setTimeout(() => setJustSent(false), 2000);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: mixHex(t.accent, t.bg, 0.3) }}>
        Word Cloud
      </p>

      <h2 className="text-center text-lg font-bold" style={{ fontFamily: t.fontHeading, color: t.heading }}>
        {prompt}
      </h2>

      {limitReached ? (
        <div
          className="flex w-full flex-col items-center gap-2 py-5 text-center"
          style={{ backgroundColor: t.surface, borderRadius: t.radius }}
        >
          <Check className="size-5" style={{ color: t.accent }} />
          <p className="text-sm font-semibold" style={{ color: t.accent }}>
            {myResponseCount === 1 ? "Response submitted!" : `All ${myResponseCount} responses submitted!`}
          </p>
          <p className="text-xs" style={{ color: t.muted }}>
            Thanks for participating.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2.5">
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Type a word..."
              maxLength={30}
              className="w-full px-4 py-3.5 pr-12 text-base outline-none"
              style={{
                backgroundColor: t.surface,
                color: t.text,
                borderRadius: t.radius,
                border: `1px solid ${t.muted}40`,
              }}
            />
            <button
              type="submit"
              disabled={!value.trim() || submitting}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 transition-opacity disabled:opacity-30"
              style={{ backgroundColor: t.accent, color: contrastOn(t.accent), borderRadius: Math.max(0, t.radius - 2) }}
            >
              <Send className="size-4" />
            </button>
          </div>
          {error && (
            <p className="text-center text-xs font-semibold" style={{ color: "#e0714f" }}>
              Couldn't send — try again.
            </p>
          )}
          {maxResponses > 1 && (
            <p className="text-center text-xs" style={{ color: t.muted }}>
              {justSent ? <span style={{ color: t.accent }}>Submitted!</span> : <>{remaining} of {maxResponses} remaining</>}
            </p>
          )}
          {maxResponses === 1 && justSent && (
            <p className="text-center text-xs" style={{ color: t.accent }}>Submitted!</p>
          )}
        </form>
      )}

      {(responses?.length ?? 0) > 0 && (
        <div className="h-56 w-full overflow-hidden" style={{ borderRadius: t.radius, backgroundColor: t.surface }}>
          <WordCloudElement el={element} responses={responses} theme={t} />
        </div>
      )}
    </div>
  );
}
