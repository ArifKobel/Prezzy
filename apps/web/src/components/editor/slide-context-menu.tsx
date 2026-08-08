import {
  ContextMenuContent, ContextMenuItem, ContextMenuSeparator,
} from "@Prezzy/ui/components/context-menu";
import { Copy, LayoutGrid, Plus, Trash2 } from "lucide-react";

export function SlideContextMenu({
  canDelete, onAddAfter, onPickLayout, onDuplicate, onDelete,
}: {
  canDelete: boolean;
  onAddAfter: () => void;
  onPickLayout: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
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
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" disabled={!canDelete} onClick={onDelete}>
        <Trash2 className="size-3.5" /> Delete slide
      </ContextMenuItem>
    </ContextMenuContent>
  );
}
