import type { Doc } from "@Prezzy/backend/convex/_generated/dataModel";
import { cn } from "@Prezzy/ui/lib/utils";
import { Check, HelpCircle, Sparkles, Square, X } from "lucide-react";
import { useEditorActions } from "@/lib/editor/editor-context";
import { SectionLabel } from "@/components/editor/editor-ui";

export function QuizProperties({ el }: { el: Doc<"slideElements"> }) {
  const { updateProps } = useEditorActions();
  const question = el.props?.question ?? "";
  const options: string[] = (el.props?.options as string[] | undefined) ?? ["", ""];
  const correctOption: number | undefined = el.props?.correctOption as number | undefined;
  const timerSeconds: number = (el.props?.timerSeconds as number) ?? 20;
  const timeScoring: boolean = (el.props?.timeScoring as boolean) ?? true;

  return (
    <>
      <section>
        <SectionLabel icon={<HelpCircle className="size-3" />} label="Question" />
        <input
          type="text"
          value={question}
          onChange={(e) => updateProps({ id: el._id, props: { question: e.target.value } })}
          placeholder="What is your question?"
          className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 font-sans text-[11px] text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-ring"
          onKeyDown={(e) => e.stopPropagation()}
        />
      </section>

      <section>
        <SectionLabel icon={<Square className="size-3" />} label="Options (click checkmark to set correct answer)" />
        <div className="flex flex-col gap-1.5">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => updateProps({ id: el._id, props: { correctOption: correctOption === i ? undefined : i } })}
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  correctOption === i
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-border text-transparent hover:border-green-300 hover:text-green-300",
                )}
                title={correctOption === i ? "Correct answer" : "Mark as correct"}
              >
                <Check className="size-3" />
              </button>
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = e.target.value;
                  updateProps({ id: el._id, props: { options: next } });
                }}
                placeholder={`Option ${i + 1}`}
                className={cn(
                  "flex-1 rounded-md border bg-surface px-2 py-1.5 font-sans text-[11px] text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-ring",
                  correctOption === i ? "border-green-400" : "border-border",
                )}
                onKeyDown={(e) => e.stopPropagation()}
              />
              {options.length > 2 && (
                <button
                  onClick={() => {
                    const next = options.filter((_, j) => j !== i);
                    const newCorrect = correctOption === i ? undefined : correctOption != null && correctOption > i ? correctOption - 1 : correctOption;
                    updateProps({ id: el._id, props: { options: next, correctOption: newCorrect } });
                  }}
                  className="flex size-5 items-center justify-center rounded text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <button
              onClick={() => updateProps({ id: el._id, props: { options: [...options, ""] } })}
              className="self-start font-sans text-[10px] font-medium text-primary hover:underline"
            >
              + Add option
            </button>
          )}
        </div>
      </section>

      <section>
        <SectionLabel icon={<Sparkles className="size-3" />} label="Timer & Scoring" />
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] text-foreground">Timer (seconds)</span>
            <input
              type="number"
              value={timerSeconds}
              onChange={(e) => updateProps({ id: el._id, props: { timerSeconds: Math.max(5, Math.min(120, Number(e.target.value) || 20)) } })}
              min={5}
              max={120}
              className="w-16 rounded-md border border-border bg-surface px-2 py-1 text-center font-mono text-[11px] text-foreground outline-none focus:border-ring"
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-sans text-[11px] text-foreground">Speed bonus</span>
              <p className="font-sans text-[9px] text-muted-foreground/60">Faster answers = more points</p>
            </div>
            <button
              type="button"
              onClick={() => updateProps({ id: el._id, props: { timeScoring: !timeScoring } })}
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                timeScoring ? "bg-primary" : "bg-border",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform",
                  timeScoring && "translate-x-4",
                )}
              />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
