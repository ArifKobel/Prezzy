import type { ElementProps, ElementType, PresentationTheme } from "@Prezzy/shared";
import * as Y from "yjs";
import { LOCAL_ORIGIN, type YElement, elementsOf, metaOf, orderedSlideEntries, slidesOf } from "./doc";

export type ReorderAction = "front" | "forward" | "backward" | "back";

export interface NewElement {
  slideId: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  props?: ElementProps;
  zIndex?: number;
}

export type SlideElementInput = Omit<NewElement, "slideId">;

const newId = () => crypto.randomUUID();

function edit<T>(doc: Y.Doc, fn: () => T): T {
  let result!: T;
  Y.transact(doc, () => {
    result = fn();
  }, LOCAL_ORIGIN);
  return result;
}

function renumberSlides(doc: Y.Doc): void {
  orderedSlideEntries(doc).forEach(([, slide], index) => {
    if (slide.get("order") !== index) slide.set("order", index);
  });
}

function elementEntries(doc: Y.Doc, slideId: string): Array<[string, YElement]> {
  return [...elementsOf(doc).entries()]
    .filter(([, element]) => element.get("slideId") === slideId)
    .sort(
      (a, b) =>
        ((a[1].get("zIndex") as number) ?? 0) - ((b[1].get("zIndex") as number) ?? 0) ||
        ((a[1].get("createdAt") as number) ?? 0) - ((b[1].get("createdAt") as number) ?? 0),
    );
}

function renumberElements(doc: Y.Doc, slideId: string): Array<[string, YElement]> {
  const entries = elementEntries(doc, slideId);
  entries.forEach(([, element], index) => {
    if (element.get("zIndex") !== index) element.set("zIndex", index);
  });
  return entries;
}

function createElement(input: NewElement, zIndex: number, createdAt: number): [string, YElement] {
  const id = newId();
  const element = new Y.Map<unknown>();
  element.set("slideId", input.slideId);
  element.set("type", input.type);
  element.set("x", input.x);
  element.set("y", input.y);
  element.set("width", input.width);
  element.set("height", input.height);
  element.set("zIndex", zIndex);
  element.set("createdAt", createdAt);
  const props = new Y.Map<unknown>();
  for (const [key, value] of Object.entries(input.props ?? {})) {
    if (value !== undefined) props.set(key, value);
  }
  element.set("props", props);
  return [id, element];
}

function insertSlide(doc: Y.Doc, afterSlideId: string | undefined, createdAt: number): string {
  const entries = orderedSlideEntries(doc);
  const at = afterSlideId ? entries.findIndex(([id]) => id === afterSlideId) : entries.length - 1;
  const id = newId();
  const slide = new Y.Map<unknown>();
  slide.set("order", at + 0.5);
  slide.set("title", `Slide ${entries.length + 1}`);
  slide.set("createdAt", createdAt);
  slidesOf(doc).set(id, slide);
  renumberSlides(doc);
  return id;
}

export function addSlide(doc: Y.Doc, afterSlideId?: string, createdAt = Date.now()): string {
  return edit(doc, () => insertSlide(doc, afterSlideId, createdAt));
}

export function addSlideWithElements(
  doc: Y.Doc,
  inputs: SlideElementInput[],
  afterSlideId?: string,
  createdAt = Date.now(),
  title?: string,
): { slideId: string; elementIds: string[] } {
  return edit(doc, () => {
    const slideId = insertSlide(doc, afterSlideId, createdAt);
    if (title !== undefined) slidesOf(doc).get(slideId)?.set("title", title);
    const elementIds = inputs.map((input, index) => {
      const [id, element] = createElement({ ...input, slideId }, index, createdAt + index + 1);
      elementsOf(doc).set(id, element);
      return id;
    });
    return { slideId, elementIds };
  });
}

export function removeSlide(doc: Y.Doc, slideId: string): void {
  edit(doc, () => {
    for (const [id] of elementEntries(doc, slideId)) elementsOf(doc).delete(id);
    slidesOf(doc).delete(slideId);
    renumberSlides(doc);
  });
}

export function duplicateSlide(doc: Y.Doc, slideId: string, createdAt = Date.now()): string {
  return edit(doc, () => {
    const source = slidesOf(doc).get(slideId);
    if (!source) throw new Error("slide not found");
    const id = newId();
    const copy = new Y.Map<unknown>();
    copy.set("order", ((source.get("order") as number) ?? 0) + 0.5);
    const title = source.get("title") as string | null;
    copy.set("title", title ? `${title} (copy)` : null);
    copy.set("createdAt", createdAt);
    slidesOf(doc).set(id, copy);

    elementEntries(doc, slideId).forEach(([, element], index) => {
      const clone = new Y.Map<unknown>();
      for (const [key, value] of element.entries()) {
        clone.set(key, value instanceof Y.Map ? value.clone() : value);
      }
      clone.set("slideId", id);
      clone.set("zIndex", index);
      clone.set("createdAt", createdAt + index);
      elementsOf(doc).set(newId(), clone);
    });

    renumberSlides(doc);
    return id;
  });
}

export function reorderSlides(doc: Y.Doc, slideIds: string[]): void {
  edit(doc, () => {
    slideIds.forEach((id, index) => {
      slidesOf(doc).get(id)?.set("order", index);
    });
    renumberSlides(doc);
  });
}

export function setSlideTitle(doc: Y.Doc, slideId: string, title: string): void {
  edit(doc, () => {
    slidesOf(doc).get(slideId)?.set("title", title);
  });
}

export function setSlideBg(doc: Y.Doc, slideId: string, bg: string | null): void {
  edit(doc, () => {
    slidesOf(doc).get(slideId)?.set("bg", bg);
  });
}

export function addElement(doc: Y.Doc, input: NewElement, createdAt = Date.now()): string {
  return edit(doc, () => {
    const siblings = elementEntries(doc, input.slideId);
    const at = Math.max(0, Math.min(input.zIndex ?? siblings.length, siblings.length));
    const [id, element] = createElement(input, at, createdAt);
    elementsOf(doc).set(id, element);
    const ordered = siblings.map(([siblingId]) => siblingId);
    ordered.splice(at, 0, id);
    ordered.forEach((elementId, index) => {
      elementsOf(doc).get(elementId)?.set("zIndex", index);
    });
    return id;
  });
}

export function replaceSlideElements(
  doc: Y.Doc,
  slideId: string,
  inputs: SlideElementInput[],
  createdAt = Date.now(),
): string[] {
  return edit(doc, () => {
    for (const [id] of elementEntries(doc, slideId)) elementsOf(doc).delete(id);
    return inputs.map((input, index) => {
      const [id, element] = createElement({ ...input, slideId }, index, createdAt + index);
      elementsOf(doc).set(id, element);
      return id;
    });
  });
}

export function removeElements(doc: Y.Doc, ids: string[]): void {
  edit(doc, () => {
    const slideIds = new Set<string>();
    for (const id of ids) {
      const element = elementsOf(doc).get(id);
      if (!element) continue;
      slideIds.add(element.get("slideId") as string);
      elementsOf(doc).delete(id);
    }
    for (const slideId of slideIds) renumberElements(doc, slideId);
  });
}

export function moveElements(doc: Y.Doc, moves: Array<{ id: string; x: number; y: number }>): void {
  edit(doc, () => {
    for (const move of moves) {
      const element = elementsOf(doc).get(move.id);
      if (!element) continue;
      element.set("x", move.x);
      element.set("y", move.y);
    }
  });
}

export function setGeometry(
  doc: Y.Doc,
  id: string,
  geometry: { x: number; y: number; width: number; height: number },
): void {
  edit(doc, () => {
    const element = elementsOf(doc).get(id);
    if (!element) return;
    element.set("x", geometry.x);
    element.set("y", geometry.y);
    element.set("width", geometry.width);
    element.set("height", geometry.height);
  });
}

export function setProps(doc: Y.Doc, id: string, patch: ElementProps): void {
  edit(doc, () => {
    const element = elementsOf(doc).get(id);
    if (!element) return;
    const props = element.get("props") as Y.Map<unknown>;
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      if (value === null) props.delete(key);
      else props.set(key, value);
    }
  });
}

export function reorderElement(doc: Y.Doc, id: string, action: ReorderAction): void {
  edit(doc, () => {
    const element = elementsOf(doc).get(id);
    if (!element) return;
    const slideId = element.get("slideId") as string;
    const entries = renumberElements(doc, slideId);
    const index = entries.findIndex(([entryId]) => entryId === id);
    if (index === -1) return;

    const target =
      action === "front"
        ? entries.length - 1
        : action === "back"
          ? 0
          : action === "forward"
            ? Math.min(index + 1, entries.length - 1)
            : Math.max(index - 1, 0);
    if (target === index) return;

    const reordered = entries.map(([entryId]) => entryId);
    reordered.splice(index, 1);
    reordered.splice(target, 0, id);
    reordered.forEach((entryId, position) => {
      elementsOf(doc).get(entryId)?.set("zIndex", position);
    });
  });
}

export function setTitle(doc: Y.Doc, title: string): void {
  edit(doc, () => {
    metaOf(doc).set("title", title);
  });
}

export type ThemePatch = { [K in keyof PresentationTheme]?: PresentationTheme[K] | null };

export function setTheme(doc: Y.Doc, patch: ThemePatch): void {
  edit(doc, () => {
    const meta = metaOf(doc);
    let theme = meta.get("theme") as Y.Map<unknown> | null;
    if (!theme) {
      theme = new Y.Map<unknown>();
      meta.set("theme", theme);
    }
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      if (value === null) theme.delete(key);
      else theme.set(key, value);
    }
  });
}
