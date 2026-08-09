import * as Y from "yjs";
import type { PresentationRow, SlideElementRow, SlideRow } from "@/db/schema";
import type { ElementProps, ElementType, PresentationTheme } from "@/shared";

export interface DocSlide {
  id: string;
  order: number;
  title: string | null;
  bg: string | null;
  createdAt: number;
}

export interface DocElement {
  id: string;
  slideId: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number | null;
  props: ElementProps | null;
  createdAt: number;
}

export interface DocContent {
  title: string;
  theme: PresentationTheme | null;
  slides: DocSlide[];
  elements: DocElement[];
}

const metaOf = (doc: Y.Doc) => doc.getMap<unknown>("meta");
const slidesOf = (doc: Y.Doc) => doc.getMap<Y.Map<unknown>>("slides");
const elementsOf = (doc: Y.Doc) => doc.getMap<Y.Map<unknown>>("elements");

export function hydrateDoc(
  doc: Y.Doc,
  presentation: PresentationRow,
  slideRows: SlideRow[],
  elementRows: SlideElementRow[],
): void {
  Y.transact(doc, () => {
    const meta = metaOf(doc);
    meta.set("presentationId", presentation.id);
    meta.set("title", presentation.title);
    meta.set("theme", presentation.theme ? recordToY(presentation.theme) : null);

    for (const row of slideRows) {
      const slide = new Y.Map<unknown>();
      slide.set("order", row.order);
      slide.set("title", row.title);
      slide.set("bg", row.bg);
      slide.set("createdAt", row.createdAt.getTime());
      slidesOf(doc).set(row.id, slide);
    }

    for (const row of elementRows) {
      const element = new Y.Map<unknown>();
      element.set("slideId", row.slideId);
      element.set("type", row.type);
      element.set("x", row.x);
      element.set("y", row.y);
      element.set("width", row.width);
      element.set("height", row.height);
      element.set("zIndex", row.zIndex);
      element.set("createdAt", row.createdAt.getTime());
      element.set("props", recordToY(row.props ?? {}));
      elementsOf(doc).set(row.id, element);
    }
  });
}

export function readDoc(doc: Y.Doc): DocContent {
  const meta = metaOf(doc);

  const slides: DocSlide[] = [];
  for (const [id, value] of slidesOf(doc).entries()) {
    slides.push({
      id,
      order: (value.get("order") as number) ?? 0,
      title: (value.get("title") as string | null) ?? null,
      bg: (value.get("bg") as string | null) ?? null,
      createdAt: (value.get("createdAt") as number) ?? 0,
    });
  }
  slides.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);

  const slideIds = new Set(slides.map((slide) => slide.id));
  const elements: DocElement[] = [];
  for (const [id, value] of elementsOf(doc).entries()) {
    const slideId = value.get("slideId") as string;
    if (!slideIds.has(slideId)) continue;
    elements.push({
      id,
      slideId,
      type: value.get("type") as ElementType,
      x: value.get("x") as number,
      y: value.get("y") as number,
      width: value.get("width") as number,
      height: value.get("height") as number,
      zIndex: (value.get("zIndex") as number | null) ?? null,
      props: propsFromY(value.get("props") as Y.Map<unknown> | undefined),
      createdAt: (value.get("createdAt") as number) ?? 0,
    });
  }
  elements.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0) || a.createdAt - b.createdAt);

  return {
    title: (meta.get("title") as string) ?? "",
    theme: themeFromY(meta.get("theme") as Y.Map<unknown> | undefined),
    slides,
    elements,
  };
}

function recordToY(record: object): Y.Map<unknown> {
  const map = new Y.Map<unknown>();
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined) map.set(key, value);
  }
  return map;
}

function themeFromY(map: Y.Map<unknown> | undefined | null): PresentationTheme | null {
  if (!map) return null;
  return Object.fromEntries(map.entries()) as PresentationTheme;
}

function propsFromY(map: Y.Map<unknown> | undefined): ElementProps | null {
  if (!map || map.size === 0) return null;
  return Object.fromEntries(map.entries()) as ElementProps;
}
