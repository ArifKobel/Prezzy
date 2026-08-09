import type { ElementProps, ElementType } from "@Prezzy/shared";

export interface LayoutSlot {
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  props?: ElementProps;
  role: string;
}

export interface SlideLayout {
  id: string;
  label: string;
  description: string;
  slots: LayoutSlot[];
}

export const SLIDE_LAYOUTS: SlideLayout[] = [
  {
    id: "title",
    label: "Title Slide",
    description: "Big centered title with subtitle",
    slots: [
      { type: "heading", role: "title", x: 10, y: 28, width: 80, height: 14, props: { content: '<p style="text-align: center"><strong><span style="font-size: 60px;">Title</span></strong></p>' } },
      { type: "text", role: "subtitle", x: 20, y: 44, width: 60, height: 10, props: { content: '<p style="text-align: center"><span style="font-size: 22px;">Subtitle goes here</span></p>' } },
    ],
  },
  {
    id: "section",
    label: "Section Divider",
    description: "Bold section heading",
    slots: [
      { type: "shape", role: "background", x: 0, y: 0, width: 100, height: 100, props: { color: "var(--color-primary)", shapeType: "rectangle", opacity: 100 } },
      { type: "heading", role: "title", x: 10, y: 35, width: 80, height: 14, props: { content: '<p style="text-align: center"><strong><span style="font-size: 52px;">Section Title</span></strong></p>' } },
    ],
  },
  {
    id: "title-body",
    label: "Title + Body",
    description: "Title with paragraph text below",
    slots: [
      { type: "heading", role: "title", x: 8, y: 8, width: 84, height: 12, props: { content: '<p><strong><span style="font-size: 42px;">Heading</span></strong></p>' } },
      { type: "text", role: "body", x: 8, y: 22, width: 84, height: 65, props: { content: '<p><span style="font-size: 20px;">Body text goes here. Add your main content to this area.</span></p>' } },
    ],
  },
  {
    id: "title-bullets",
    label: "Title + Bullets",
    description: "Title with bullet point list",
    slots: [
      { type: "heading", role: "title", x: 8, y: 8, width: 84, height: 12, props: { content: '<p><strong><span style="font-size: 42px;">Key Points</span></strong></p>' } },
      { type: "text", role: "bullets", x: 8, y: 22, width: 84, height: 65, props: { content: '<ul><li><p><span style="font-size: 20px;">First point</span></p></li><li><p><span style="font-size: 20px;">Second point</span></p></li><li><p><span style="font-size: 20px;">Third point</span></p></li></ul>' } },
    ],
  },
  {
    id: "image-left",
    label: "Image Left",
    description: "Image on left, text on right",
    slots: [
      { type: "image", role: "image", x: 3, y: 3, width: 45, height: 94, props: { objectFit: "cover", borderRadius: 12 } },
      { type: "heading", role: "title", x: 53, y: 10, width: 42, height: 12, props: { content: '<p><strong><span style="font-size: 36px;">Heading</span></strong></p>' } },
      { type: "text", role: "body", x: 53, y: 24, width: 42, height: 60, props: { content: '<p><span style="font-size: 18px;">Description text goes here.</span></p>' } },
    ],
  },
  {
    id: "image-right",
    label: "Image Right",
    description: "Text on left, image on right",
    slots: [
      { type: "heading", role: "title", x: 5, y: 10, width: 42, height: 12, props: { content: '<p><strong><span style="font-size: 36px;">Heading</span></strong></p>' } },
      { type: "text", role: "body", x: 5, y: 24, width: 42, height: 60, props: { content: '<p><span style="font-size: 18px;">Description text goes here.</span></p>' } },
      { type: "image", role: "image", x: 52, y: 3, width: 45, height: 94, props: { objectFit: "cover", borderRadius: 12 } },
    ],
  },
  {
    id: "image-full",
    label: "Full Image",
    description: "Full-bleed image with overlay text",
    slots: [
      { type: "image", role: "image", x: 0, y: 0, width: 100, height: 100, props: { objectFit: "cover", borderRadius: 0, opacity: 60 } },
      { type: "heading", role: "title", x: 10, y: 65, width: 80, height: 14, props: { content: '<p style="text-align: center"><strong><span style="font-size: 48px;">Caption</span></strong></p>' } },
    ],
  },
  {
    id: "two-column",
    label: "Two Columns",
    description: "Side-by-side text columns",
    slots: [
      { type: "heading", role: "title", x: 5, y: 6, width: 90, height: 12, props: { content: '<p style="text-align: center"><strong><span style="font-size: 38px;">Comparison</span></strong></p>' } },
      { type: "text", role: "left", x: 5, y: 20, width: 42, height: 68, props: { content: '<p><strong><span style="font-size: 20px;">Column A</span></strong></p><p><span style="font-size: 18px;">Content for the left column.</span></p>' } },
      { type: "text", role: "right", x: 53, y: 20, width: 42, height: 68, props: { content: '<p><strong><span style="font-size: 20px;">Column B</span></strong></p><p><span style="font-size: 18px;">Content for the right column.</span></p>' } },
    ],
  },
  {
    id: "big-quote",
    label: "Big Quote",
    description: "Large quote with attribution",
    slots: [
      { type: "heading", role: "quote", x: 10, y: 20, width: 80, height: 35, props: { content: '<p style="text-align: center"><em><span style="font-size: 36px;">"Your inspiring quote goes here. Make it memorable."</span></em></p>' } },
      { type: "text", role: "attribution", x: 30, y: 58, width: 40, height: 8, props: { content: '<p style="text-align: center"><span style="font-size: 18px;">— Author Name</span></p>' } },
    ],
  },
  {
    id: "blank",
    label: "Blank",
    description: "Empty slide",
    slots: [],
  },
  {
    id: "quiz",
    label: "Quiz",
    description: "Interactive quiz slide",
    slots: [
      { type: "quiz", role: "quiz", x: 5, y: 10, width: 90, height: 75, props: { question: "Your question here", options: ["Option A", "Option B", "Option C"] } },
    ],
  },
  {
    id: "wordcloud",
    label: "Word Cloud",
    description: "Prompt heading with live word cloud",
    slots: [
      { type: "heading", role: "title", x: 8, y: 8, width: 84, height: 12, props: { content: '<p style="text-align: center"><strong><span style="font-size: 40px;">Share a word</span></strong></p>' } },
      { type: "wordcloud", role: "cloud", x: 8, y: 24, width: 84, height: 64, props: { prompt: "Share a word..." } },
    ],
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    description: "Heading with live quiz scoreboard",
    slots: [
      { type: "heading", role: "title", x: 8, y: 8, width: 84, height: 12, props: { content: '<p><strong><span style="font-size: 40px;">Leaderboard</span></strong></p>' } },
      { type: "leaderboard", role: "board", x: 8, y: 24, width: 84, height: 68 },
    ],
  },
  {
    id: "join-page",
    label: "Join Page",
    description: "Headline, instructions and QR code",
    slots: [
      { type: "heading", role: "title", x: 8, y: 16, width: 44, height: 22, props: { content: '<p><strong><span style="font-size: 44px;">Join the presentation</span></strong></p>' } },
      { type: "text", role: "body", x: 8, y: 42, width: 40, height: 20, props: { content: '<p><span style="font-size: 20px;">Scan the QR code or open the join page and enter the session code.</span></p>' } },
      { type: "qrcode", role: "qr", x: 58, y: 16, width: 30, height: 62 },
    ],
  },
];

export function getLayout(id: string): SlideLayout | undefined {
  return SLIDE_LAYOUTS.find((l) => l.id === id);
}

