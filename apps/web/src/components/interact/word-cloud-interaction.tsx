import type { SlideElement } from "@Prezzy/shared";
import { Check, Send } from "lucide-react";
import { useState } from "react";
import { useResponses } from "@/lib/api/interact";
import { useInteractSession } from "@/components/interact/session-context";
import { WordCloudElement } from "@/components/elements/word-cloud-element";

export function WordCloudInteraction({ element }: { element: SlideElement }) {
  const { theme, participantId, submit } = useInteractSession();
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
    <div className="flex w-full flex-col items-center gap-4">
      <p className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
        Word Cloud
      </p>

      <h2 className="text-center font-display text-lg font-extrabold tracking-tight text-foreground">
        {prompt}
      </h2>

      {limitReached ? (
        <div className="flex w-full flex-col items-center gap-1.5 border border-border bg-card py-5 text-center">
          <Check className="size-5 text-primary" />
          <p className="font-sans text-sm font-bold text-foreground">
            {myResponseCount === 1 ? "Response submitted!" : `All ${myResponseCount} responses submitted!`}
          </p>
          <p className="font-sans text-xs text-muted-foreground">Thanks for participating.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Type a word..."
              maxLength={30}
              className="w-full border border-border bg-card px-4 py-3.5 pr-12 font-sans text-base text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary"
            />
            <button
              type="submit"
              disabled={!value.trim() || submitting}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary-dim disabled:opacity-30"
            >
              <Send className="size-4" />
            </button>
          </div>
          {error && (
            <p className="text-center font-sans text-xs font-bold text-destructive">
              Couldn't send — try again.
            </p>
          )}
          {maxResponses > 1 && (
            <p className="text-center font-sans text-xs text-muted-foreground">
              {justSent ? <span className="font-bold text-primary">Submitted!</span> : <>{remaining} of {maxResponses} remaining</>}
            </p>
          )}
          {maxResponses === 1 && justSent && (
            <p className="text-center font-sans text-xs font-bold text-primary">Submitted!</p>
          )}
        </form>
      )}

      {(responses?.length ?? 0) > 0 && (
        <div className="w-full bg-[#fffdf8] p-1.5 shadow-[0_1px_3px_rgb(27_30_34_/_0.15),0_8px_20px_rgb(27_30_34_/_0.12)]">
          <div className="h-52 w-full overflow-hidden bg-surface-container">
            <WordCloudElement el={element} responses={responses} theme={theme} />
          </div>
        </div>
      )}
    </div>
  );
}
