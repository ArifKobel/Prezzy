import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { createInteraction } from "@/lib/editor/interaction";
import type { EditorState, EditorStore } from "@/lib/editor/store";

export interface EditorContextValue {
  store: EditorStore;
  interaction: ReturnType<typeof createInteraction>;
}

export const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditorContext(): EditorContextValue {
  const value = useContext(EditorContext);
  if (!value) throw new Error("useEditorContext used outside of an editor");
  return value;
}

export function useEditorStore(): EditorStore {
  return useEditorContext().store;
}

export function useInteraction(): ReturnType<typeof createInteraction> {
  return useEditorContext().interaction;
}

export function useEditorState<T>(select: (state: EditorState) => T): T {
  const store = useEditorStore();
  return useSyncExternalStore(
    store.subscribe,
    () => select(store.getState()),
    () => select(store.getState()),
  );
}

const slideElementsCache = new WeakMap<
  EditorState["elements"],
  { slideId: string | null; elements: EditorState["elements"] }
>();

export function useSlideElements() {
  return useEditorState((state) => {
    const hit = slideElementsCache.get(state.elements);
    if (hit && hit.slideId === state.activeSlideId) return hit.elements;
    const filtered = state.elements.filter((el) => el.slideId === state.activeSlideId);
    slideElementsCache.set(state.elements, { slideId: state.activeSlideId, elements: filtered });
    return filtered;
  });
}

export function useIsSelected(id: string): boolean {
  return useEditorState((state) => state.selectedIds.has(id));
}

export function useEditorValue(): EditorContextValue {
  const store = useEditorStore();
  const interaction = useInteraction();
  return useMemo(() => ({ store, interaction }), [store, interaction]);
}
