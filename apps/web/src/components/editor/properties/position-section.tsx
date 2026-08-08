import type { SlideElement } from "@Prezzy/shared";
import { Move } from "lucide-react";
import { useEditorActions } from "@/lib/editor/editor-context";
import { PropNumberInput, SectionLabel } from "@/components/editor/editor-ui";
import type { Geo } from "@/lib/editor/snap";

export function PositionSection({ el }: { el: SlideElement }) {
  const { updatePosition, updateGeometry } = useEditorActions();
  const geo: Geo = { x: el.x, y: el.y, width: el.width, height: el.height };

  function updateAxis(axis: "x" | "y", v: number) {
    const next = { ...geo, [axis]: v };
    updatePosition({ id: el.id, x: next.x, y: next.y });
  }

  function updateSize(dim: "width" | "height", v: number) {
    const next = { ...geo, [dim]: v };
    updateGeometry({ id: el.id, ...next });
  }

  return (
    <section>
      <SectionLabel icon={<Move className="size-3" />} label="Position & Size" />
      <div className="grid grid-cols-2 gap-2">
        <PropNumberInput label="X %" value={Math.round(geo.x)} onChange={(v) => updateAxis("x", v)} />
        <PropNumberInput label="Y %" value={Math.round(geo.y)} onChange={(v) => updateAxis("y", v)} />
        <PropNumberInput label="W %" value={Math.round(geo.width)} onChange={(v) => updateSize("width", v)} />
        <PropNumberInput label="H %" value={Math.round(geo.height)} onChange={(v) => updateSize("height", v)} />
      </div>
    </section>
  );
}
