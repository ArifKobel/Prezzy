import type { SlideElement } from "@Prezzy/shared";
import { SHAPE_TYPES } from "@/components/slide-canvas";
import { cn } from "@Prezzy/ui/lib/utils";
import { Palette, RectangleHorizontal, RotateCw, Square } from "lucide-react";
import { useEditorActions } from "@/lib/editor/editor-context";
import { PropSlider, SectionLabel, ShapeIcon } from "@/components/editor/editor-ui";
import { MirrorSection } from "@/components/editor/properties/mirror-section";

export function ShapeProperties({ el }: { el: SlideElement }) {
  const { updateProps } = useEditorActions();

  return (
    <>
      <section>
        <SectionLabel icon={<Square className="size-3" />} label="Shape Type" />
        <div className="grid grid-cols-4 gap-1">
          {SHAPE_TYPES.map((st) => {
            const active = (el.props?.shapeType ?? "rectangle") === st.id;
            return (
              <button key={st.id} onClick={() => updateProps({ id: el.id, props: { shapeType: st.id } })} title={st.label}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg px-1 py-2 font-sans text-[9px] font-medium transition-all",
                  active ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "bg-surface-container text-muted-foreground hover:bg-surface-container-high hover:text-foreground",
                )}
              >
                <ShapeIcon type={st.id} className="size-4" />
                {st.label}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <SectionLabel icon={<Palette className="size-3" />} label="Fill Color" />
        <div className="flex items-center gap-2">
          <input type="color" value={el.props?.color ?? "#d4c4b0"} onChange={(e) => updateProps({ id: el.id, props: { color: e.target.value } })} className="size-8 cursor-pointer rounded-md border border-border bg-transparent p-0.5" />
          <input type="text" value={el.props?.color ?? ""} placeholder="var(--color-secondary-container)" onChange={(e) => updateProps({ id: el.id, props: { color: e.target.value } })} className="flex-1 rounded-md border border-border bg-surface px-2 py-1.5 font-mono text-[11px] text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-ring" />
        </div>
      </section>

      <PropSlider label="Border Radius" icon={<RectangleHorizontal className="size-3" />} value={el.props?.borderRadius ?? 8} min={0} max={50} onChange={(v) => updateProps({ id: el.id, props: { borderRadius: v } })} />
      <PropSlider label="Opacity" icon={<span className="font-sans text-[9px] font-bold">%</span>} value={el.props?.opacity ?? 100} min={0} max={100} onChange={(v) => updateProps({ id: el.id, props: { opacity: v } })} />
      <PropSlider label="Rotation" icon={<RotateCw className="size-3" />} value={el.props?.rotation ?? 0} min={0} max={360} onChange={(v) => updateProps({ id: el.id, props: { rotation: v } })} />

      <MirrorSection el={el} />
    </>
  );
}
