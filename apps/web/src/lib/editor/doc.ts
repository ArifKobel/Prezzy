import type { ElementProps, ElementType, PresentationTheme, Slide, SlideElement } from "@Prezzy/shared";
import * as Y from "yjs";

export const LOCAL_ORIGIN = Symbol("local");
export const REMOTE_ORIGIN = Symbol("remote");

export type YElement = Y.Map<unknown>;
export type YSlide = Y.Map<unknown>;

export interface DocSnapshot {
  title: string;
  theme: PresentationTheme | null;
  slides: Slide[];
  elements: SlideElement[];
}

export function createDoc(): Y.Doc {
  const doc = new Y.Doc();
  doc.getMap("meta");
  doc.getMap("slides");
  doc.getMap("elements");
  return doc;
}

export const metaOf = (doc: Y.Doc) => doc.getMap<unknown>("meta");
export const slidesOf = (doc: Y.Doc) => doc.getMap<YSlide>("slides");
export const elementsOf = (doc: Y.Doc) => doc.getMap<YElement>("elements");

export function loadDoc(
  doc: Y.Doc,
  input: { title: string; theme: PresentationTheme | null; slides: Slide[]; elements: SlideElement[] },
): void {
  Y.transact(doc, () => {
    const meta = metaOf(doc);
    const slides = slidesOf(doc);
    const elements = elementsOf(doc);

    meta.set("title", input.title);
    meta.set("theme", themeToY(input.theme));

    for (const key of [...slides.keys()]) slides.delete(key);
    for (const key of [...elements.keys()]) elements.delete(key);

    for (const slide of input.slides) slides.set(slide.id, slideToY(slide));
    for (const element of input.elements) elements.set(element.id, elementToY(element));
  }, REMOTE_ORIGIN);
}

export function snapshot(doc: Y.Doc): DocSnapshot {
  const meta = metaOf(doc);
  const slides: Slide[] = [];
  for (const [id, value] of slidesOf(doc).entries()) {
    slides.push({
      id,
      presentationId: (meta.get("presentationId") as string) ?? "",
      order: (value.get("order") as number) ?? 0,
      title: (value.get("title") as string | null) ?? null,
      bg: (value.get("bg") as string | null) ?? null,
      createdAt: (value.get("createdAt") as number) ?? 0,
    });
  }
  slides.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);

  const elements: SlideElement[] = [];
  for (const [id, value] of elementsOf(doc).entries()) {
    elements.push({
      id,
      slideId: value.get("slideId") as string,
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
  elements.sort(
    (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0) || a.createdAt - b.createdAt,
  );

  return {
    title: (meta.get("title") as string) ?? "",
    theme: themeFromY(meta.get("theme") as Y.Map<unknown> | undefined),
    slides,
    elements,
  };
}

export function elementsOfSlide(doc: Y.Doc, slideId: string): SlideElement[] {
  return snapshot(doc).elements.filter((el) => el.slideId === slideId);
}

function slideToY(slide: Slide): YSlide {
  const map = new Y.Map<unknown>();
  map.set("order", slide.order);
  map.set("title", slide.title);
  map.set("bg", slide.bg);
  map.set("createdAt", slide.createdAt);
  return map;
}

function elementToY(element: SlideElement): YElement {
  const map = new Y.Map<unknown>();
  map.set("slideId", element.slideId);
  map.set("type", element.type);
  map.set("x", element.x);
  map.set("y", element.y);
  map.set("width", element.width);
  map.set("height", element.height);
  map.set("zIndex", element.zIndex);
  map.set("createdAt", element.createdAt);
  map.set("props", recordToY(element.props ?? {}));
  return map;
}

function recordToY(record: Record<string, unknown> | ElementProps): Y.Map<unknown> {
  const map = new Y.Map<unknown>();
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined) map.set(key, value);
  }
  return map;
}

function themeToY(theme: PresentationTheme | null): Y.Map<unknown> | null {
  return theme ? recordToY(theme as Record<string, unknown>) : null;
}

function themeFromY(map: Y.Map<unknown> | undefined): PresentationTheme | null {
  if (!map) return null;
  return Object.fromEntries(map.entries()) as PresentationTheme;
}

function propsFromY(map: Y.Map<unknown> | undefined): ElementProps | null {
  if (!map) return null;
  const entries = [...map.entries()];
  if (entries.length === 0) return null;
  return Object.fromEntries(entries) as ElementProps;
}
