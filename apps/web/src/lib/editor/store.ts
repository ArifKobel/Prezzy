import type { ElementProps, PresentationTheme, Slide, SlideElement } from "@Prezzy/shared";
import * as Y from "yjs";
import * as cmd from "@/lib/editor/commands";
import {
  type DocSnapshot,
  LOCAL_ORIGIN,
  createDoc,
  loadDoc,
  snapshot,
} from "@/lib/editor/doc";

export interface Rect { x: number; y: number; w: number; h: number }
export interface SnapLines { vLines: number[]; hLines: number[] }

export type Interaction =
  | { kind: "idle" }
  | {
      kind: "drag";
      ids: string[];
      moved: boolean;
      positions: ReadonlyMap<string, { x: number; y: number }>;
      snapLines: SnapLines;
    }
  | { kind: "marquee"; rect: Rect }
  | { kind: "transform"; id: string }
  | { kind: "text"; id: string };

export interface EditorState extends DocSnapshot {
  activeSlideId: string | null;
  selectedIds: ReadonlySet<string>;
  interaction: Interaction;
  canUndo: boolean;
  canRedo: boolean;
}

export type EditorStore = ReturnType<typeof createEditorStore>;

export function createEditorStore(doc: Y.Doc = createDoc()) {
  const undoManager = new Y.UndoManager(
    [doc.getMap("meta"), doc.getMap("slides"), doc.getMap("elements")],
    { trackedOrigins: new Set([LOCAL_ORIGIN]) },
  );

  let activeSlideId: string | null = null;
  let selectedIds: ReadonlySet<string> = new Set();
  let interaction: Interaction = { kind: "idle" };

  let cached: EditorState | null = null;
  let snapCache: DocSnapshot | null = null;
  const listeners = new Set<() => void>();

  const invalidate = () => {
    cached = null;
    for (const listener of listeners) listener();
  };

  const invalidateDoc = () => {
    snapCache = null;
    invalidate();
  };

  doc.on("update", invalidateDoc);
  undoManager.on("stack-item-added", invalidate);
  undoManager.on("stack-item-popped", invalidate);

  function getState(): EditorState {
    if (!cached) {
      if (!snapCache) snapCache = snapshot(doc);
      const snap = snapCache;
      const slideExists = snap.slides.some((s) => s.id === activeSlideId);
      if (!slideExists) activeSlideId = snap.slides[0]?.id ?? null;

      const live = new Set(snap.elements.map((el) => el.id));
      if ([...selectedIds].some((id) => !live.has(id))) {
        selectedIds = new Set([...selectedIds].filter((id) => live.has(id)));
      }
      if (interaction.kind === "text" && !live.has(interaction.id)) {
        interaction = { kind: "idle" };
      }

      cached = {
        ...snap,
        activeSlideId,
        selectedIds,
        interaction,
        canUndo: undoManager.canUndo(),
        canRedo: undoManager.canRedo(),
      };
    }
    return cached;
  }

  const active = (): string | null => getState().activeSlideId;

  const elementsOfActiveSlide = (): SlideElement[] => {
    const state = getState();
    return state.elements.filter((el) => el.slideId === state.activeSlideId);
  };

  const setSelection = (ids: Iterable<string>) => {
    selectedIds = new Set(ids);
    invalidate();
  };

  return {
    doc,
    undoManager,

    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    getState,
    destroy() {
      doc.off("update", invalidateDoc);
      undoManager.destroy();
      listeners.clear();
    },

    load(input: { title: string; theme: PresentationTheme | null; slides: Slide[]; elements: SlideElement[] }) {
      loadDoc(doc, input);
      undoManager.clear();
      invalidate();
    },

    slideElements: elementsOfActiveSlide,
    selected: () => getState().elements.filter((el) => selectedIds.has(el.id)),

    setActiveSlide(id: string | null) {
      if (active() === id) return;
      activeSlideId = id;
      selectedIds = new Set();
      interaction = { kind: "idle" };
      invalidate();
    },

    select(id: string) { setSelection([id]); },
    selectMany(ids: Iterable<string>) { setSelection(ids); },
    clearSelection() { setSelection([]); },
    toggleSelection(id: string) {
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id); else next.add(id);
      setSelection(next);
    },

    beginInteraction(next: Interaction) {
      interaction = next;
      invalidate();
    },
    updateInteraction(next: Interaction) {
      interaction = next;
      invalidate();
    },
    endInteraction() {
      if (interaction.kind === "idle") return;
      interaction = { kind: "idle" };
      invalidate();
    },

    startEditing(id: string) {
      selectedIds = new Set([id]);
      interaction = { kind: "text", id };
      invalidate();
    },
    stopEditing() {
      if (interaction.kind !== "text") return;
      interaction = { kind: "idle" };
      invalidate();
    },
    editingId: () => (getState().interaction.kind === "text" ? (interaction as { id: string }).id : null),

    undo() { undoManager.undo(); },
    redo() { undoManager.redo(); },

    silently<T>(fn: () => T): T {
      undoManager.trackedOrigins.delete(LOCAL_ORIGIN);
      try {
        return fn();
      } finally {
        undoManager.trackedOrigins.add(LOCAL_ORIGIN);
        undoManager.stopCapturing();
      }
    },

    addSlide(afterSlideId?: string) {
      const id = cmd.addSlide(doc, afterSlideId ?? active() ?? undefined);
      this.setActiveSlide(id);
      return id;
    },
    duplicateSlide(slideId: string) {
      const id = cmd.duplicateSlide(doc, slideId);
      this.setActiveSlide(id);
      return id;
    },
    removeSlide(slideId: string) {
      const wasActive = active() === slideId;
      const remaining = getState().slides.filter((s) => s.id !== slideId);
      if (remaining.length === 0) return;
      cmd.removeSlide(doc, slideId);
      if (wasActive) this.setActiveSlide(remaining[0].id);
      else invalidate();
    },
    reorderSlides(ids: string[]) { cmd.reorderSlides(doc, ids); },
    setSlideTitle(slideId: string, title: string) { cmd.setSlideTitle(doc, slideId, title); },
    setSlideBg(slideId: string, bg: string | null) { cmd.setSlideBg(doc, slideId, bg); },

    addElement(input: Omit<cmd.NewElement, "slideId">) {
      const slideId = active();
      if (!slideId) return null;
      const id = cmd.addElement(doc, { ...input, slideId });
      setSelection([id]);
      return id;
    },
    duplicateElement(id: string) {
      const source = getState().elements.find((el) => el.id === id);
      if (!source) return null;
      const copy = cmd.addElement(doc, {
        slideId: source.slideId,
        type: source.type,
        x: source.x + 3,
        y: source.y + 3,
        width: source.width,
        height: source.height,
        props: source.props ?? undefined,
      });
      setSelection([copy]);
      return copy;
    },
    removeSelected() {
      if (selectedIds.size === 0) return;
      cmd.removeElements(doc, [...selectedIds]);
      setSelection([]);
    },
    removeElements(ids: string[]) {
      cmd.removeElements(doc, ids);
      setSelection([...selectedIds].filter((id) => !ids.includes(id)));
    },
    moveElements(moves: Array<{ id: string; x: number; y: number }>) { cmd.moveElements(doc, moves); },
    setGeometry(id: string, geo: { x: number; y: number; width: number; height: number }) {
      cmd.setGeometry(doc, id, geo);
    },
    setProps(id: string, props: ElementProps) { cmd.setProps(doc, id, props); },
    reorderElement(id: string, action: cmd.ReorderAction) { cmd.reorderElement(doc, id, action); },

    setTitle(title: string) { cmd.setTitle(doc, title); },
    setTheme(patch: cmd.ThemePatch) { cmd.setTheme(doc, patch); },
  };
}
