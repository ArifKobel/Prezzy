import type { ElementProps, SlideElement } from "@Prezzy/shared";
import { DESIGN_W, DESIGN_H } from "@/components/slide-canvas";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator,
  ContextMenuShortcut, ContextMenuTrigger,
} from "@Prezzy/ui/components/context-menu";
import { cn } from "@Prezzy/ui/lib/utils";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { useElementMutations } from "@/lib/editor/use-element-mutations";
import { useImageUpload } from "@/lib/editor/use-image-upload";
import { useMarquee } from "@/lib/editor/use-marquee";
import { useZoomPan } from "@/lib/editor/use-zoom-pan";
import { useSlideElements } from "@/lib/api/elements";
import {
  usePresentation, useUpdatePresentationTheme, useUpdatePresentationTitle,
} from "@/lib/api/presentations";
import {
  useCreateSlide, useCreateSlideFromLayout, useDuplicateSlide, useRemoveSlide, useSlides,
} from "@/lib/api/slides";
import { useRealtime } from "@/lib/api/socket";

export const Route = createFileRoute("/editor/$presentationId/")({
  component: EditorPage,
});

function EditorPage() {
  const { presentationId } = Route.useParams();
  const pid = presentationId;
  const navigate = useNavigate();

  useRealtime(`presentation:${pid}`);

  const { data: presentation } = usePresentation(pid);
  const { data: slides }       = useSlides(pid);

  const createSlide    = useCreateSlide();
  const createFromLayout = useCreateSlideFromLayout();
  const duplicateSlide = useDuplicateSlide();
  const removeSlide    = useRemoveSlide();

  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const pendingSlideId = useRef<string | null>(null);

  useEffect(() => {
    if (!slides) return;
    if (activeSlideId && slides.some((s) => s.id === activeSlideId)) {
      pendingSlideId.current = null;
      return;
    }
    if (pendingSlideId.current !== null && pendingSlideId.current === activeSlideId) return;
    setActiveSlideId(slides.length > 0 ? slides[0].id : null);
  }, [slides, activeSlideId]);

  const activeSlide = slides?.find((s) => s.id === activeSlideId) ?? null;

  function switchSlide(id: string, isNew = false) {
    pendingSlideId.current = isNew ? id : null;
    setActiveSlideId(id);
    setSelectedIds(new Set());
    setEditingId(null);
  }

  function handleAddSlide() {
    createSlide({ presentationId: pid, afterOrder: activeSlide?.order })
      .then((slide) => switchSlide(slide.id, true))
      .catch(console.error);
  }

  function handlePickLayout(layoutId: string) {
    const layout = SLIDE_LAYOUTS.find((l) => l.id === layoutId);
    if (!layout) return;
    setShowLayoutPicker(false);

    if (layout.slots.length === 0) {
      createSlide({ presentationId: pid, afterOrder: activeSlide?.order })
        .then((slide) => switchSlide(slide.id, true))
        .catch(console.error);
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
      }).then((slide) => switchSlide(slide.id, true)).catch(console.error);
    }
  }

  function handleDuplicate() {
    if (!activeSlideId) return;
    duplicateSlide({ slideId: activeSlideId })
      .then((slide) => switchSlide(slide.id, true))
      .catch(console.error);
  }

  function handleDeleteSlide() {
    if (!activeSlideId || !slides || slides.length <= 1) return;
    const idx  = slides.findIndex((s) => s.id === activeSlideId);
    const next = slides[idx + 1] ?? slides[idx - 1];
    removeSlide({ slideId: activeSlideId });
    switchSlide(next.id);
  }

  const updateTitle = useUpdatePresentationTitle();
  const updateTheme = useUpdatePresentationTheme();

  const {
    createElement, removeElement, reorderElement,
    updatePosition, updateGeometry, updateContent, updateImageSrc, updateProps,
  } = useElementMutations();

  const { data: elements } = useSlideElements(activeSlideId);

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

  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set());
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [activeEditor, setActiveEditorState] = useState<EditorInstance | null>(null);
  const [elementNodes, setElementNodes]   = useState<Map<string, HTMLElement>>(new Map());
  const [liveRotation, setLiveRotation]   = useState<{ id: string; rotation: number } | null>(null);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);

  const canvasRef       = useRef<HTMLDivElement>(null);
  const canvasAreaRef   = useRef<HTMLDivElement>(null);
  const moveableActive  = useRef(false);

  const registerElementRef = useCallback((id: string, node: HTMLElement | null) => {
    setElementNodes((prev) => {
      if (node) {
        if (prev.get(id) === node) return prev;
        return new Map(prev).set(id, node);
      }
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

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
    canvasRef, elements,
    selectedIds, setSelectedIds, editingId, setEditingId,
    moveableActive, updatePosition, pushHistory: history.push, liveId: history.liveId,
  });

  const { marquee, didMarqueeRef, handleMarqueePointerDown } = useMarquee({
    canvasRef, canvasAreaRef, elements, setSelectedIds,
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
  }, [selectedIds, editingId, elements, removeElement, showImageUrlDialog]);

  const INTERACTIVE_TYPES = new Set(["quiz", "wordcloud", "leaderboard", "qrcode"]);
  const hasInteractiveElement = elements?.some((el) => INTERACTIVE_TYPES.has(el.type)) ?? false;

  const sortedElements = useMemo(
    () => elements ? [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0) || a.createdAt - b.createdAt) : [],
    [elements],
  );

  function handleAddElement(type: keyof typeof ELEMENT_DEFAULTS) {
    if (!activeSlideId) return;
    if (INTERACTIVE_TYPES.has(type) && hasInteractiveElement) return;
    const d = ELEMENT_DEFAULTS[type];
    const props: ElementProps = {};
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
    createElement(createArgs).then((created) => {
      const elId = created.id;
      setSelectedIds(new Set([elId]));
      history.push({
        undo: async () => {
          await removeElement({ id: history.liveId(elId) });
          setSelectedIds(new Set());
        },
        redo: async () => {
          const recreated = await createElement(createArgs);
          history.aliasId(elId, recreated.id);
          setSelectedIds(new Set([recreated.id]));
        },
      });
    }).catch(console.error);
  }

  function deleteElements(ids: Set<string>) {
    if (ids.size === 0) return;
    const deleted = [...ids].map((id) => elements?.find((e) => e.id === id)).filter(Boolean) as SlideElement[];
    if (deleted.length === 0) return;
    for (const el of deleted) removeElement({ id: el.id });
    setSelectedIds(new Set());
    history.push({
      undo: async () => {
        for (const el of deleted) {
          const recreated = await createElement({
            slideId: el.slideId,
            type: el.type,
            x: el.x, y: el.y, width: el.width, height: el.height,
            props: el.props ?? undefined,
            zIndex: el.zIndex ?? undefined,
          });
          history.aliasId(el.id, recreated.id);
        }
      },
      redo: async () => {
        for (const el of deleted) await removeElement({ id: history.liveId(el.id) });
        setSelectedIds(new Set());
      },
    });
  }

  function persistContent(id: string, html: string) {
    const cleaned = html.replace(/(<p>(\s|<br[^>]*>)*<\/p>\s*)+$/, "").trim() || html;
    const previous = elements?.find((e) => e.id === id)?.props?.content ?? "";
    if (previous === cleaned) return;
    updateContent({ id, content: cleaned });
    history.push({
      undo: () => updateContent({ id: history.liveId(id), content: previous }),
      redo: () => updateContent({ id: history.liveId(id), content: cleaned }),
    });
  }

  function handleDuplicateElement(el: SlideElement) {
    if (!activeSlideId) return;
    createElement({ slideId: activeSlideId, type: el.type, x: el.x + 3, y: el.y + 3, width: el.width, height: el.height, props: el.props ?? undefined })
      .then((created) => setSelectedIds(new Set([created.id])))
      .catch(console.error);
  }

  const isEditingRichText = editingId !== null && elements?.some((el) =>
    el.id === editingId && (el.type === "heading" || el.type === "text")
  );
  const selectedTextEl = selectedIds.size === 1
    ? elements?.find((el) => selectedIds.has(el.id) && (el.type === "heading" || el.type === "text"))
    : undefined;
  const selectedEl = selectedIds.size === 1
    ? elements?.find((el) => selectedIds.has(el.id))
    : undefined;
  const showRichToolbar = isEditingRichText || !!selectedTextEl;

  // biome-ignore lint: intentional side effect syncing editor state
  useEffect(() => {
    setEnterEditForSelection(selectedTextEl ? () => setEditingId(selectedTextEl.id) : null);
  }, [selectedTextEl?.id]);

  const editorActions: EditorActions = useMemo(() => ({
    updatePosition,
    updateGeometry,
    updateProps,
    updateImageSrc,
    removeElement,
    deleteElement: (id: string) => deleteElements(new Set([id])),
    triggerImageUpload,
    showImageUrlDialog: (id: string, src?: string) => { setShowImageUrlDialog(id); setImageUrlInput(src ?? ""); },
    handleImageUpload,
    addElement: handleAddElement,
    deselect: () => setSelectedIds(new Set()),
  }), [updatePosition, updateGeometry, updateProps, updateImageSrc, removeElement, handleImageUpload, activeSlideId, elements, hasInteractiveElement]);

  const editorCtxState: EditorCtxState = useMemo(() => ({
    activeSlideId,
    uploadingImageId,
    hasInteractiveElement,
  }), [activeSlideId, uploadingImageId, hasInteractiveElement]);

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
          {showRichToolbar && (
            <div
              className="absolute left-1/2 top-4 z-50 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-xl bg-surface-container-lowest/85 px-2 py-1.5 shadow-pop ring-1 ring-outline-variant/20 backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <RichToolbar
                editor={activeEditor}
                contentHtml={selectedTextEl?.props?.content ?? ""}
              />
            </div>
          )}

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
                  key={el.id}
                  el={el}
                  isSelected={selectedIds.has(el.id)}
                  isEditing={editingId === el.id}
                  multiSelected={selectedIds.size > 1}
                  dragOverride={dragPositions.get(el.id)}
                  rotationOverride={liveRotation?.id === el.id ? liveRotation.rotation : undefined}
                  uploadingImageId={uploadingImageId}
                  registerRef={registerElementRef}
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
              const targetNode = elementNodes.get(selId);
              const selEl = elements?.find((e) => e.id === selId);
              if (!targetNode || !selEl) return null;
              const prevGeo = { x: selEl.x, y: selEl.y, width: selEl.width, height: selEl.height };
              const prevRotation = selEl.props?.rotation ?? 0;
              return (
                <ElementMoveable
                  targetNode={targetNode}
                  container={canvasRef.current}
                  elementId={selId}
                  effectiveScale={effectiveScale}
                  geo={prevGeo}
                  dragPosition={dragPositions.get(selId)}
                  rotation={liveRotation?.id === selId ? liveRotation.rotation : prevRotation}
                  onInteractionStart={() => { moveableActive.current = true; }}
                  onInteractionEnd={() => { moveableActive.current = false; }}
                  onGeometryCommit={(id, geo) => {
                    updateGeometry({ id, ...geo });
                    history.push({
                      undo: () => updateGeometry({ id: history.liveId(id), ...prevGeo }),
                      redo: () => updateGeometry({ id: history.liveId(id), ...geo }),
                    });
                  }}
                  onRotationChange={(id, rotation) => setLiveRotation({ id, rotation })}
                  onRotationCommit={(id, rotation) => {
                    updateProps({ id, props: { rotation } });
                    history.push({
                      undo: () => updateProps({ id: history.liveId(id), props: { rotation: prevRotation } }),
                      redo: () => updateProps({ id: history.liveId(id), props: { rotation } }),
                    });
                  }}
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
            <ClearResponsesButton presentationId={pid} />
          </div>
          </EditorStateProvider>
          </EditorActionsProvider>
        </div>
      </div>

    </div>
  );
}
