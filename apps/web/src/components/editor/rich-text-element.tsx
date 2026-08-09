import { HEADING_CLS, TEXT_CLS } from "@/components/slide-canvas";
import { cn } from "@Prezzy/ui/lib/utils";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState } from "react";
import { ExtendedTextStyle } from "@/lib/editor/tiptap";
import { selectionRectsInContainer, type LocalRect } from "@/lib/editor/selection-rects";
import {
  setActiveEditorInstance, setPendingCommandFn,
  setSavedSelection, setRefreshFakeSelRects,
  getPendingCommandFn, getSavedSelection,
  type EditorInstance,
} from "@/lib/editor/editor-state";

export function RichTextElement({
  isHeading, liveContent, onSave, onContentChange, onEscape, setActiveEditor,
}: {
  isHeading: boolean;
  liveContent: string;
  onSave: (html: string) => void;
  onContentChange: (html: string) => void;
  onEscape: () => void;
  setActiveEditor: (e: EditorInstance | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fakeSelRects, setFakeSelRects] = useState<LocalRect[]>([]);

  type EditorLike = {
    view: { domAtPos: (pos: number) => { node: Node; offset: number } };
    state: { selection: { from: number; to: number } };
  };

  function updateFakeSelRects(ed: EditorLike) {
    const containerEl = containerRef.current;
    const sel = getSavedSelection() ?? ed.state.selection;
    if (!containerEl || !sel || sel.from === sel.to) { setFakeSelRects([]); return; }

    let rects: LocalRect[];
    try {
      const start = ed.view.domAtPos(sel.from);
      const end = ed.view.domAtPos(sel.to);
      const range = document.createRange();
      range.setStart(start.node, start.offset);
      range.setEnd(end.node, end.offset);
      rects = selectionRectsInContainer(containerEl, range);
    } catch {
      setFakeSelRects([]);
      return;
    }

    setFakeSelRects(rects);
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ trailingNode: false }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ExtendedTextStyle,
    ],
    content: liveContent || (isHeading ? "<p><strong><span style=\"font-size: 48px;\">Heading</span></strong></p>" : "<p>Text box</p>"),
    autofocus: "end",
    editorProps: {
      attributes: {
        class: cn("outline-none focus:outline-none", isHeading ? HEADING_CLS : TEXT_CLS),
      },
    },
    onUpdate: () => { setActiveEditorInstance(editor); },
    onTransaction: ({ editor: ed }) => {
      if (!isHeading || !ed.isEmpty) return;
      const stored = ed.state.storedMarks;
      const hasBold = stored?.some((m) => m.type.name === "bold");
      const hasSize = stored?.some((m) => m.type.name === "textStyle" && m.attrs.fontSize);
      if (hasBold && hasSize) return;
      ed.view.dispatch(ed.state.tr.setStoredMarks([
        ed.state.schema.marks.bold.create(),
        ed.state.schema.marks.textStyle.create({ fontSize: "48px" }),
      ]));
    },
    onFocus: () => { setSavedSelection(null); setFakeSelRects([]); },
    onBlur: ({ editor }) => {
      const { from, to } = editor.state.selection;
      setSavedSelection(from !== to ? { from, to } : null);
      updateFakeSelRects(editor);
      onContentChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    setActiveEditorInstance(editor);
    setRefreshFakeSelRects(() => updateFakeSelRects(editor));
    setActiveEditor(editor);

    let pendingTimeout: ReturnType<typeof setTimeout> | undefined;
    const pending = getPendingCommandFn();
    if (pending) {
      setPendingCommandFn(null);
      pendingTimeout = setTimeout(() => {
        if (editor.isDestroyed) return;
        pending(editor);
        editor.commands.focus("end");
      }, 0);
    } else {
      editor.commands.focus("end");
    }

    return () => {
      if (pendingTimeout !== undefined) clearTimeout(pendingTimeout);
      setPendingCommandFn(null);
      setActiveEditorInstance(null);
      setSavedSelection(null);
      setRefreshFakeSelRects(null);
      setFakeSelRects([]);
      setActiveEditor(null);
    };
  }, [editor, setActiveEditor]);

  useEffect(() => {
    if (!editor) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onSave(editor!.getHTML()); onEscape(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor, onSave, onEscape]);

  return (
    <div ref={containerRef} className="relative h-full w-full" onPointerDown={() => { setSavedSelection(null); setFakeSelRects([]); }}>
      {fakeSelRects.map((r, i) => (
        <div
          key={i}
          className="pointer-events-none absolute z-10"
          style={{ left: r.x, top: r.y, width: r.w, height: r.h, background: "color-mix(in oklab, var(--color-primary) 22%, transparent)", borderRadius: "2px" }}
        />
      ))}
      <EditorContent editor={editor} className="h-full w-full" />
    </div>
  );
}
