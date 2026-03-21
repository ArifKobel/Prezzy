import type { Id } from "@Prezzy/backend/convex/_generated/dataModel";
import { createContext, useContext } from "react";
import type { Geo } from "@/lib/editor/snap";

export interface EditorActions {
  updatePosition: (args: { id: Id<"slideElements">; x: number; y: number }) => void;
  updateGeometry: (args: { id: Id<"slideElements">; x: number; y: number; width: number; height: number }) => void;
  updateProps: (args: { id: Id<"slideElements">; props: Record<string, any> }) => void;
  updateImageSrc: (args: { id: Id<"slideElements">; src: string }) => void;
  removeElement: (args: { id: Id<"slideElements"> }) => void;
  triggerImageUpload: (id: Id<"slideElements">) => void;
  showImageUrlDialog: (id: Id<"slideElements">, currentSrc?: string) => void;
  handleImageUpload: (file: File, id: Id<"slideElements">) => void;
  addElement: (type: "heading" | "text" | "image" | "shape" | "quiz" | "wordcloud" | "leaderboard" | "qrcode") => void;
  deselect: () => void;
  setLocalGeometry: (id: Id<"slideElements">, geo: Geo) => void;
}

export interface EditorState {
  activeSlideId: Id<"slides"> | null;
  localGeometry: Map<Id<"slideElements">, Geo>;
  uploadingImageId: Id<"slideElements"> | null;
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
