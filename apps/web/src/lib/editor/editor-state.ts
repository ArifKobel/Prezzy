import { useSyncExternalStore } from "react";
import type { useEditor } from "@tiptap/react";

export type EditorInstance = ReturnType<typeof useEditor>;

interface EditorState {
  activeEditorInstance: EditorInstance | null;
  pendingCommandFn: ((ed: NonNullable<EditorInstance>) => void) | null;
  enterEditForSelection: (() => void) | null;
  savedSelection: { from: number; to: number } | null;
  refreshFakeSelRects: (() => void) | null;
}

let state: EditorState = {
  activeEditorInstance: null,
  pendingCommandFn: null,
  enterEditForSelection: null,
  savedSelection: null,
  refreshFakeSelRects: null,
};

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useEditorState(): EditorState {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function useActiveEditorInstance() {
  return useSyncExternalStore(subscribe, () => state.activeEditorInstance);
}

export function useSavedSelection() {
  return useSyncExternalStore(subscribe, () => state.savedSelection);
}

export function usePendingCommandFn() {
  return useSyncExternalStore(subscribe, () => state.pendingCommandFn);
}

export function useEnterEditForSelection() {
  return useSyncExternalStore(subscribe, () => state.enterEditForSelection);
}

export function getActiveEditorInstance() { return state.activeEditorInstance; }
export function getPendingCommandFn() { return state.pendingCommandFn; }
export function getEnterEditForSelection() { return state.enterEditForSelection; }
export function getSavedSelection() { return state.savedSelection; }
export function getRefreshFakeSelRects() { return state.refreshFakeSelRects; }

export function setActiveEditorInstance(v: EditorInstance | null) {
  if (state.activeEditorInstance === v) return;
  state = { ...state, activeEditorInstance: v };
  emitChange();
}

export function setPendingCommandFn(v: ((ed: NonNullable<EditorInstance>) => void) | null) {
  state = { ...state, pendingCommandFn: v };
  emitChange();
}

export function setEnterEditForSelection(v: (() => void) | null) {
  state = { ...state, enterEditForSelection: v };
  emitChange();
}

export function setSavedSelection(v: { from: number; to: number } | null) {
  if (state.savedSelection === v) return;
  state = { ...state, savedSelection: v };
  emitChange();
}

export function setRefreshFakeSelRects(v: (() => void) | null) {
  state = { ...state, refreshFakeSelRects: v };
  emitChange();
}
