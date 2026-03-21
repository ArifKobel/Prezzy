import type { Doc, Id } from "@Prezzy/backend/convex/_generated/dataModel";
import {
  ContextMenuContent, ContextMenuItem, ContextMenuSeparator,
  ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger,
} from "@Prezzy/ui/components/context-menu";
import {
  ArrowDown, ArrowUp, Copy, FlipHorizontal2, FlipVertical2,
  Layers, Link, RotateCcw, RotateCw, Trash2, Type, Upload, X,
} from "lucide-react";

export function ElementContextMenu({
  el, isRichText, onStartEditing, onTriggerImageUpload, onShowImageUrlDialog,
  onDuplicate, onDelete, updateProps, updateImageSrc, reorderElement,
}: {
  el: Doc<"slideElements">;
  isRichText: boolean;
  onStartEditing: (id: Id<"slideElements">) => void;
  onTriggerImageUpload: (id: Id<"slideElements">) => void;
  onShowImageUrlDialog: (id: Id<"slideElements">, src?: string) => void;
  onDuplicate: (el: Doc<"slideElements">) => void;
  onDelete: (id: Id<"slideElements">) => void;
  updateProps: (args: { id: Id<"slideElements">; props: Record<string, any> }) => void;
  updateImageSrc: (args: { id: Id<"slideElements">; src: string }) => void;
  reorderElement: (args: { id: Id<"slideElements">; action: "front" | "forward" | "backward" | "back" }) => void;
}) {
  return (
    <ContextMenuContent>
      {isRichText && (
        <>
          <ContextMenuItem onClick={() => onStartEditing(el._id)}>
            <Type className="size-3.5" /> Edit text
            <ContextMenuShortcut>↵</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
        </>
      )}
      {el.type === "image" && (
        <>
          <ContextMenuItem onClick={() => onTriggerImageUpload(el._id)}>
            <Upload className="size-3.5" /> {el.props?.src ? "Replace image" : "Upload image"}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onShowImageUrlDialog(el._id, el.props?.src)}>
            <Link className="size-3.5" /> {el.props?.src ? "Change URL" : "Image from URL"}
          </ContextMenuItem>
          {el.props?.src && (
            <ContextMenuItem onClick={() => updateImageSrc({ id: el._id, src: "" })}>
              <X className="size-3.5" /> Remove image
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
        </>
      )}
      <ContextMenuItem onClick={() => onDuplicate(el)}>
        <Copy className="size-3.5" /> Duplicate
        <ContextMenuShortcut>⌘D</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuSub>
        <ContextMenuSubTrigger><RotateCw className="size-3.5" /> Transform</ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuItem onClick={() => updateProps({ id: el._id, props: { flipX: !(el.props?.flipX ?? false) } })}>
            <FlipHorizontal2 className="size-3.5" /> Flip Horizontal
          </ContextMenuItem>
          <ContextMenuItem onClick={() => updateProps({ id: el._id, props: { flipY: !(el.props?.flipY ?? false) } })}>
            <FlipVertical2 className="size-3.5" /> Flip Vertical
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => updateProps({ id: el._id, props: { rotation: ((el.props?.rotation ?? 0) + 90) % 360 } })}>
            <RotateCw className="size-3.5" /> Rotate 90° CW
          </ContextMenuItem>
          <ContextMenuItem onClick={() => updateProps({ id: el._id, props: { rotation: ((el.props?.rotation ?? 0) + 270) % 360 } })}>
            <RotateCcw className="size-3.5" /> Rotate 90° CCW
          </ContextMenuItem>
          <ContextMenuItem onClick={() => updateProps({ id: el._id, props: { rotation: 0 } })}>
            <X className="size-3.5" /> Reset Rotation
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuSub>
        <ContextMenuSubTrigger><Layers className="size-3.5" /> Layer</ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuItem onClick={() => reorderElement({ id: el._id, action: "front" })}>
            <ArrowUp className="size-3.5" /> Bring to Front
          </ContextMenuItem>
          <ContextMenuItem onClick={() => reorderElement({ id: el._id, action: "forward" })}>
            <ArrowUp className="size-3.5 opacity-50" /> Bring Forward
          </ContextMenuItem>
          <ContextMenuItem onClick={() => reorderElement({ id: el._id, action: "backward" })}>
            <ArrowDown className="size-3.5 opacity-50" /> Send Backward
          </ContextMenuItem>
          <ContextMenuItem onClick={() => reorderElement({ id: el._id, action: "back" })}>
            <ArrowDown className="size-3.5" /> Send to Back
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" onClick={() => onDelete(el._id)}>
        <Trash2 className="size-3.5" /> Delete
        <ContextMenuShortcut>⌫</ContextMenuShortcut>
      </ContextMenuItem>
    </ContextMenuContent>
  );
}
