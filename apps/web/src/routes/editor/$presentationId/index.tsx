import type { ElementProps, SlideElement } from "@Prezzy/shared";
import { resolveSlideTheme } from "@Prezzy/shared/theme";
import { DESIGN_W, DESIGN_H, slideThemeStyle } from "@/components/slide-canvas";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator,
  ContextMenuShortcut, ContextMenuTrigger,
} from "@Prezzy/ui/components/context-menu";
import { cn } from "@Prezzy/ui/lib/utils";
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

const INTERACTIVE_TYPES = new Set(["quiz", "wordcloud", "leaderboard", "qrcode"]);

type ElementSnapshot = Pick<SlideElement, "type" | "x" | "y" | "width" | "height" | "props">;

let elementClipboard: ElementSnapshot[] = [];

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

  function handleAddSlide(afterSlideId?: string) {
    const after = afterSlideId ? slides?.find((s) => s.id === afterSlideId) : activeSlide;
    createSlide({ presentationId: pid, afterOrder: after?.order })
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

  function handleDuplicateSlide(slideId: string) {
    duplicateSlide({ slideId })
      .then((slide) => switchSlide(slide.id, true))
      .catch(console.error);
  }

  function handleDeleteSlide(slideId: string) {
    if (!slides || slides.length <= 1) return;
    const idx = slides.findIndex((s) => s.id === slideId);
    if (idx === -1) return;
    const next = slides[idx + 1] ?? slides[idx - 1];
    removeSlide({ slideId });
    if (slideId === activeSlideId) switchSlide(next.id);
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
  const [livePropsPreview, setLivePropsPreview] = useState<{ id: string; props: ElementProps } | null>(null);
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
  useEffect(() => { if (livePropsPreview) setLivePropsPreview(null); }, [elements]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const { dragPositions, snapLines, handleElementPointerDown, didDrag } = useElementDrag({
    canvasRef, elements,
    selectedIds, setSelectedIds, editingId, setEditingId,
    moveableActive, updatePosition, pushHistory: history.push, liveId: history.liveId,
  });

  const { marquee, didMarqueeRef, handleMarqueePointerDown } = useMarquee({
    canvasRef, canvasAreaRef, elements, setSelectedIds,
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.closest?.(".ProseMirror")) return;
      if (editingId) return;
      const mod = e.metaKey || e.ctrlKey;
      const selected = (elements ?? []).filter((el) => selectedIds.has(el.id));

      if ((e.key === "Delete" || e.key === "Backspace") && selected.length > 0) {
        deleteElements(selectedIds);
        return;
      }
      if (e.key === "Escape") {
        if (showImageUrlDialog) { setShowImageUrlDialog(null); return; }
        setSelectedIds(new Set());
        return;
      }
      if (mod && e.key === "a") {
        e.preventDefault();
        setSelectedIds(new Set((elements ?? []).map((el) => el.id)));
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
            updateContent({ id: el.id, content: html });
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
        if (e.key === "x") deleteElements(selectedIds);
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
        const moves = selected.map((el) => ({
          id: el.id, oldX: el.x, oldY: el.y, newX: el.x + dx, newY: el.y + dy,
        }));
        for (const m of moves) updatePosition({ id: m.id, x: m.newX, y: m.newY });
        history.push({
          undo: () => Promise.all(moves.map((m) => updatePosition({ id: history.liveId(m.id), x: m.oldX, y: m.oldY }))),
          redo: () => Promise.all(moves.map((m) => updatePosition({ id: history.liveId(m.id), x: m.newX, y: m.newY }))),
        });
        return;
      }
      if (!mod && (e.key === "[" || e.key === "]") && selected.length === 1) {
        reorderElement({ id: selected[0].id, action: e.key === "]" ? "forward" : "backward" });
        return;
      }
      if (e.key === "PageDown" || e.key === "PageUp") {
        e.preventDefault();
        if (!slides || slides.length === 0) return;
        const idx = slides.findIndex((s) => s.id === activeSlideId);
        const next = slides[idx + (e.key === "PageDown" ? 1 : -1)];
        if (next) switchSlide(next.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIds, editingId, elements, removeElement, showImageUrlDialog, slides, activeSlideId]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasInteractiveElement = elements?.some((el) => INTERACTIVE_TYPES.has(el.type)) ?? false;

  async function pasteElements(source: ElementSnapshot[]) {
    if (!activeSlideId) return;
    let hasInteractive = elements?.some((el) => INTERACTIVE_TYPES.has(el.type)) ?? false;
    const created: SlideElement[] = [];
    for (const c of source) {
      if (INTERACTIVE_TYPES.has(c.type)) {
        if (hasInteractive) continue;
        hasInteractive = true;
      }
      try {
        created.push(await createElement({
          slideId: activeSlideId, type: c.type,
          x: Math.min(c.x + 3, 95), y: Math.min(c.y + 3, 95),
          width: c.width, height: c.height,
          props: c.props ?? undefined,
        }));
      } catch (error) {
        console.error(error);
      }
    }
    if (created.length > 0) setSelectedIds(new Set(created.map((el) => el.id)));
  }

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
    pasteElements([el]);
  }

  const handleFitHeight = useCallback((id: string, height: number) => {
    const el = elements?.find((e) => e.id === id);
    if (!el) return;
    updateGeometry({ id, x: el.x, y: el.y, width: el.width, height });
    updateProps({ id, props: { heightFitted: true } });
  }, [elements, updateGeometry, updateProps]);

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
    previewProps: (args: { id: string; props: ElementProps } | null) => setLivePropsPreview(args),
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
              className="flex items-center gap-1.5 rounded-l-md bg-primary hover:bg-primary-dim px-4 py-1.5 text-xs font-medium tracking-wide text-primary-foreground transition-all hover:brightness-110 active:scale-[0.99]"
            >
              <Play className="size-3 fill-current" />Present
            </button>
            <button
              onClick={() => window.open(`/present/${presentationId}${activeSlideId ? `?slide=${activeSlideId}` : ""}`, "_blank")}
              className="flex items-center self-stretch rounded-r-md border-l border-primary-foreground/20 bg-primary hover:bg-primary-dim px-2.5 text-primary-foreground transition-all hover:brightness-110 active:scale-[0.99]"
              title="Open in new window"
            >
              <ExternalLink className="size-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center border-b border-border bg-surface px-3 py-1">
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

        <SlideRail
          slides={slides}
          activeSlideId={activeSlideId}
          presentationId={pid}
          onSwitchSlide={switchSlide}
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
                onApplyContent={selectedTextEl ? (html) => updateContent({ id: selectedTextEl.id, content: html }) : undefined}
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
                  el={livePropsPreview?.id === el.id ? { ...el, props: { ...el.props, ...livePropsPreview.props } } : el}
                  isSelected={selectedIds.has(el.id)}
                  isEditing={editingId === el.id}
                  multiSelected={selectedIds.size > 1}
                  dragOverride={dragPositions.get(el.id)}
                  rotationOverride={liveRotation?.id === el.id ? liveRotation.rotation : undefined}
                  uploadingImageId={uploadingImageId}
                  registerRef={registerElementRef}
                  onPointerDown={handleElementPointerDown}
                  onSelect={(id) => {
                    if (didDrag.current) { didDrag.current = false; return; }
                    setSelectedIds(new Set([id]));
                  }}
                  onStartEditing={(id) => setEditingId(id)}
                  onStopEditing={() => setEditingId(null)}
                  onPersistContent={persistContent}
                  setActiveEditor={setActiveEditor}
                  onImageUpload={handleImageUpload}
                  onTriggerImageUpload={triggerImageUpload}
                  onShowImageUrlDialog={(id, src) => { setShowImageUrlDialog(id); setImageUrlInput(src ?? ""); }}
                  onDuplicate={handleDuplicateElement}
                  onDelete={(id) => deleteElements(new Set([id]))}
                  onFitHeight={handleFitHeight}
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
