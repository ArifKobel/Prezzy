import type { SlideElement } from "@Prezzy/shared";
import { cn } from "@Prezzy/ui/lib/utils";
import { FlipHorizontal2, FlipVertical2 } from "lucide-react";
import { useEditorActions } from "@/lib/editor/editor-context";
import { SectionLabel } from "@/components/editor/editor-ui";

export function MirrorSection({ el }: { el: SlideElement }) {
  const { updateProps } = useEditorActions();

  return (
    <section>
      <SectionLabel icon={<FlipHorizontal2 className="size-3" />} label="Mirror" />
      <div className="flex gap-1.5">
        <button
          onClick={() => updateProps({ id: el.id, props: { flipX: !(el.props?.flipX ?? false) } })}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 font-sans text-[11px] font-medium transition-all",
            el.props?.flipX ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "bg-surface-container text-muted-foreground hover:bg-surface-container-high hover:text-foreground",
          )}
        >
          <FlipHorizontal2 className="size-3.5" /> Horizontal
        </button>
        <button
          onClick={() => updateProps({ id: el.id, props: { flipY: !(el.props?.flipY ?? false) } })}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 font-sans text-[11px] font-medium transition-all",
            el.props?.flipY ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "bg-surface-container text-muted-foreground hover:bg-surface-container-high hover:text-foreground",
          )}
        >
          <FlipVertical2 className="size-3.5" /> Vertical
        </button>
      </div>
    </section>
  );
}
