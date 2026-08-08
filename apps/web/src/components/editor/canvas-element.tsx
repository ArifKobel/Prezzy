import type { ElementProps, SlideElement } from "@Prezzy/shared";
import { ContextMenu, ContextMenuTrigger } from "@Prezzy/ui/components/context-menu";
import { cn } from "@Prezzy/ui/lib/utils";
import { ImagePlus, Link, Upload } from "lucide-react";
import { useCallback } from "react";

import { ImageElement } from "@/components/elements/image-element";
import { ShapeElement } from "@/components/elements/shape-element";
import { TextElement } from "@/components/elements/text-element";
import { QuizElement, WordCloudElement, LeaderboardElement, QRCodeElement } from "@/components/slide-canvas";
import { RichTextElement } from "@/components/editor/rich-text-element";
import { ElementContextMenu } from "@/components/editor/element-context-menu";
import type { EditorInstance } from "@/lib/editor/editor-state";

export function CanvasElement({
  el, isSelected, isEditing, multiSelected,
  dragOverride, rotationOverride, uploadingImageId,
  registerRef, onPointerDown, onSelect, onStartEditing, onStopEditing,
  onPersistContent, setActiveEditor, onImageUpload, onTriggerImageUpload,
  onShowImageUrlDialog, onDuplicate, onDelete,
  updateProps, updateImageSrc, reorderElement,
}: {
  el: SlideElement;
  isSelected: boolean;
  isEditing: boolean;
  multiSelected: boolean;
  dragOverride: { x: number; y: number } | undefined;
  rotationOverride: number | undefined;
  uploadingImageId: string | null;
  registerRef: (id: string, node: HTMLElement | null) => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>, el: SlideElement) => void;
  onSelect: (id: string) => void;
  onStartEditing: (id: string) => void;
  onStopEditing: () => void;
  onPersistContent: (id: string, html: string) => void;
  setActiveEditor: (e: EditorInstance | null) => void;
  onImageUpload: (file: File, id: string) => void;
  onTriggerImageUpload: (id: string) => void;
  onShowImageUrlDialog: (id: string, src?: string) => void;
  onDuplicate: (el: SlideElement) => void;
  onDelete: (id: string) => void;
  updateProps: (args: { id: string; props: ElementProps }) => void;
  updateImageSrc: (args: { id: string; src: string }) => void;
  reorderElement: (args: { id: string; action: "front" | "forward" | "backward" | "back" }) => void;
}) {
  const liveX = dragOverride?.x ?? el.x;
  const liveY = dragOverride?.y ?? el.y;
  const liveW = el.width;
  const liveH = el.height;
  const liveContent = el.props?.content ?? "";
  const isRichText = el.type === "heading" || el.type === "text";

  const setNodeRef = useCallback(
    (node: HTMLElement | null) => { registerRef(el.id, node); },
    [registerRef, el.id],
  );

  function persistContent(html: string) {
    onPersistContent(el.id, html);
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger
        ref={setNodeRef}
        style={{
          position: "absolute", display: "block",
          left: `${liveX}%`, top: `${liveY}%`, width: `${liveW}%`,
          ...(isRichText && isEditing ? { minHeight: `${liveH}%` } : { height: `${liveH}%` }),
          transform: (() => {
            const rot = rotationOverride ?? el.props?.rotation;
            return rot ? `rotate(${rot}deg)` : undefined;
          })(),
        }}
        onPointerDown={(e: React.PointerEvent<HTMLElement>) => onPointerDown(e as React.PointerEvent<HTMLDivElement>, el)}
        onClick={(e: React.MouseEvent) => { e.stopPropagation(); if (!e.shiftKey) onSelect(el.id); }}
        onContextMenu={() => onSelect(el.id)}
        onDoubleClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          if (isRichText) onStartEditing(el.id);
          if (el.type === "image" && !el.props?.src) onTriggerImageUpload(el.id);
        }}
        className={cn("select-none", !isEditing && "cursor-move", isEditing && "cursor-text")}
      >
        <div className="absolute inset-0" style={{
          transform: [
            el.props?.flipX && "scaleX(-1)",
            el.props?.flipY && "scaleY(-1)",
          ].filter(Boolean).join(" ") || undefined,
        }}>
          {isRichText && (
            isEditing ? (
              <RichTextElement
                isHeading={el.type === "heading"} liveContent={liveContent}
                onSave={(html) => { persistContent(html); onStopEditing(); }}
                onContentChange={persistContent}
                onEscape={onStopEditing}
                setActiveEditor={setActiveEditor}
              />
            ) : (
              <TextElement
                isHeading={el.type === "heading"}
                content={liveContent}
                opacity={el.props?.opacity}
                showPlaceholder
              />
            )
          )}

          {el.type === "image" && (
            <div
              className="relative h-full w-full"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const file = e.dataTransfer.files?.[0]; if (file) onImageUpload(file, el.id); }}
            >
              <ImageElement
                src={el.props?.src}
                objectFit={el.props?.objectFit}
                borderRadius={el.props?.borderRadius}
                opacity={el.props?.opacity}
              >
                {uploadingImageId === el.id ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white/80" />
                    <span className="text-[10px] font-medium text-white/60">Uploading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <ImagePlus className="size-6 text-white/50" />
                    {isSelected && (
                      <div className="flex flex-col items-center gap-1.5">
                        <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onTriggerImageUpload(el.id); }} className="flex items-center gap-1 rounded-md bg-white/20 px-3 py-1 text-[10px] font-medium text-white/80 transition-all hover:bg-white/30">
                          <Upload className="size-3" /> Upload Image
                        </button>
                        <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onShowImageUrlDialog(el.id); }} className="flex items-center gap-1 text-[10px] text-white/50 transition-all hover:text-white/70">
                          <Link className="size-3" /> or paste URL
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </ImageElement>
            </div>
          )}

          {el.type === "shape" && (
            <ShapeElement
              shapeType={el.props?.shapeType}
              color={el.props?.color}
              borderRadius={el.props?.borderRadius}
              opacity={el.props?.opacity}
            />
          )}

          {el.type === "quiz" && (
            <QuizElement el={el} />
          )}

          {el.type === "wordcloud" && (
            <WordCloudElement el={el} showPlaceholder />
          )}

          {el.type === "leaderboard" && (
            <LeaderboardElement showPlaceholder />
          )}

          {el.type === "qrcode" && (
            <QRCodeElement showPlaceholder />
          )}
        </div>

        {(isSelected || isEditing) && multiSelected && (
          <div className="pointer-events-none absolute inset-0 ring-2 ring-primary/70 ring-offset-1" />
        )}
      </ContextMenuTrigger>

      <ElementContextMenu
        el={el}
        isRichText={isRichText}
        onStartEditing={onStartEditing}
        onTriggerImageUpload={onTriggerImageUpload}
        onShowImageUrlDialog={onShowImageUrlDialog}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        updateProps={updateProps}
        updateImageSrc={updateImageSrc}
        reorderElement={reorderElement}
      />
    </ContextMenu>
  );
}
