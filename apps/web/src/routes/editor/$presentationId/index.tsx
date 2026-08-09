import type { ElementProps, ElementType, Presentation, Slide, SlideElement } from "@Prezzy/shared";
import { resolveSlideTheme } from "@Prezzy/shared/theme";
import { DESIGN_W, DESIGN_H, slideThemeStyle } from "@/components/slide-canvas";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator,
  ContextMenuShortcut, ContextMenuTrigger,
} from "@Prezzy/ui/components/context-menu";
import { cn } from "@Prezzy/ui/lib/utils";
import { useIsMutating } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ExternalLink, Heading, Image, Paintbrush, Play,
  RotateCcw, RotateCw, Square, Trash2, Type,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ELEMENT_DEFAULTS, applyToContentHtml } from "@/lib/editor/tiptap";
import { SLIDE_LAYOUTS } from "@/lib/slide-layouts";
import {
  setActiveEditorInstance, setEnterEditForSelection,
  type EditorInstance,
} from "@/lib/editor/editor-state";

import { RichToolbar } from "@/components/editor/toolbar";
import { ElementMoveable } from "@/components/editor/element-moveable";
import { PropertiesPanel } from "@/components/editor/properties-panel";
import { SlideRail } from "@/components/editor/slide-rail";
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
import {
  EditorContext, useEditorState, useEditorStore, useInteraction, useSlideElements,
} from "@/lib/editor/use-editor";
import type { SyncStatus } from "@/lib/editor/sync";
import { useCanvasPointer } from "@/lib/editor/use-canvas-pointer";
import { useEditorDoc } from "@/lib/editor/use-editor-doc";
import { useImageUpload } from "@/lib/editor/use-image-upload";
import { useZoomPan } from "@/lib/editor/use-zoom-pan";
import {
  useUpdatePresentationTheme, useUpdatePresentationTitle,
} from "@/lib/api/presentations";
import {
  useCreateSlide, useCreateSlideFromLayout, useDuplicateSlide, useRemoveSlide,
} from "@/lib/api/slides";
import { useRealtime } from "@/lib/api/socket";

export const Route = createFileRoute("/editor/$presentationId/")({
  component: EditorPage,
});

const INTERACTIVE_TYPES = new Set(["quiz", "wordcloud", "leaderboard", "qrcode"]);

type ElementSnapshot = Pick<SlideElement, "type" | "x" | "y" | "width" | "height" | "props">;

let elementClipboard: ElementSnapshot[] = [];

const EMPTY_POSITIONS: ReadonlyMap<string, { x: number; y: number }> = new Map();
const EMPTY_SNAP_LINES: { vLines: number[]; hLines: number[] } = { vLines: [], hLines: [] };

function EditorPage() {
  const { presentationId } = Route.useParams();
  return <EditorShell key={presentationId} pid={presentationId} />;
}

function EditorShell({ pid }: { pid: string }) {
  useRealtime(`presentation:${pid}`);
  const { store, interaction, ready, syncStatus, presentation, adoptSlide } = useEditorDoc(pid);
  const contextValue = useMemo(() => ({ store, interaction }), [store, interaction]);

  if (presentation === null) {
    return <div className="flex h-full items-center justify-center bg-surface"><p className="font-sans text-sm text-muted-foreground">Presentation not found.</p></div>;
  }
  if (presentation === undefined || !ready) {
    return <div className="flex h-full items-center justify-center bg-surface"><p className="font-sans text-sm text-muted-foreground">Loading…</p></div>;
  }

  return (
    <EditorContext.Provider value={contextValue}>
      <EditorBody pid={pid} presentation={presentation} syncStatus={syncStatus} adoptSlide={adoptSlide} />
    </EditorContext.Provider>
  );
}

function EditorBody({
  pid, presentation, syncStatus, adoptSlide,
}: {
  pid: string;
  presentation: Presentation;
  syncStatus: SyncStatus;
  adoptSlide: (slide: Slide) => Promise<void>;
}) {
  const navigate = useNavigate();
  const store = useEditorStore();
  const interaction = useInteraction();

  const slides = useEditorState((state) => state.slides);
  const activeSlideId = useEditorState((state) => state.activeSlideId);
  const selectedIds = useEditorState((state) => state.selectedIds);
  const canUndo = useEditorState((state) => state.canUndo);
  const canRedo = useEditorState((state) => state.canRedo);
  const editingId = useEditorState((state) =>
    state.interaction.kind === "text" ? state.interaction.id : null,
  );
  const dragPositions = useEditorState((state) =>
    state.interaction.kind === "drag" ? state.interaction.positions : EMPTY_POSITIONS,
  );
  const snapLines = useEditorState((state) =>
    state.interaction.kind === "drag" ? state.interaction.snapLines : EMPTY_SNAP_LINES,
  );
  const marqueeRect = useEditorState((state) =>
    state.interaction.kind === "marquee" ? state.interaction.rect : null,
  );
  const allElements = useEditorState((state) => state.elements);
  const elements = useSlideElements();

  const activeSlide = slides.find((s) => s.id === activeSlideId) ?? null;

  const createSlide = useCreateSlide();
  const createFromLayout = useCreateSlideFromLayout();
  const duplicateSlide = useDuplicateSlide();
  const removeSlide = useRemoveSlide();
  const updateTitle = useUpdatePresentationTitle();
  const updateTheme = useUpdatePresentationTheme();

  const isMutating = useIsMutating() > 0;
  const isSaving = syncStatus === "saving" || isMutating;

  const [activeEditor, setActiveEditorState] = useState<EditorInstance | null>(null);
  const [elementNodes, setElementNodes] = useState<Map<string, HTMLElement>>(new Map());
  const [liveRotation, setLiveRotation] = useState<{ id: string; rotation: number } | null>(null);
  const [livePropsPreview, setLivePropsPreview] = useState<{ id: string; props: ElementProps } | null>(null);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const moveableActive = useRef(false);

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

  useEffect(() => {
    setLiveRotation((prev) => (prev ? null : prev));
    setLivePropsPreview((prev) => (prev ? null : prev));
  }, [elements]);

  const setActiveEditor = useCallback((e: EditorInstance | null) => {
    setActiveEditorInstance(e);
    setActiveEditorState(e);
  }, []);

  const { userZoom, setUserZoom, panOffset, effectiveScale, resetZoom } = useZoomPan(canvasAreaRef);

  const updateImageSrc = useCallback(
    ({ id, src }: { id: string; src: string }) => store.setProps(id, { src }),
    [store],
  );

  const {
    uploadingImageId, imageUrlInput, setImageUrlInput,
    showImageUrlDialog, setShowImageUrlDialog, fileInputRef,
    handleImageUpload, handleImageUrlSubmit, triggerImageUpload, handleFileInputChange,
  } = useImageUpload({ updateImageSrc });

  const {
    handleElementPointerDown, handleCanvasPointerDown, didDragRef, didMarqueeRef,
  } = useCanvasPointer({ canvasRef, canvasAreaRef, store, interaction, moveableActive });

  const elementsBySlide = useMemo(() => {
    const map = new Map<string, SlideElement[]>();
    for (const el of allElements) {
      const list = map.get(el.slideId);
      if (list) list.push(el);
      else map.set(el.slideId, [el]);
    }
    return map;
  }, [allElements]);

  const deleteElements = useCallback((ids: Iterable<string>) => {
    store.removeElements([...ids]);
  }, [store]);

  const persistContent = useCallback((id: string, html: string) => {
    const cleaned = html.replace(/(<p>(\s|<br[^>]*>)*<\/p>\s*)+$/, "").trim() || html;
    const previous = store.getState().elements.find((el) => el.id === id)?.props?.content ?? "";
    if (previous === cleaned) return;
    store.setProps(id, { content: cleaned });
  }, [store]);

  const pasteElements = useCallback((source: ElementSnapshot[], offset = 3) => {
    const state = store.getState();
    if (!state.activeSlideId) return;
    let hasInteractive = state.elements.some(
      (el) => el.slideId === state.activeSlideId && INTERACTIVE_TYPES.has(el.type),
    );
    const created: string[] = [];
    for (const c of source) {
      if (INTERACTIVE_TYPES.has(c.type)) {
        if (hasInteractive) continue;
        hasInteractive = true;
      }
      const id = store.addElement({
        type: c.type,
        x: Math.min(c.x + offset, 95),
        y: Math.min(c.y + offset, 95),
        width: c.width,
        height: c.height,
        props: c.props ?? undefined,
      });
      if (id) created.push(id);
    }
    if (created.length > 0) store.selectMany(created);
  }, [store]);

  const handleAddElement = useCallback((type: ElementType) => {
    const state = store.getState();
    if (!state.activeSlideId) return;
    const hasInteractive = state.elements.some(
      (el) => el.slideId === state.activeSlideId && INTERACTIVE_TYPES.has(el.type),
    );
    if (INTERACTIVE_TYPES.has(type) && hasInteractive) return;
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
    store.addElement({
      type,
      x: d.x, y: d.y, width: d.width, height: d.height,
      props: Object.keys(props).length > 0 ? props : undefined,
    });
  }, [store]);

  const handleFitHeight = useCallback((id: string, height: number) => {
    const el = store.getState().elements.find((item) => item.id === id);
    if (!el) return;
    store.silently(() => {
      store.setGeometry(id, { x: el.x, y: el.y, width: el.width, height });
      store.setProps(id, { heightFitted: true });
    });
  }, [store]);

  const handleDuplicateElement = useCallback((el: SlideElement) => {
    pasteElements([el]);
  }, [pasteElements]);

  function handleAddSlide(afterSlideId?: string) {
    const after = afterSlideId ? slides.find((s) => s.id === afterSlideId) : activeSlide;
    createSlide({ presentationId: pid, afterOrder: after?.order })
      .then(async (slide) => {
        await adoptSlide(slide);
        store.setActiveSlide(slide.id);
      })
      .catch(console.error);
  }

  function handlePickLayout(layoutId: string) {
    const layout = SLIDE_LAYOUTS.find((l) => l.id === layoutId);
    if (!layout) return;
    setShowLayoutPicker(false);

    const request = layout.slots.length === 0
      ? createSlide({ presentationId: pid, afterOrder: activeSlide?.order })
      : createFromLayout({
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
        });

    request
      .then(async (slide) => {
        await adoptSlide(slide);
        store.setActiveSlide(slide.id);
      })
      .catch(console.error);
  }

  function handleDuplicateSlide(slideId: string) {
    duplicateSlide({ slideId })
      .then(async (slide) => {
        await adoptSlide(slide);
        store.setActiveSlide(slide.id);
      })
      .catch(console.error);
  }

  function handleDeleteSlide(slideId: string) {
    if (slides.length <= 1) return;
    const idx = slides.findIndex((s) => s.id === slideId);
    if (idx === -1) return;
    const next = slides[idx + 1] ?? slides[idx - 1];
    removeSlide({ slideId }).catch(console.error);
    if (slideId === activeSlideId && next) store.setActiveSlide(next.id);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.target as HTMLElement)?.closest?.(".ProseMirror")) return;

      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        store.undo();
      }
      if (mod && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        store.redo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [store]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.closest?.(".ProseMirror")) return;
      const state = store.getState();
      if (state.interaction.kind === "text") return;
      const mod = e.metaKey || e.ctrlKey;
      const slideElements = state.elements.filter((el) => el.slideId === state.activeSlideId);
      const selected = slideElements.filter((el) => state.selectedIds.has(el.id));

      if ((e.key === "Delete" || e.key === "Backspace") && selected.length > 0) {
        deleteElements(state.selectedIds);
        return;
      }
      if (e.key === "Escape") {
        if (showImageUrlDialog) { setShowImageUrlDialog(null); return; }
        interaction.escape();
        return;
      }
      if (mod && e.key === "a") {
        e.preventDefault();
        store.selectMany(slideElements.map((el) => el.id));
        return;
      }
      if (mod && (e.key === "b" || e.key === "i" || e.key === "u")) {
        const textEls = selected.filter((el) => el.type === "heading" || el.type === "text");
        if (textEls.length > 0) {
          e.preventDefault();
          for (const el of textEls) {
            const html = applyToContentHtml(el.props?.content ?? "", (ed) => {
              if (e.key === "b") ed.chain().toggleBold().run();
              else if (e.key === "i") ed.chain().toggleItalic().run();
              else ed.chain().toggleUnderline().run();
            });
            persistContent(el.id, html);
          }
          return;
        }
      }
      if (mod && e.key === "d" && selected.length > 0) {
        e.preventDefault();
        pasteElements(selected);
        return;
      }
      if (mod && (e.key === "c" || e.key === "x") && selected.length > 0) {
        e.preventDefault();
        elementClipboard = selected.map((el) => ({
          type: el.type, x: el.x, y: el.y, width: el.width, height: el.height,
          props: el.props ? { ...el.props } : null,
        }));
        if (e.key === "x") deleteElements(state.selectedIds);
        return;
      }
      if (mod && e.key === "v" && elementClipboard.length > 0) {
        e.preventDefault();
        pasteElements(elementClipboard);
        return;
      }
      if (!mod && e.key.startsWith("Arrow") && selected.length > 0) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        if (dx === 0 && dy === 0) return;
        store.moveElements(selected.map((el) => ({ id: el.id, x: el.x + dx, y: el.y + dy })));
        return;
      }
      if (!mod && (e.key === "[" || e.key === "]") && selected.length === 1) {
        store.reorderElement(selected[0].id, e.key === "]" ? "forward" : "backward");
        return;
      }
      if (e.key === "PageDown" || e.key === "PageUp") {
        e.preventDefault();
        if (state.slides.length === 0) return;
        const idx = state.slides.findIndex((s) => s.id === state.activeSlideId);
        const next = state.slides[idx + (e.key === "PageDown" ? 1 : -1)];
        if (next) store.setActiveSlide(next.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store, interaction, deleteElements, persistContent, pasteElements, showImageUrlDialog, setShowImageUrlDialog]);

  const hasInteractiveElement = elements.some((el) => INTERACTIVE_TYPES.has(el.type));

  const isEditingRichText = editingId !== null && elements.some((el) =>
    el.id === editingId && (el.type === "heading" || el.type === "text")
  );
  const selectedTextEl = selectedIds.size === 1
    ? elements.find((el) => selectedIds.has(el.id) && (el.type === "heading" || el.type === "text"))
    : undefined;
  const selectedEl = selectedIds.size === 1
    ? elements.find((el) => selectedIds.has(el.id))
    : undefined;
  const showRichToolbar = isEditingRichText || !!selectedTextEl;

  const selectedTextElId = selectedTextEl?.id ?? null;
  useEffect(() => {
    setEnterEditForSelection(selectedTextElId ? () => store.startEditing(selectedTextElId) : null);
  }, [selectedTextElId, store]);

  const editorActions: EditorActions = useMemo(() => ({
    updatePosition: ({ id, x, y }) => store.moveElements([{ id, x, y }]),
    updateGeometry: ({ id, x, y, width, height }) => store.setGeometry(id, { x, y, width, height }),
    updateProps: ({ id, props }) => store.setProps(id, props),
    previewProps: (args) => setLivePropsPreview(args),
    updateImageSrc,
    removeElement: ({ id }) => store.removeElements([id]),
    deleteElement: (id) => store.removeElements([id]),
    triggerImageUpload,
    showImageUrlDialog: (id, src) => { setShowImageUrlDialog(id); setImageUrlInput(src ?? ""); },
    handleImageUpload,
    addElement: handleAddElement,
    deselect: () => store.clearSelection(),
  }), [store, updateImageSrc, triggerImageUpload, setShowImageUrlDialog, setImageUrlInput, handleImageUpload, handleAddElement]);

  const editorCtxState: EditorCtxState = useMemo(() => ({
    activeSlideId,
    uploadingImageId,
    hasInteractiveElement,
  }), [activeSlideId, uploadingImageId, hasInteractiveElement]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface">

      <div className="flex items-center gap-3 border-b border-border bg-surface px-3 py-1.5">
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="flex shrink-0 items-center px-1.5 py-1 font-display text-sm font-extrabold tracking-tight text-foreground transition-colors hover:bg-surface-container"
          title="Back to dashboard"
        >
          Prezzy<span className="text-primary">.</span>
        </button>

        <div className="flex min-w-0 flex-1 flex-col">
          <EditableTitle
            title={presentation.title}
            onRename={(title) => updateTitle({ id: pid, title })}
          />
          <div className="flex items-center gap-0.5 -mt-0.5">
            <span className="rounded px-1.5 py-0.5 font-sans text-[10px] text-muted-foreground/60 transition-colors hover:bg-surface-container hover:text-muted-foreground cursor-default">
              {slides.length} slide{slides.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="mr-1 font-sans text-[10px] text-muted-foreground/60">
            {syncStatus === "error" ? "Retrying…" : isSaving ? "Saving…" : "Saved"}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => store.undo()}
              disabled={!canUndo}
              title="Undo (⌘Z)"
              className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:bg-surface-container hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <RotateCcw className="size-3.5" />
            </button>
            <button
              onClick={() => store.redo()}
              disabled={!canRedo}
              title="Redo (⌘⇧Z)"
              className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:bg-surface-container hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
            >
              <RotateCw className="size-3.5" />
            </button>
          </div>
          <div className="mx-1 h-4 w-px bg-border" />
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
              onClick={() => navigate({ to: `/present/${pid}${activeSlideId ? `?slide=${activeSlideId}` : ""}` })}
              className="flex items-center gap-1.5 rounded-l-md bg-primary hover:bg-primary-dim px-4 py-1.5 text-xs font-medium tracking-wide text-primary-foreground transition-all hover:brightness-110 active:scale-[0.99]"
            >
              <Play className="size-3 fill-current" />Present
            </button>
            <button
              onClick={() => window.open(`/present/${pid}${activeSlideId ? `?slide=${activeSlideId}` : ""}`, "_blank")}
              className="flex items-center self-stretch rounded-r-md border-l border-primary-foreground/20 bg-primary hover:bg-primary-dim px-2.5 text-primary-foreground transition-all hover:brightness-110 active:scale-[0.99]"
              title="Open in new window"
            >
              <ExternalLink className="size-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        <SlideRail
          slides={slides}
          activeSlideId={activeSlideId}
          presentationId={pid}
          elementsBySlide={elementsBySlide}
          onSwitchSlide={(id) => store.setActiveSlide(id)}
          onAddSlide={handleAddSlide}
          onDuplicateSlide={handleDuplicateSlide}
          onDeleteSlide={handleDeleteSlide}
          onPickLayout={() => setShowLayoutPicker(true)}
          theme={presentation.theme}
        />
        <div
          ref={canvasAreaRef}
          className="relative flex flex-1 items-center justify-center overflow-hidden bg-surface"
          onClick={() => {
            if (didMarqueeRef.current) { didMarqueeRef.current = false; return; }
            store.clearSelection();
            store.stopEditing();
          }}
          onPointerDown={handleCanvasPointerDown}
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
                onApplyContent={selectedTextEl ? (html) => persistContent(selectedTextEl.id, html) : undefined}
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
              ...slideThemeStyle(resolveSlideTheme(presentation.theme, activeSlide?.bg)),
            }}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              if (didMarqueeRef.current) { didMarqueeRef.current = false; return; }
              store.clearSelection();
              store.stopEditing();
            }}
          >
            {!activeSlide ? (
              <div className="flex h-full items-center justify-center">
                <p className="font-sans text-sm text-muted-foreground/40">No slide selected</p>
              </div>
            ) : elements.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 select-none">
                <p className="font-sans text-xs text-muted-foreground/30">Add elements from the panel →</p>
              </div>
            ) : (
              elements.map((el) => (
                <CanvasElement
                  key={el.id}
                  el={livePropsPreview?.id === el.id ? { ...el, props: { ...el.props, ...livePropsPreview.props } } : el}
                  theme={resolveSlideTheme(presentation.theme, activeSlide?.bg)}
                  isSelected={selectedIds.has(el.id)}
                  isEditing={editingId === el.id}
                  multiSelected={selectedIds.size > 1}
                  dragOverride={dragPositions.get(el.id)}
                  rotationOverride={liveRotation?.id === el.id ? liveRotation.rotation : undefined}
                  uploadingImageId={uploadingImageId}
                  registerRef={registerElementRef}
                  onPointerDown={handleElementPointerDown}
                  onSelect={(id) => {
                    if (didDragRef.current) { didDragRef.current = false; return; }
                    store.select(id);
                  }}
                  onStartEditing={(id) => store.startEditing(id)}
                  onStopEditing={() => store.stopEditing()}
                  onPersistContent={persistContent}
                  setActiveEditor={setActiveEditor}
                  onImageUpload={handleImageUpload}
                  onTriggerImageUpload={triggerImageUpload}
                  onShowImageUrlDialog={(id, src) => { setShowImageUrlDialog(id); setImageUrlInput(src ?? ""); }}
                  onDuplicate={handleDuplicateElement}
                  onDelete={(id) => deleteElements([id])}
                  onFitHeight={handleFitHeight}
                  updateProps={(args) => store.setProps(args.id, args.props)}
                  updateImageSrc={updateImageSrc}
                  reorderElement={(args) => store.reorderElement(args.id, args.action)}
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
              const selElement = elements.find((el) => el.id === selId);
              if (!targetNode || !selElement) return null;
              const prevGeo = { x: selElement.x, y: selElement.y, width: selElement.width, height: selElement.height };
              const prevRotation = selElement.props?.rotation ?? 0;
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
                  onGeometryCommit={(id, geo) => store.setGeometry(id, geo)}
                  onRotationChange={(id, rotation) => setLiveRotation({ id, rotation })}
                  onRotationCommit={(id, rotation) => store.setProps(id, { rotation })}
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

          {marqueeRect && canvasRef.current && (() => {
            const cr = canvasRef.current!.getBoundingClientRect();
            const ar = canvasAreaRef.current?.getBoundingClientRect();
            if (!ar) return null;
            const left   = cr.left - ar.left + (marqueeRect.x / 100) * cr.width;
            const top    = cr.top  - ar.top  + (marqueeRect.y / 100) * cr.height;
            const width  = (marqueeRect.w / 100) * cr.width;
            const height = (marqueeRect.h / 100) * cr.height;
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
