import { HEADING_CLS, TEXT_CLS } from "@/components/slide-canvas";
import { cn } from "@Prezzy/ui/lib/utils";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState } from "react";
import { ExtendedTextStyle } from "@/lib/editor/tiptap";
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
  const [fakeSelRects, setFakeSelRects] = useState<{ x: number; y: number; w: number; h: number }[]>([]);

  type EditorLike = {
    view: { coordsAtPos: (pos: number) => { left: number; right: number; top: number; bottom: number } };
    state: { selection: { from: number; to: number }; doc: { nodesBetween: (from: number, to: number, cb: (node: any, pos: number) => void) => void } };
  };

  function updateFakeSelRects(ed: EditorLike) {
    const containerEl = containerRef.current;
    const sel = getSavedSelection() ?? ed.state.selection;
    if (!containerEl || !sel || sel.from === sel.to) { setFakeSelRects([]); return; }
    const cr = containerEl.getBoundingClientRect();
    const rects: { x: number; y: number; w: number; h: number }[] = [];
    const { from, to } = sel;
    let pos = from;
    while (pos < to) {
      const start = ed.view.coordsAtPos(pos);
      let end = ed.view.coordsAtPos(pos + 1);
      let lineEnd = pos + 1;
      while (lineEnd < to) {
        const next = ed.view.coordsAtPos(lineEnd + 1);
        if (Math.abs(next.top - start.top) > 2) break;
        end = next;
        lineEnd++;
      }
      const x = start.left - cr.left;
      const y = start.top - cr.top;
      const w = end.right - start.left;
      const h = end.bottom - start.top;
      if (w > 0 && h > 0) rects.push({ x, y, w, h });
      pos = lineEnd;
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
    onFocus: () => { setSavedSelection(null); setFakeSelRects([]); },
    onBlur: ({ editor }) => {
      const { from, to } = editor.state.selection;
      setSavedSelection(from !== to ? { from, to } : null);
      updateFakeSelRects(editor);
      onContentChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor) {
      setActiveEditorInstance(editor);
      setRefreshFakeSelRects(() => updateFakeSelRects(editor));
      setActiveEditor(editor);
      const pending = getPendingCommandFn();
      if (pending) {
        const fn = pending;
        setPendingCommandFn(null);
        setTimeout(() => { fn(editor); editor.commands.focus("end"); }, 0);
      } else {
        editor.commands.focus("end");
      }
    }
    return () => {
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
          style={{ left: r.x, top: r.y, width: r.w, height: r.h, background: "oklch(0.425 0.044 228 / 0.2)", borderRadius: "2px" }}
        />
      ))}
      <EditorContent editor={editor} className="h-full w-full" />
    </div>
  );
}
