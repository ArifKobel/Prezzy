import {
  ContextMenuContent, ContextMenuItem, ContextMenuSeparator,
} from "@Prezzy/ui/components/context-menu";
import { Copy, LayoutGrid, Paintbrush, Plus, RotateCcw, Trash2 } from "lucide-react";

function pickColor(initial: string, onPick: (v: string) => void) {
  const input = document.createElement("input");
  input.type = "color";
  input.value = initial;
  input.style.position = "fixed";
  input.style.opacity = "0";
  input.style.pointerEvents = "none";
  document.body.appendChild(input);
  input.oninput = () => onPick(input.value);
  input.onblur = () => input.remove();
  input.click();
}

export function SlideContextMenu({
  canDelete, bg, onAddAfter, onPickLayout, onDuplicate, onDelete, onSetBg,
}: {
  canDelete: boolean;
  bg?: string | null;
  onAddAfter: () => void;
  onPickLayout: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetBg: (bg: string | null) => void;
}) {
  return (
    <ContextMenuContent>
      <ContextMenuItem onClick={onAddAfter}>
        <Plus className="size-3.5" /> Add slide after
      </ContextMenuItem>
      <ContextMenuItem onClick={onPickLayout}>
        <LayoutGrid className="size-3.5" /> New slide from layout
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={onDuplicate}>
        <Copy className="size-3.5" /> Duplicate slide
      </ContextMenuItem>
      <ContextMenuItem onClick={() => pickColor(bg || "#ffffff", onSetBg)}>
        <Paintbrush className="size-3.5" /> Slide background…
      </ContextMenuItem>
      {bg && (
        <ContextMenuItem onClick={() => onSetBg(null)}>
          <RotateCcw className="size-3.5" /> Reset background
        </ContextMenuItem>
      )}
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" disabled={!canDelete} onClick={onDelete}>
        <Trash2 className="size-3.5" /> Delete slide
      </ContextMenuItem>
    </ContextMenuContent>
  );
}
