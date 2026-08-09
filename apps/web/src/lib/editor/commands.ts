import type { ElementProps, ElementType, PresentationTheme } from "@Prezzy/shared";
import * as Y from "yjs";
import {
  LOCAL_ORIGIN,
  type YElement,
  elementsOf,
  metaOf,
  slidesOf,
} from "@/lib/editor/doc";

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

const newId = () => crypto.randomUUID();

function edit<T>(doc: Y.Doc, fn: () => T): T {
  let result!: T;
  Y.transact(doc, () => { result = fn(); }, LOCAL_ORIGIN);
  return result;
}

function slideEntries(doc: Y.Doc): Array<[string, Y.Map<unknown>]> {
  return [...slidesOf(doc).entries()].sort(
    (a, b) =>
      ((a[1].get("order") as number) ?? 0) - ((b[1].get("order") as number) ?? 0) ||
      ((a[1].get("createdAt") as number) ?? 0) - ((b[1].get("createdAt") as number) ?? 0),
  );
}

function renumberSlides(doc: Y.Doc): void {
  slideEntries(doc).forEach(([, slide], index) => {
    if (slide.get("order") !== index) slide.set("order", index);
  });
}

function elementEntries(doc: Y.Doc, slideId: string): Array<[string, YElement]> {
  return [...elementsOf(doc).entries()]
    .filter(([, el]) => el.get("slideId") === slideId)
    .sort(
      (a, b) =>
        ((a[1].get("zIndex") as number) ?? 0) - ((b[1].get("zIndex") as number) ?? 0) ||
        ((a[1].get("createdAt") as number) ?? 0) - ((b[1].get("createdAt") as number) ?? 0),
    );
}

function renumberElements(doc: Y.Doc, slideId: string): Array<[string, YElement]> {
  const entries = elementEntries(doc, slideId);
  entries.forEach(([, el], index) => {
    if (el.get("zIndex") !== index) el.set("zIndex", index);
  });
  return entries;
}

export function addSlide(doc: Y.Doc, afterSlideId?: string, createdAt = Date.now()): string {
  return edit(doc, () => {
    const entries = slideEntries(doc);
    const at = afterSlideId ? entries.findIndex(([id]) => id === afterSlideId) : entries.length - 1;
    const id = newId();
    const slide = new Y.Map<unknown>();
    slide.set("order", at + 0.5);
    slide.set("title", `Slide ${entries.length + 1}`);
    slide.set("createdAt", createdAt);
    slidesOf(doc).set(id, slide);
    renumberSlides(doc);
    return id;
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

    elementEntries(doc, slideId).forEach(([, el], index) => {
      const clone = new Y.Map<unknown>();
      for (const [key, value] of el.entries()) {
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
  edit(doc, () => { slidesOf(doc).get(slideId)?.set("title", title); });
}

export function setSlideBg(doc: Y.Doc, slideId: string, bg: string | null): void {
  edit(doc, () => { slidesOf(doc).get(slideId)?.set("bg", bg); });
}

export function addElement(doc: Y.Doc, input: NewElement, createdAt = Date.now()): string {
  return edit(doc, () => {
    const id = newId();
    const siblings = elementEntries(doc, input.slideId);
    const el = new Y.Map<unknown>();
    el.set("slideId", input.slideId);
    el.set("type", input.type);
    el.set("x", input.x);
    el.set("y", input.y);
    el.set("width", input.width);
    el.set("height", input.height);
    el.set("zIndex", input.zIndex ?? siblings.length);
    el.set("createdAt", createdAt);
    const props = new Y.Map<unknown>();
    for (const [key, value] of Object.entries(input.props ?? {})) {
      if (value !== undefined) props.set(key, value);
    }
    el.set("props", props);
    elementsOf(doc).set(id, el);
    renumberElements(doc, input.slideId);
    return id;
  });
}

export function removeElements(doc: Y.Doc, ids: string[]): void {
  edit(doc, () => {
    const slideIds = new Set<string>();
    for (const id of ids) {
      const el = elementsOf(doc).get(id);
      if (!el) continue;
      slideIds.add(el.get("slideId") as string);
      elementsOf(doc).delete(id);
    }
    for (const slideId of slideIds) renumberElements(doc, slideId);
  });
}

export function moveElements(doc: Y.Doc, moves: Array<{ id: string; x: number; y: number }>): void {
  edit(doc, () => {
    for (const move of moves) {
      const el = elementsOf(doc).get(move.id);
      if (!el) continue;
      el.set("x", move.x);
      el.set("y", move.y);
    }
  });
}

export function setGeometry(
  doc: Y.Doc,
  id: string,
  geo: { x: number; y: number; width: number; height: number },
): void {
  edit(doc, () => {
    const el = elementsOf(doc).get(id);
    if (!el) return;
    el.set("x", geo.x);
    el.set("y", geo.y);
    el.set("width", geo.width);
    el.set("height", geo.height);
  });
}

export function setProps(doc: Y.Doc, id: string, patch: ElementProps): void {
  edit(doc, () => {
    const el = elementsOf(doc).get(id);
    if (!el) return;
    const props = el.get("props") as Y.Map<unknown>;
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      if (value === null) props.delete(key);
      else props.set(key, value);
    }
  });
}

export function reorderElement(doc: Y.Doc, id: string, action: ReorderAction): void {
  edit(doc, () => {
    const el = elementsOf(doc).get(id);
    if (!el) return;
    const slideId = el.get("slideId") as string;
    const entries = renumberElements(doc, slideId);
    const index = entries.findIndex(([entryId]) => entryId === id);
    if (index === -1) return;

    const target =
      action === "front" ? entries.length - 1
        : action === "back" ? 0
          : action === "forward" ? Math.min(index + 1, entries.length - 1)
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
  edit(doc, () => { metaOf(doc).set("title", title); });
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
