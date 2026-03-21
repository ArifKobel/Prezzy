import type { Doc } from "@Prezzy/backend/convex/_generated/dataModel";
import { Paintbrush } from "lucide-react";
import { useEditorActions } from "@/lib/editor/editor-context";
import { SectionLabel } from "@/components/editor/editor-ui";

export function StyleSection({ el }: { el: Doc<"slideElements"> }) {
  const { updateProps } = useEditorActions();
  const accent = (el.props?.accentColor as string) ?? "";
  const bg = (el.props?.backgroundColor as string) ?? "";
  const text = (el.props?.textColor as string) ?? "";

  return (
    <section>
      <SectionLabel icon={<Paintbrush className="size-3" />} label="Design" />
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <input type="color" value={accent || "#4e6073"} onChange={(e) => updateProps({ id: el._id, props: { accentColor: e.target.value } })} className="size-7 cursor-pointer rounded-md border border-border bg-transparent p-0.5" />
          <div className="flex-1">
            <label className="font-sans text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">Accent</label>
            <input
              type="text" value={accent} placeholder="#4e6073"
              onChange={(e) => updateProps({ id: el._id, props: { accentColor: e.target.value || undefined } })}
              onKeyDown={(e) => e.stopPropagation()}
              className="w-full rounded-md border border-border bg-surface px-2 py-1 font-mono text-[11px] text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-ring"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="color" value={bg || "#faf9f8"} onChange={(e) => updateProps({ id: el._id, props: { backgroundColor: e.target.value } })} className="size-7 cursor-pointer rounded-md border border-border bg-transparent p-0.5" />
          <div className="flex-1">
            <label className="font-sans text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">Background</label>
            <input
              type="text" value={bg} placeholder="#faf9f8"
              onChange={(e) => updateProps({ id: el._id, props: { backgroundColor: e.target.value || undefined } })}
              onKeyDown={(e) => e.stopPropagation()}
              className="w-full rounded-md border border-border bg-surface px-2 py-1 font-mono text-[11px] text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-ring"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="color" value={text || "#2f3333"} onChange={(e) => updateProps({ id: el._id, props: { textColor: e.target.value } })} className="size-7 cursor-pointer rounded-md border border-border bg-transparent p-0.5" />
          <div className="flex-1">
            <label className="font-sans text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">Text</label>
            <input
              type="text" value={text} placeholder="#2f3333"
              onChange={(e) => updateProps({ id: el._id, props: { textColor: e.target.value || undefined } })}
              onKeyDown={(e) => e.stopPropagation()}
              className="w-full rounded-md border border-border bg-surface px-2 py-1 font-mono text-[11px] text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-ring"
            />
          </div>
        </div>
        {accent && (
          <button
            onClick={() => updateProps({ id: el._id, props: { accentColor: undefined, backgroundColor: undefined, textColor: undefined } })}
            className="self-start font-sans text-[10px] font-medium text-muted-foreground hover:text-foreground"
          >
            Reset to defaults
          </button>
        )}
      </div>
    </section>
  );
}
