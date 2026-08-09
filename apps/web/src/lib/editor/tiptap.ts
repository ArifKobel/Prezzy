import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Underline } from "@tiptap/extension-underline";
import { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export const ExtendedTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      ...(this.parent?.() ?? {}),
      fontFamily: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.fontFamily || null,
        renderHTML: (attrs: Record<string, string | null>) =>
          attrs.fontFamily ? { style: `font-family: ${attrs.fontFamily}` } : {},
      },
      fontSize: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.fontSize || null,
        renderHTML: (attrs: Record<string, string | null>) =>
          attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
      },
      color: {
        default: null,
        parseHTML: (el: HTMLElement) => el.style.color || null,
        renderHTML: (attrs: Record<string, string | null>) =>
          attrs.color ? { style: `color: ${attrs.color}` } : {},
      },
    };
  },
  addCommands() {
    type ChainArg = { chain: () => { setMark: (name: string, attrs: Record<string, string | null>) => { run: () => boolean } } };
    return {
      ...(this.parent?.() ?? {}),
      setFontFamily: (fontFamily: string) => ({ chain }: ChainArg) =>
        chain().setMark("textStyle", { fontFamily }).run(),
      unsetFontFamily: () => ({ chain }: ChainArg) =>
        chain().setMark("textStyle", { fontFamily: null }).run(),
      setFontSize: (fontSize: string) => ({ chain }: ChainArg) =>
        chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize: () => ({ chain }: ChainArg) =>
        chain().setMark("textStyle", { fontSize: null }).run(),
      setColor: (color: string) => ({ chain }: ChainArg) =>
        chain().setMark("textStyle", { color }).run(),
      unsetColor: () => ({ chain }: ChainArg) =>
        chain().setMark("textStyle", { color: null }).run(),
    } as any;
  },
});

export const HEADING_PRESETS = [
  { label: "Normal", value: "normal", fontSize: "",    bold: false },
  { label: "H1",     value: "h1",     fontSize: "48px", bold: true  },
  { label: "H2",     value: "h2",     fontSize: "36px", bold: true  },
  { label: "H3",     value: "h3",     fontSize: "28px", bold: true  },
];

export const FONT_FAMILIES = [
  { label: "Inter", value: "'Inter Variable', sans-serif" },
  { label: "Manrope", value: "'Manrope Variable', sans-serif" },
  { label: "Space Grotesk", value: "'Space Grotesk Variable', sans-serif" },
  { label: "Sora", value: "'Sora Variable', sans-serif" },
  { label: "Outfit", value: "'Outfit Variable', sans-serif" },
  { label: "Archivo", value: "'Archivo Variable', sans-serif" },
  { label: "Bebas Neue", value: "'Bebas Neue', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display Variable', serif" },
  { label: "DM Serif Display", value: "'DM Serif Display', serif" },
  { label: "Libre Baskerville", value: "'Libre Baskerville', serif" },
  { label: "Crimson Text", value: "'Crimson Text', serif" },
  { label: "Bitter", value: "'Bitter Variable', serif" },
  { label: "Caveat", value: "'Caveat Variable', cursive" },
  { label: "JetBrains Mono", value: "'JetBrains Mono Variable', monospace" },
];

export const FONT_SIZES = ["8", "9", "10", "11", "12", "14", "18", "24", "30", "36", "48", "60", "72", "96"];

export const ELEMENT_DEFAULTS = {
  heading:   { x: 8, y: 8,  width: 84, height: 18, content: "<p><strong><span style=\"font-size: 48px;\">Heading</span></strong></p>" },
  text:      { x: 8, y: 35, width: 55, height: 22, content: "<p>Text box</p>" },
  image:     { x: 56, y: 25, width: 36, height: 50, content: "" },
  shape:     { x: 20, y: 30, width: 30, height: 30, content: "" },
  quiz:        { x: 5, y: 10, width: 90, height: 75, content: "" },
  wordcloud:   { x: 10, y: 10, width: 80, height: 70, content: "" },
  leaderboard: { x: 10, y: 5, width: 80, height: 85, content: "" },
  qrcode:      { x: 25, y: 10, width: 50, height: 80, content: "" },
} as const;

export const EDITOR_EXTENSIONS = [
  StarterKit.configure({ trailingNode: false }),
  Underline,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  ExtendedTextStyle,
];

export function applyToContentHtml(html: string, fn: (ed: Editor) => void): string {
  const ed = new Editor({
    element: document.createElement("div"),
    extensions: EDITOR_EXTENSIONS,
    content: html,
  });
  try {
    ed.commands.selectAll();
    fn(ed);
    return ed.getHTML();
  } finally {
    ed.destroy();
  }
}

export function parseUniformStyle(html: string, cssProp: string): string {
  const escaped = cssProp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?<![a-zA-Z-])${escaped}:\\s*([^;}"]+)`, "gi");
  const matches = [...html.matchAll(re)].map((m) => m[1].trim());
  if (matches.length === 0) return "";
  const first = matches[0];
  return matches.every((v) => v === first) ? first : "";
}
