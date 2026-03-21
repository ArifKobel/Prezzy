import type { Doc } from "@Prezzy/backend/convex/_generated/dataModel";
import { cn } from "@Prezzy/ui/lib/utils";
import { Cloud } from "lucide-react";
import { useEditorActions } from "@/lib/editor/editor-context";
import { SectionLabel } from "@/components/editor/editor-ui";

export function WordCloudProperties({ el }: { el: Doc<"slideElements"> }) {
  const { updateProps } = useEditorActions();
  const prompt = el.props?.prompt ?? "";
  const maxResponses = (el.props?.maxResponses as number) ?? 1;

  return (
    <>
      <section>
        <SectionLabel icon={<Cloud className="size-3" />} label="Prompt" />
        <input
          type="text"
          value={prompt}
          onChange={(e) => updateProps({ id: el._id, props: { prompt: e.target.value } })}
          placeholder="Describe this in one word..."
          className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 font-sans text-[11px] text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-ring"
          onKeyDown={(e) => e.stopPropagation()}
        />
        <p className="mt-1 font-sans text-[10px] text-muted-foreground/60">
          Audience will type their word and it appears in the cloud.
        </p>
      </section>

      <section>
        <SectionLabel icon={<Cloud className="size-3" />} label="Responses per person" />
        <div className="flex items-center gap-2">
          {[1, 2, 3, 5, 10].map((n) => (
            <button
              key={n}
              onClick={() => updateProps({ id: el._id, props: { maxResponses: n } })}
              className={cn(
                "flex-1 rounded-md px-2 py-1.5 font-sans text-[11px] font-medium transition-all",
                maxResponses === n
                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "bg-surface-container text-muted-foreground hover:bg-surface-container-high hover:text-foreground",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
