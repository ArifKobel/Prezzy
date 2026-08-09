import type { AudienceResponse, PresentationTheme, SlideElement } from "@Prezzy/shared";
import { resolveSlideTheme } from "@Prezzy/shared/theme";
import { Check, Send } from "lucide-react";
import { useState } from "react";
import { useResponses } from "@/lib/api/interact";
import {
  deriveOptionAccents,
  alpha,
  resolveElementStyle,
} from "@/lib/quiz-constants";

export function WordCloudInteraction({
  element,
  participantId,
  participantName,
  submitResponse,
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
  theme?: PresentationTheme | null;
}) {
  const prompt = element.props?.prompt || "Share a word...";
  const maxResponses = element.props?.maxResponses ?? 1;
  const elementId = element.id;

  const s = resolveElementStyle(element.props, resolveSlideTheme(theme));
  const accentHex = s.accentColor || "#22574a";
  const text = s.textColor || "#231f1c";
  const textFaint = alpha(text, 0.35);
  const correctColor = s.accentColor ? deriveOptionAccents(s.accentColor)[1].bg : "#4e8f6f";

  const { data: responses } = useResponses(elementId);
  const myResponseCount =
    responses?.filter((r) => r.participantId === participantId).length ?? 0;
  const remaining = maxResponses - myResponseCount;
  const limitReached = remaining <= 0;

  const [value, setValue] = useState("");
  const [justSent, setJustSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const word = value.trim();
    if (!word || submitting || limitReached) return;
    setSubmitting(true);
    try {
      await submitResponse({
        elementId,
        participantId,
        participantName,
        value: word,
      });
      setValue("");
      setJustSent(true);
      setTimeout(() => setJustSent(false), 2000);
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5">
      <p className="font-sans text-xs font-medium uppercase tracking-[0.1em]" style={{ color: alpha(accentHex, 0.5) }}>
        Word Cloud
      </p>

      <h2 className="text-center font-display text-lg font-bold" style={{ color: text }}>
        {prompt}
      </h2>

      {limitReached ? (
        <div className="flex w-full flex-col items-center gap-3 rounded-xl py-6" style={{ backgroundColor: alpha(correctColor, 0.1) }}>
          <Check className="size-6" style={{ color: correctColor }} />
          <p className="font-sans text-sm font-semibold" style={{ color: correctColor }}>
            {myResponseCount === 1 ? "Response submitted!" : `All ${myResponseCount} responses submitted!`}
          </p>
          <p className="font-sans text-xs" style={{ color: textFaint }}>
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
              className="w-full rounded-xl border border-border bg-card px-4 py-3.5 pr-12 font-sans text-sm text-foreground outline-none focus:shadow-[0_2px_16px_rgb(200_64_31_/_0.12)]"
              style={{ color: text, ["--tw-placeholder-opacity" as any]: 0.25 }}
            />
            <button
              type="submit"
              disabled={!value.trim() || submitting}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-white transition-transform hover:scale-[1.05] disabled:opacity-30 disabled:hover:scale-100"
              style={{ backgroundColor: accentHex }}
            >
              <Send className="size-4" />
            </button>
          </div>
          {maxResponses > 1 && (
            <p className="text-center font-sans text-xs" style={{ color: textFaint }}>
              {justSent ? (
                <span style={{ color: correctColor }}>Submitted!</span>
              ) : (
                <>{remaining} of {maxResponses} remaining</>
              )}
            </p>
          )}
          {maxResponses === 1 && justSent && (
            <p className="text-center font-sans text-xs" style={{ color: correctColor }}>Submitted!</p>
          )}
        </form>
      )}
    </div>
  );
}
