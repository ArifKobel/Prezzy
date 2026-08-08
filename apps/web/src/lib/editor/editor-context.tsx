import type { ElementProps, ElementType } from "@Prezzy/shared";
import { createContext, useContext } from "react";
import type { Geo } from "@/lib/editor/snap";

export interface EditorActions {
  updatePosition: (args: { id: string; x: number; y: number }) => void;
  updateGeometry: (args: { id: string; x: number; y: number; width: number; height: number }) => void;
  updateProps: (args: { id: string; props: ElementProps }) => void;
  updateImageSrc: (args: { id: string; src: string }) => void;
  removeElement: (args: { id: string }) => void;
  triggerImageUpload: (id: string) => void;
  showImageUrlDialog: (id: string, currentSrc?: string) => void;
  handleImageUpload: (file: File, id: string) => void;
  addElement: (type: ElementType) => void;
  deselect: () => void;
  setLocalGeometry: (id: string, geo: Geo) => void;
}

export interface EditorState {
  activeSlideId: string | null;
  localGeometry: Map<string, Geo>;
  uploadingImageId: string | null;
  hasInteractiveElement: boolean;
}

const EditorActionsContext = createContext<EditorActions | null>(null);
const EditorStateContext = createContext<EditorState | null>(null);

export function EditorActionsProvider({
  value,
  children,
}: {
  value: EditorActions;
  children: React.ReactNode;
}) {
  return (
    <EditorActionsContext.Provider value={value}>
      {children}
    </EditorActionsContext.Provider>
  );
}

export function EditorStateProvider({
  value,
  children,
}: {
  value: EditorState;
  children: React.ReactNode;
}) {
  return (
    <EditorStateContext.Provider value={value}>
      {children}
    </EditorStateContext.Provider>
  );
}

export function useEditorActions(): EditorActions {
  const ctx = useContext(EditorActionsContext);
  if (!ctx) throw new Error("useEditorActions must be used within EditorActionsProvider");
  return ctx;
}

export function useEditorCtxState(): EditorState {
  const ctx = useContext(EditorStateContext);
  if (!ctx) throw new Error("useEditorCtxState must be used within EditorStateProvider");
  return ctx;
}
