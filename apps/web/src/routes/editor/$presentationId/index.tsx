import { api } from "@Prezzy/backend/convex/_generated/api";
import type { Doc, Id } from "@Prezzy/backend/convex/_generated/dataModel";
import { DESIGN_W, DESIGN_H } from "@/components/slide-canvas";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator,
  ContextMenuShortcut, ContextMenuTrigger,
} from "@Prezzy/ui/components/context-menu";
import { cn } from "@Prezzy/ui/lib/utils";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
  Copy, ExternalLink, Heading, Image, LayoutGrid, Paintbrush, Play, Plus,
  RotateCcw, RotateCw, Square, Trash2, Type,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ELEMENT_DEFAULTS } from "@/lib/editor/tiptap";
import { SLIDE_LAYOUTS } from "@/lib/slide-layouts";
import {
  setActiveEditorInstance, setEnterEditForSelection,
  type EditorInstance,
} from "@/lib/editor/editor-state";
import type { Geo } from "@/lib/editor/snap";

import { RichToolbar } from "@/components/editor/toolbar";
import { ElementMoveable } from "@/components/editor/element-moveable";
import { PropertiesPanel } from "@/components/editor/properties-panel";
import { SlideRail } from "@/components/editor/slide-rail";
import { ToolbarBtn } from "@/components/editor/editor-ui";
import { CanvasElement } from "@/components/editor/canvas-element";
import { ClearResponsesButton } from "@/components/editor/clear-responses-button";
import { EditableTitle } from "@/components/editor/editable-title";
import { ImageUrlDialog } from "@/components/editor/image-url-dialog";
import { LayoutPicker } from "@/components/editor/layout-picker";
import { ThemePanel } from "@/components/editor/theme-panel";
import { ZoomControls } from "@/components/editor/zoom-controls";
import {
  EditorActionsProvider, EditorStateProvider,
  type EditorActions, type EditorState as EditorCtxState,
} from "@/lib/editor/editor-context";
import { useHistory } from "@/lib/editor/history";
import { useElementDrag } from "@/lib/editor/use-element-drag";
import { useImageUpload } from "@/lib/editor/use-image-upload";
import { useMarquee } from "@/lib/editor/use-marquee";
import { useZoomPan } from "@/lib/editor/use-zoom-pan";

export const Route = createFileRoute("/editor/$presentationId/")({
  component: EditorPage,
});

function EditorPage() {
  const { presentationId } = Route.useParams();
  const pid = presentationId as Id<"presentations">;
  const navigate = useNavigate();

  const presentation = useQuery(api.presentations.get, { id: pid });
  const slides       = useQuery(api.slides.listByPresentation, { presentationId: pid });

  const createSlide    = useMutation(api.slides.create);
  const createFromLayout = useMutation(api.slides.createFromLayout);
  const duplicateSlide = useMutation(api.slides.duplicate);
  const removeSlide    = useMutation(api.slides.remove);

  const [activeSlideId, setActiveSlideId] = useState<Id<"slides"> | null>(null);

  useEffect(() => {
    if (!slides || slides.length === 0) { setActiveSlideId(null); return; }
    if (!slides.some((s) => s._id === activeSlideId)) setActiveSlideId(slides[0]._id);
  }, [slides, activeSlideId]);

  const activeSlide = slides?.find((s) => s._id === activeSlideId) ?? null;

  function switchSlide(id: Id<"slides">) {
    setActiveSlideId(id);
    setSelectedIds(new Set());
    setEditingId(null);
    setLocalGeometry(new Map());
    setLocalContent(new Map());
  }

  function handleAddSlide() {
    createSlide({ presentationId: pid, afterOrder: activeSlide?.order })
      .then((id) => switchSlide(id as Id<"slides">));
  }

  function handlePickLayout(layoutId: string) {
    const layout = SLIDE_LAYOUTS.find((l) => l.id === layoutId);
    if (!layout) return;
    setShowLayoutPicker(false);

    if (layout.slots.length === 0) {
      createSlide({ presentationId: pid, afterOrder: activeSlide?.order })
        .then((id) => switchSlide(id as Id<"slides">));
    } else {
      createFromLayout({
        presentationId: pid,
        afterOrder: activeSlide?.order,
        elements: layout.slots.map((slot) => ({
          type: slot.type,
          x: slot.x,
          y: slot.y,
          width: slot.width,
          height: slot.height,
          props: slot.props,
        })),
      }).then((id) => switchSlide(id as Id<"slides">));
    }
  }

  function handleDuplicate() {
    if (!activeSlideId) return;
    duplicateSlide({ slideId: activeSlideId })
      .then((id) => switchSlide(id as Id<"slides">));
  }

  function handleDeleteSlide() {
    if (!activeSlideId || !slides || slides.length <= 1) return;
    const idx  = slides.findIndex((s) => s._id === activeSlideId);
    const next = slides[idx + 1] ?? slides[idx - 1];
    removeSlide({ slideId: activeSlideId });
    switchSlide(next._id);
  }

  const updateTitle = useMutation(api.presentations.updateTitle);
  const updateTheme = useMutation(api.presentations.updateTheme);

  const createElement   = useMutation(api.slideElements.create);
  const updatePosition  = useMutation(api.slideElements.updatePosition);
  const updateGeometry  = useMutation(api.slideElements.updateGeometry);
  const updateContent   = useMutation(api.slideElements.updateContent);
  const updateImageSrc  = useMutation(api.slideElements.updateImageSrc);
  const updateProps     = useMutation(api.slideElements.updateProps);
  const removeElement   = useMutation(api.slideElements.remove);
  const reorderElement  = useMutation(api.slideElements.reorder);

  const elements = useQuery(
    api.slideElements.listBySlide,
    activeSlideId ? { slideId: activeSlideId } : "skip",
  );

  const history = useHistory();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.target as HTMLElement)?.closest?.(".ProseMirror")) return;

      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        history.undo();
      }
      if (mod && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        history.redo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [history]);

  const [selectedIds, setSelectedIds]     = useState<Set<Id<"slideElements">>>(new Set());
  const [editingId, setEditingId]         = useState<Id<"slideElements"> | null>(null);
  const [activeEditor, setActiveEditorState] = useState<EditorInstance | null>(null);
  const [localGeometry, setLocalGeometry] = useState<Map<Id<"slideElements">, Geo>>(new Map());
  const [localContent, setLocalContent]   = useState<Map<Id<"slideElements">, string>>(new Map());
  const [liveRotation, setLiveRotation]   = useState<{ id: Id<"slideElements">; rotation: number } | null>(null);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);

  const canvasRef       = useRef<HTMLDivElement>(null);
  const canvasAreaRef   = useRef<HTMLDivElement>(null);
  const elementRefsMap  = useRef<Map<string, HTMLElement>>(new Map());
  const moveableActive  = useRef(false);

  useEffect(() => { if (liveRotation) setLiveRotation(null); }, [elements]); // eslint-disable-line react-hooks/exhaustive-deps

  const setActiveEditor = useCallback((e: EditorInstance | null) => {
    setActiveEditorInstance(e);
    setActiveEditorState(e);
  }, []);

  const { userZoom, setUserZoom, panOffset, effectiveScale, resetZoom } = useZoomPan(canvasAreaRef);

  const {
    uploadingImageId, imageUrlInput, setImageUrlInput,
    showImageUrlDialog, setShowImageUrlDialog, fileInputRef,
    handleImageUpload, handleImageUrlSubmit, triggerImageUpload, handleFileInputChange,
  } = useImageUpload();

  const { dragPositions, snapLines, handleElementPointerDown } = useElementDrag({
    canvasRef, elements, localGeometry, setLocalGeometry,
    selectedIds, setSelectedIds, editingId, setEditingId,
    moveableActive, updatePosition, pushHistory: history.push,
  });

  const { marquee, didMarqueeRef, handleMarqueePointerDown } = useMarquee({
    canvasRef, canvasAreaRef, elements, localGeometry, setSelectedIds,
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (editingId) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.size > 0) {
        deleteElements(selectedIds);
      }
      if (e.key === "Escape") {
        if (showImageUrlDialog) { setShowImageUrlDialog(null); return; }
        setSelectedIds(new Set());
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIds, editingId, removeElement, showImageUrlDialog]);

  const INTERACTIVE_TYPES = new Set(["quiz", "wordcloud", "leaderboard", "qrcode"]);
  const hasInteractiveElement = elements?.some((el) => INTERACTIVE_TYPES.has(el.type)) ?? false;

  const sortedElements = useMemo(
    () => elements ? [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0) || a._creationTime - b._creationTime) : [],
    [elements],
  );

  function handleAddElement(type: keyof typeof ELEMENT_DEFAULTS) {
    if (!activeSlideId) return;
    if (INTERACTIVE_TYPES.has(type) && hasInteractiveElement) return;
    const d = ELEMENT_DEFAULTS[type];
    const props: Record<string, any> = {};
    if (d.content) props.content = d.content;
    if (type === "quiz") {
      props.question = "Your question here";
      props.options = ["Option A", "Option B", "Option C"];
    }
    if (type === "wordcloud") {
      props.prompt = "Share a word...";
    }
    const createArgs = {
      slideId: activeSlideId, type,
      x: d.x, y: d.y, width: d.width, height: d.height,
      props: Object.keys(props).length > 0 ? props : undefined,
    };
    createElement(createArgs).then((id) => {
      const elId = id as Id<"slideElements">;
      setSelectedIds(new Set([elId]));
      history.push({
        undo: () => { removeElement({ id: elId }); setSelectedIds(new Set()); },
        redo: () => { createElement(createArgs).then((newId) => setSelectedIds(new Set([newId as Id<"slideElements">]))); },
      });
    });
  }

  function deleteElements(ids: Set<Id<"slideElements">>) {
    if (ids.size === 0) return;
    const deleted = [...ids].map((id) => elements?.find((e) => e._id === id)).filter(Boolean) as NonNullable<typeof elements>[number][];
    ids.forEach((id) => removeElement({ id }));
    setSelectedIds(new Set());
    if (deleted.length > 0) {
      const recreatedIds: Id<"slideElements">[] = [];
      history.push({
        undo: async () => {
          recreatedIds.length = 0;
          for (const el of deleted) {
            const newId = await createElement({
              slideId: el.slideId,
              type: el.type,
              x: el.x, y: el.y, width: el.width, height: el.height,
              props: el.props ?? undefined,
              zIndex: el.zIndex ?? undefined,
            });
            recreatedIds.push(newId as Id<"slideElements">);
          }
        },
        redo: () => {
          for (const id of recreatedIds) removeElement({ id });
          setSelectedIds(new Set());
        },
      });
    }
  }

  function persistContent(id: Id<"slideElements">, html: string) {
    const cleaned = html.replace(/(<p>(\s|<br[^>]*>)*<\/p>\s*)+$/, "").trim() || html;
    setLocalContent((prev) => new Map(prev).set(id, cleaned));
    updateContent({ id, content: cleaned });
  }

  function handleDuplicateElement(el: Doc<"slideElements">) {
    if (!activeSlideId) return;
    createElement({ slideId: activeSlideId, type: el.type, x: el.x + 3, y: el.y + 3, width: el.width, height: el.height, props: el.props })
      .then((id) => setSelectedIds(new Set([id as Id<"slideElements">])));
  }

  const isEditingRichText = editingId !== null && elements?.some((el) =>
    el._id === editingId && (el.type === "heading" || el.type === "text")
  );
  const selectedTextEl = selectedIds.size === 1
    ? elements?.find((el) => selectedIds.has(el._id) && (el.type === "heading" || el.type === "text"))
    : undefined;
  const selectedEl = selectedIds.size === 1
    ? elements?.find((el) => selectedIds.has(el._id))
    : undefined;
  const showRichToolbar = isEditingRichText || !!selectedTextEl;

  // biome-ignore lint: intentional side effect syncing editor state
  useEffect(() => {
    setEnterEditForSelection(selectedTextEl ? () => setEditingId(selectedTextEl._id) : null);
  }, [selectedTextEl?._id]);

  const editorActions: EditorActions = useMemo(() => ({
    updatePosition,
    updateGeometry,
    updateProps,
    updateImageSrc,
    removeElement,
    triggerImageUpload,
    showImageUrlDialog: (id: Id<"slideElements">, src?: string) => { setShowImageUrlDialog(id); setImageUrlInput(src ?? ""); },
    handleImageUpload,
    addElement: handleAddElement,
    deselect: () => setSelectedIds(new Set()),
    setLocalGeometry: (id: Id<"slideElements">, geo: Geo) => setLocalGeometry((prev) => new Map(prev).set(id, geo)),
  }), [updatePosition, updateGeometry, updateProps, updateImageSrc, removeElement, handleImageUpload]);

  const editorCtxState: EditorCtxState = useMemo(() => ({
    activeSlideId,
    localGeometry,
    uploadingImageId,
    hasInteractiveElement,
  }), [activeSlideId, localGeometry, uploadingImageId, hasInteractiveElement]);

  if (presentation === undefined || slides === undefined) {
    return <div className="flex h-full items-center justify-center bg-surface"><p className="font-sans text-sm text-muted-foreground">Loading…</p></div>;
  }
  if (presentation === null) {
    return <div className="flex h-full items-center justify-center bg-surface"><p className="font-sans text-sm text-muted-foreground">Presentation not found.</p></div>;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface">

      <div className="flex items-center gap-3 border-b border-border bg-surface px-3 py-1.5">
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="flex shrink-0 items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-surface-container"
          title="Back to dashboard"
        >
          <img src="/logo.svg" alt="" className="size-6" />
        </button>

        <div className="flex min-w-0 flex-1 flex-col">
          <EditableTitle
            title={presentation.title}
            onRename={(title) => updateTitle({ id: pid, title })}
          />
          <div className="flex items-center gap-0.5 -mt-0.5">
            <span className="rounded px-1.5 py-0.5 font-sans text-[10px] text-muted-foreground/60 transition-colors hover:bg-surface-container hover:text-muted-foreground cursor-default">
              {slides?.length ?? 0} slide{(slides?.length ?? 0) !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowThemePanel((v) => !v); }}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-sans text-[11px] font-medium transition-all",
              showThemePanel
                ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                : "text-muted-foreground hover:bg-surface-container hover:text-foreground",
            )}
          >
            <Paintbrush className="size-3.5" /> Theme
          </button>
          <div className="flex items-center">
            <button
              onClick={() => navigate({ to: `/present/${presentationId}${activeSlideId ? `?slide=${activeSlideId}` : ""}` })}
              className="flex items-center gap-1.5 rounded-l-md bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-dim))] px-4 py-1.5 text-xs font-medium tracking-wide text-primary-foreground shadow-[0_4px_12px_rgba(78,96,115,0.3)] transition-all hover:brightness-110 active:scale-[0.99]"
            >
              <Play className="size-3 fill-current" />Present
            </button>
            <button
              onClick={() => window.open(`/present/${presentationId}${activeSlideId ? `?slide=${activeSlideId}` : ""}`, "_blank")}
              className="flex items-center self-stretch rounded-r-md border-l border-primary-foreground/20 bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-dim))] px-2.5 text-primary-foreground shadow-[0_4px_12px_rgba(78,96,115,0.3)] transition-all hover:brightness-110 active:scale-[0.99]"
              title="Open in new window"
            >
              <ExternalLink className="size-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center border-b border-border bg-surface px-3 py-1">
        <div className="flex items-center gap-0.5">
          <ToolbarBtn icon={<Plus className="size-3.5" />} label="ADD" onClick={handleAddSlide} />
          <ToolbarBtn icon={<LayoutGrid className="size-3.5" />} label="LAYOUT" onClick={() => setShowLayoutPicker(true)} />
          <ToolbarBtn icon={<Copy className="size-3.5" />} label="DUPLICATE" onClick={handleDuplicate} disabled={!activeSlideId} />
          <ToolbarBtn
            icon={<Trash2 className="size-3.5 text-destructive" />}
            label="DELETE" onClick={handleDeleteSlide}
            disabled={!activeSlideId || (slides?.length ?? 0) <= 1}
            className="text-destructive hover:text-destructive disabled:text-destructive/30"
          />
        </div>

        <div className="mx-2 h-4 w-px bg-border" />

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => history.undo()}
            disabled={!history.canUndo}
            title="Undo (⌘Z)"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-surface-container hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
          >
            <RotateCcw className="size-3.5" />
          </button>
          <button
            onClick={() => history.redo()}
            disabled={!history.canRedo}
            title="Redo (⌘⇧Z)"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-surface-container hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
          >
            <RotateCw className="size-3.5" />
          </button>
        </div>

      </div>

      {showRichToolbar && (
        <div className="flex items-center border-b border-border bg-surface-container-lowest px-3 py-1">
          <RichToolbar
            editor={activeEditor}
            contentHtml={selectedTextEl ? (localContent.get(selectedTextEl._id) ?? selectedTextEl.props?.content ?? "") : ""}
          />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

        <SlideRail slides={slides} activeSlideId={activeSlideId} presentationId={pid} onSwitchSlide={switchSlide} onAddSlide={handleAddSlide} theme={presentation.theme} />
        <div
          ref={canvasAreaRef}
          className="relative flex flex-1 items-center justify-center overflow-hidden bg-surface"
          onClick={() => {
            if (didMarqueeRef.current) { didMarqueeRef.current = false; return; }
            setSelectedIds(new Set()); setEditingId(null);
          }}
          onPointerDown={handleMarqueePointerDown}
        >
          <ContextMenu>
          <ContextMenuTrigger
            ref={canvasRef}
            className="relative overflow-hidden rounded-sm shadow-[0_12px_40px_rgba(47,51,51,0.08)]"
            style={{
              display: "block", position: "absolute",
              width: DESIGN_W, height: DESIGN_H,
              left: `calc(50% + ${panOffset.x}px)`, top: `calc(50% + ${panOffset.y}px)`,
              transform: `translate(-50%, -50%) scale(${effectiveScale})`,
              transformOrigin: "center",
              backgroundColor: presentation.theme?.backgroundColor || "var(--color-card)",
              ...(presentation.theme?.primaryColor && {
                "--color-primary": presentation.theme.primaryColor,
                "--color-primary-dim": presentation.theme.primaryColor,
              } as React.CSSProperties),
              ...(presentation.theme?.secondaryColor && {
                "--color-secondary": presentation.theme.secondaryColor,
                "--color-secondary-container": presentation.theme.secondaryColor,
              } as React.CSSProperties),
              ...(presentation.theme?.textColor && {
                "--color-foreground": presentation.theme.textColor,
              } as React.CSSProperties),
            }}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              if (didMarqueeRef.current) { didMarqueeRef.current = false; return; }
              setSelectedIds(new Set());
              if (editingId) setEditingId(null);
            }}
          >
            {!activeSlide ? (
              <div className="flex h-full items-center justify-center">
                <p className="font-sans text-sm text-muted-foreground/40">No slide selected</p>
              </div>
            ) : elements === undefined ? null : elements.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 select-none">
                <p className="font-sans text-xs text-muted-foreground/30">Add elements from the panel →</p>
              </div>
            ) : (
              sortedElements.map((el) => (
                <CanvasElement
                  key={el._id}
                  el={el}
                  isSelected={selectedIds.has(el._id)}
                  isEditing={editingId === el._id}
                  multiSelected={selectedIds.size > 1}
                  geoOverride={localGeometry.get(el._id)}
                  dragOverride={dragPositions.get(el._id)}
                  liveContent={localContent.get(el._id) ?? el.props?.content ?? ""}
                  rotationOverride={liveRotation?.id === el._id ? liveRotation.rotation : undefined}
                  uploadingImageId={uploadingImageId}
                  registerRef={(id, node) => {
                    if (node) elementRefsMap.current.set(id, node);
                    else elementRefsMap.current.delete(id);
                  }}
                  onPointerDown={handleElementPointerDown}
                  onSelect={(id) => setSelectedIds(new Set([id]))}
                  onStartEditing={(id) => setEditingId(id)}
                  onStopEditing={() => setEditingId(null)}
                  onPersistContent={persistContent}
                  setActiveEditor={setActiveEditor}
                  onImageUpload={handleImageUpload}
                  onTriggerImageUpload={triggerImageUpload}
                  onShowImageUrlDialog={(id, src) => { setShowImageUrlDialog(id); setImageUrlInput(src ?? ""); }}
                  onDuplicate={handleDuplicateElement}
                  onDelete={(id) => deleteElements(new Set([id]))}
                  updateProps={updateProps}
                  updateImageSrc={updateImageSrc}
                  reorderElement={reorderElement}
                />
              ))
            )}

            {snapLines.vLines.map((x) => (
              <div key={`v${x}`} className="pointer-events-none absolute inset-y-0 z-40 w-px bg-primary/60" style={{ left: `${x}%` }} />
            ))}
            {snapLines.hLines.map((y) => (
              <div key={`h${y}`} className="pointer-events-none absolute inset-x-0 z-40 h-px bg-primary/60" style={{ top: `${y}%` }} />
            ))}
            {selectedIds.size === 1 && (() => {
              const selId = [...selectedIds][0];
              const targetNode = elementRefsMap.current.get(selId);
              const selEl = elements?.find((e) => e._id === selId);
              if (!targetNode || !selEl) return null;
              return (
                <ElementMoveable
                  targetNode={targetNode}
                  container={canvasRef.current}
                  elementId={selId}
                  effectiveScale={effectiveScale}
                  geo={localGeometry.get(selId) ?? { x: selEl.x, y: selEl.y, width: selEl.width, height: selEl.height }}
                  dragPosition={dragPositions.get(selId)}
                  rotation={liveRotation?.id === selId ? liveRotation.rotation : (selEl.props?.rotation ?? 0)}
                  onInteractionStart={() => { moveableActive.current = true; }}
                  onInteractionEnd={() => { moveableActive.current = false; }}
                  onGeometryChange={(id, geo) => setLocalGeometry((prev) => new Map(prev).set(id, geo))}
                  onGeometryCommit={(id, geo) => updateGeometry({ id, ...geo })}
                  onRotationChange={(id, rotation) => setLiveRotation({ id, rotation })}
                  onRotationCommit={(id, rotation) => updateProps({ id, props: { rotation } })}
                />
              );
            })()}
          </ContextMenuTrigger>

          <ContextMenuContent>
            <ContextMenuItem onClick={() => handleAddElement("heading")}><Heading className="size-3.5" /> Add Heading</ContextMenuItem>
            <ContextMenuItem onClick={() => handleAddElement("text")}><Type className="size-3.5" /> Add Text</ContextMenuItem>
            <ContextMenuItem onClick={() => handleAddElement("image")}><Image className="size-3.5" /> Add Image</ContextMenuItem>
            <ContextMenuItem onClick={() => handleAddElement("shape")}><Square className="size-3.5" /> Add Shape</ContextMenuItem>
            {selectedIds.size > 0 && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem variant="destructive" onClick={() => deleteElements(selectedIds)}>
                  <Trash2 className="size-3.5" /> Delete selected
                  <ContextMenuShortcut>⌫</ContextMenuShortcut>
                </ContextMenuItem>
              </>
            )}
          </ContextMenuContent>
          </ContextMenu>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInputChange} />

          {showImageUrlDialog && (
            <ImageUrlDialog
              value={imageUrlInput}
              onChange={setImageUrlInput}
              onSubmit={() => handleImageUrlSubmit(showImageUrlDialog)}
              onClose={() => setShowImageUrlDialog(null)}
            />
          )}

          {showLayoutPicker && (
            <LayoutPicker onPick={handlePickLayout} onClose={() => setShowLayoutPicker(false)} />
          )}

          {marquee && canvasRef.current && (() => {
            const cr = canvasRef.current!.getBoundingClientRect();
            const ar = canvasAreaRef.current?.getBoundingClientRect();
            if (!ar) return null;
            const left   = cr.left - ar.left + (marquee.x / 100) * cr.width;
            const top    = cr.top  - ar.top  + (marquee.y / 100) * cr.height;
            const width  = (marquee.w / 100) * cr.width;
            const height = (marquee.h / 100) * cr.height;
            if (Math.abs(width) < 2 && Math.abs(height) < 2) return null;
            return <div className="pointer-events-none absolute z-50 rounded border border-primary bg-primary/10" style={{ left, top, width: Math.abs(width), height: Math.abs(height) }} />;
          })()}

          <ZoomControls zoom={userZoom} setZoom={setUserZoom} onReset={resetZoom} />

        </div>

        <div className="flex w-[300px] shrink-0 flex-col overflow-hidden bg-background">
          <EditorActionsProvider value={editorActions}>
          <EditorStateProvider value={editorCtxState}>
          {showThemePanel ? (
            <ThemePanel
              theme={presentation.theme}
              onUpdate={(t) => updateTheme({ id: pid, theme: t })}
              onClose={() => setShowThemePanel(false)}
            />
          ) : (
            <PropertiesPanel selectedEl={selectedEl} />
          )}

          <div className="flex shrink-0 items-center justify-between border-t border-border px-4 py-2">
            <span className="font-sans text-[10px] tracking-wide text-muted-foreground/60">
              {slides.length} slide{slides.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-3">
              <ClearResponsesButton presentationId={pid} />
              <div className="flex items-center gap-1.5">
                <div className="size-1.5 rounded-full bg-green-500" />
                <span className="font-sans text-[10px] tracking-wide text-muted-foreground/60">CLOUD SYNCED</span>
              </div>
            </div>
          </div>
          </EditorStateProvider>
          </EditorActionsProvider>
        </div>
      </div>

    </div>
  );
}
