import type { useEditor } from "@tiptap/react";
import {
  AlignCenter, AlignLeft, AlignRight, Bold,
  Italic, List, ListOrdered, RotateCcw, RotateCw,
  Strikethrough, Underline as UnderlineIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  FONT_FAMILIES, HEADING_PRESETS, applyToContentHtml, parseUniformStyle,
} from "@/lib/editor/tiptap";
import {
  useEnterEditForSelection, useSavedSelection,
  getRefreshFakeSelRects, getSavedSelection,
  setPendingCommandFn, setSavedSelection,
} from "@/lib/editor/editor-state";
import { FmtBtn } from "@/components/editor/toolbar/fmt-btn";
import { FontSizeInput } from "@/components/editor/toolbar/font-size-input";
import { Sep } from "@/components/editor/toolbar/sep";
import { TextColorPicker } from "@/components/editor/toolbar/text-color-picker";
import { ToolbarSelect } from "@/components/editor/toolbar/toolbar-select";


export function RichToolbar({ editor, contentHtml = "", onApplyContent }: {
  editor: ReturnType<typeof useEditor> | null;
  contentHtml?: string;
  onApplyContent?: (html: string) => void;
}) {
  const [, forceUpdate] = useState(0);
  const savedSel = useSavedSelection();
  const enterEdit = useEnterEditForSelection();

  function applyWhole(fn: (ed: NonNullable<typeof editor>) => void) {
    if (onApplyContent) {
      onApplyContent(applyToContentHtml(contentHtml, fn as (ed: unknown) => void));
      return;
    }
    if (enterEdit) {
      setPendingCommandFn((ed) => { ed.commands.selectAll(); fn(ed); });
      enterEdit();
    }
  }

  function htmlHas(...needles: string[]) {
    return needles.some((n) => contentHtml.includes(n));
  }

  useEffect(() => {
    if (!editor) return;
    const handler = () => forceUpdate((n) => n + 1);
    editor.on("transaction", handler);
    editor.on("selectionUpdate", handler);
    return () => { editor.off("transaction", handler); editor.off("selectionUpdate", handler); };
  }, [editor]);

  function execCmd(fn: (ed: NonNullable<typeof editor>) => void) {
    const sel = getSavedSelection();
    if (editor) {
      if (sel) {
        const { from, to } = sel;
        editor.chain().focus().setTextSelection({ from, to }).run();
        setSavedSelection(null);
      }
      fn(editor);
    } else {
      applyWhole(fn);
    }
  }

  function applyMarkDirect(from: number, to: number, attrs: Record<string, string | null>) {
    if (!editor || from === to) return;
    const tr = editor.state.tr;
    editor.state.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isText) return;
      const existing = node.marks.find((m) => m.type.name === "textStyle");
      const merged = { ...(existing?.attrs ?? {}), ...attrs };
      const mark = editor!.schema.marks.textStyle.create(merged);
      tr.addMark(Math.max(pos, from), Math.min(pos + node.nodeSize, to), mark);
    });
    editor.view.dispatch(tr);
    requestAnimationFrame(() => getRefreshFakeSelRects()?.());
  }

  const currentFontFamily = editor
    ? (editor.getAttributes("textStyle").fontFamily ?? "")
    : parseUniformStyle(contentHtml, "font-family");

  function getSelectionFontSize(): string {
    if (!editor) return parseUniformStyle(contentHtml, "font-size").replace("px", "");
    const { from, to } = savedSel ?? editor.state.selection;
    if (from === to) return (editor.getAttributes("textStyle").fontSize ?? "").replace("px", "");
    const sizes = new Set<string>();
    editor.state.doc.nodesBetween(from, to, (node) => {
      if (!node.isText) return;
      const mark = node.marks.find((m) => m.type.name === "textStyle");
      sizes.add(mark?.attrs.fontSize?.replace("px", "") ?? "");
    });
    return sizes.size === 1 ? [...sizes][0] : "";
  }
  const currentFontSize = getSelectionFontSize();

  function stepFontSize(delta: number) {
    if (!editor) {
      const cur = parseInt(parseUniformStyle(contentHtml, "font-size").replace("px", "") || "14", 10);
      const next = Math.max(1, Math.min(400, cur + delta));
      applyWhole((ed) => { (ed.chain() as any).setFontSize(next + "px").run(); });
      return;
    }
    const sel = getSavedSelection() ?? editor.state.selection;
    const { from, to } = sel;
    if (from === to) {
      const cur = parseInt(editor.getAttributes("textStyle").fontSize ?? "14", 10);
      const next = Math.max(1, Math.min(400, cur + delta));
      (editor.chain() as any).setFontSize(next + "px").run();
      return;
    }
    const tr = editor.state.tr;
    editor.state.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isText) return;
      const existing = node.marks.find((m) => m.type.name === "textStyle");
      const cur = parseInt(existing?.attrs.fontSize?.replace("px", "") ?? "14", 10);
      const next = Math.max(1, Math.min(400, cur + delta));
      const merged = { ...(existing?.attrs ?? {}), fontSize: next + "px" };
      const mark = editor!.schema.marks.textStyle.create(merged);
      tr.addMark(Math.max(pos, from), Math.min(pos + node.nodeSize, to), mark);
    });
    editor.view.dispatch(tr);
    requestAnimationFrame(() => getRefreshFakeSelRects()?.());
  }

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      <ToolbarSelect
        value={currentFontFamily}
        placeholder="Default"
        options={[{ label: "Default", value: "" }, ...FONT_FAMILIES]}
        onChange={(val) => execCmd((e) => {
          if (val) (e.chain() as any).setFontFamily(val).run();
          else (e.chain() as any).unsetFontFamily().run();
        })}
        className="w-36"
        renderOption={(opt) => (
          <span style={{ fontFamily: opt.value || "ui-sans-serif, system-ui, sans-serif" }} className="block py-1.5 text-[11px]">
            {opt.label}
          </span>
        )}
        renderLabel={(label, value) => (
          <span style={{ fontFamily: value || "ui-sans-serif, system-ui, sans-serif" }}>{label}</span>
        )}
        onHover={(val) => {
          if (!editor) return;
          const fontFamily = val || undefined;
          if (fontFamily) (editor.chain() as any).setFontFamily(fontFamily).run();
          else (editor.chain() as any).unsetFontFamily().run();
        }}
        onHoverEnd={() => {
          if (!editor) return;
          if (currentFontFamily) (editor.chain() as any).setFontFamily(currentFontFamily).run();
          else (editor.chain() as any).unsetFontFamily().run();
        }}
      />

      <FontSizeInput
        value={currentFontSize}
        onCommit={(val) => {
          const size = val + "px";
          if (editor) {
            const sel = getSavedSelection() ?? editor.state.selection;
            if (sel.from !== sel.to) applyMarkDirect(sel.from, sel.to, { fontSize: size });
            else (editor.chain() as any).setFontSize(size).run();
          } else {
            applyWhole((ed) => { (ed.chain() as any).setFontSize(size).run(); });
          }
        }}
        onStep={stepFontSize}
        onBlur={() => {
          if (editor && getSavedSelection()) {
            const { from, to } = getSavedSelection()!;
            editor.chain().focus().setTextSelection({ from, to }).run();
            setSavedSelection(null);
          }
        }}
        className="w-24"
      />

      <Sep />

      {(() => {
        const fs = editor
          ? (editor.getAttributes("textStyle").fontSize ?? "")
          : parseUniformStyle(contentHtml, "font-size");
        const bold = editor
          ? (editor.isActive("bold") ?? false)
          : contentHtml.includes("<strong") || contentHtml.includes("font-weight: bold") || contentHtml.includes("font-weight:bold");
        const current = HEADING_PRESETS.find((p) => p.fontSize === fs && p.bold === bold)?.value ?? "custom";
        return (
          <ToolbarSelect
            value={current}
            placeholder="Custom"
            options={HEADING_PRESETS.map((p) => ({ label: p.label, value: p.value }))}
            className="w-24"
            renderOption={(opt) => {
              const preset = HEADING_PRESETS.find((p) => p.value === opt.value);
              const previewSize = opt.value === "h1" ? 18 : opt.value === "h2" ? 15 : opt.value === "h3" ? 13 : 11;
              return (
                <span style={{ fontSize: `${previewSize}px`, fontWeight: preset?.bold ? "bold" : "normal" }} className="block py-1">
                  {opt.label}
                </span>
              );
            }}
            onChange={(val) => execCmd((e) => {
              const preset = HEADING_PRESETS.find((p) => p.value === val);
              if (!preset) return;
              let c = e.chain() as any;
              c = preset.fontSize ? c.setFontSize(preset.fontSize) : c.unsetFontSize();
              c = preset.bold ? c.setMark("bold") : c.unsetMark("bold");
              c.run();
            })}
          />
        );
      })()}

      <Sep />

      <FmtBtn active={editor ? editor.isActive("bold") : htmlHas("<strong", "font-weight: bold", "font-weight:bold")} onClick={() => execCmd((e) => e.chain().toggleBold().run())} title="Bold (⌘B)">
        <Bold className="size-3.5" />
      </FmtBtn>
      <FmtBtn active={editor ? editor.isActive("italic") : htmlHas("<em", "font-style: italic")} onClick={() => execCmd((e) => e.chain().toggleItalic().run())} title="Italic (⌘I)">
        <Italic className="size-3.5" />
      </FmtBtn>
      <FmtBtn active={editor ? editor.isActive("underline") : htmlHas("<u>", "<u ", "text-decoration: underline")} onClick={() => execCmd((e) => e.chain().toggleUnderline().run())} title="Underline (⌘U)">
        <UnderlineIcon className="size-3.5" />
      </FmtBtn>
      <FmtBtn active={editor ? editor.isActive("strike") : htmlHas("<s>", "<s ", "line-through")} onClick={() => execCmd((e) => e.chain().toggleStrike().run())} title="Strikethrough">
        <Strikethrough className="size-3.5" />
      </FmtBtn>

      <TextColorPicker
        color={editor?.getAttributes("textStyle").color ?? parseUniformStyle(contentHtml, "color") ?? null}
        onChange={(color) => execCmd((e) => {
          if (color) (e.chain() as any).setColor(color).run();
          else (e.chain() as any).unsetColor().run();
        })}
      />

      <Sep />

      <FmtBtn active={editor ? editor.isActive({ textAlign: "left" }) : !htmlHas("text-align: center", "text-align: right")} onClick={() => execCmd((e) => e.chain().setTextAlign("left").run())} title="Align left">
        <AlignLeft className="size-3.5" />
      </FmtBtn>
      <FmtBtn active={editor ? editor.isActive({ textAlign: "center" }) : htmlHas("text-align: center")} onClick={() => execCmd((e) => e.chain().setTextAlign("center").run())} title="Center">
        <AlignCenter className="size-3.5" />
      </FmtBtn>
      <FmtBtn active={editor ? editor.isActive({ textAlign: "right" }) : htmlHas("text-align: right")} onClick={() => execCmd((e) => e.chain().setTextAlign("right").run())} title="Align right">
        <AlignRight className="size-3.5" />
      </FmtBtn>

      <Sep />

      <FmtBtn active={editor ? editor.isActive("bulletList") : htmlHas("<ul")} onClick={() => execCmd((e) => e.chain().toggleBulletList().run())} title="Bullet list">
        <List className="size-3.5" />
      </FmtBtn>
      <FmtBtn active={editor ? editor.isActive("orderedList") : htmlHas("<ol")} onClick={() => execCmd((e) => e.chain().toggleOrderedList().run())} title="Numbered list">
        <ListOrdered className="size-3.5" />
      </FmtBtn>

      <Sep />

      <FmtBtn onClick={() => editor?.chain().focus().undo().run()} title="Undo">
        <RotateCcw className="size-3.5" />
      </FmtBtn>
      <FmtBtn onClick={() => editor?.chain().focus().redo().run()} title="Redo">
        <RotateCw className="size-3.5" />
      </FmtBtn>
    </div>
  );
}
