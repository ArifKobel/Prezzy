import type { Doc } from "@Prezzy/backend/convex/_generated/dataModel";
import { Move } from "lucide-react";
import { useEditorActions, useEditorCtxState } from "@/lib/editor/editor-context";
import { PropNumberInput, SectionLabel } from "@/components/editor/editor-ui";

export function PositionSection({ el }: { el: Doc<"slideElements"> }) {
  const { updatePosition, updateGeometry, setLocalGeometry } = useEditorActions();
  const { localGeometry } = useEditorCtxState();
  const geo = localGeometry.get(el._id) ?? el;

  function updateAxis(axis: "x" | "y", v: number) {
    const next = { ...geo, [axis]: v };
    setLocalGeometry(el._id, next);
    updatePosition({ id: el._id, x: next.x, y: next.y });
  }

  function updateSize(dim: "width" | "height", v: number) {
    const next = { ...geo, [dim]: v };
    setLocalGeometry(el._id, next);
    updateGeometry({ id: el._id, ...next });
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
