import type { Slide, SlideElement } from "@Prezzy/shared";
import * as Y from "yjs";
import {
  REMOTE_ORIGIN,
  elementToY,
  elementsOf,
  slideToY,
  slidesOf,
} from "@/lib/editor/doc";

export function upsertServerSlide(doc: Y.Doc, slide: Slide): void {
  Y.transact(doc, () => { applySlide(doc, slide); }, REMOTE_ORIGIN);
}

export function mergeServerSlides(doc: Y.Doc, slides: Slide[]): void {
  Y.transact(doc, () => {
    const slideMap = slidesOf(doc);
    const keep = new Set(slides.map((slide) => slide.id));

    for (const id of [...slideMap.keys()]) {
      if (!keep.has(id)) slideMap.delete(id);
    }
    const elements = elementsOf(doc);
    for (const [id, el] of [...elements.entries()]) {
      if (!keep.has(el.get("slideId") as string)) elements.delete(id);
    }

    for (const slide of slides) {
      if (slideMap.has(slide.id)) applySlide(doc, slide);
    }
  }, REMOTE_ORIGIN);
}

export function applyServerElements(doc: Y.Doc, slideId: string, elements: SlideElement[]): void {
  Y.transact(doc, () => {
    const map = elementsOf(doc);
    const keep = new Set(elements.map((el) => el.id));
    for (const [id, el] of [...map.entries()]) {
      if (el.get("slideId") === slideId && !keep.has(id)) map.delete(id);
    }
    for (const el of elements) {
      const existing = map.get(el.id);
      if (existing && sameElement(existing, el)) continue;
      if (existing) map.delete(el.id);
      map.set(el.id, elementToY(el));
    }
  }, REMOTE_ORIGIN);
}

function sameElement(existing: Y.Map<unknown>, el: SlideElement): boolean {
  if (
    existing.get("slideId") !== el.slideId ||
    existing.get("type") !== el.type ||
    existing.get("x") !== el.x ||
    existing.get("y") !== el.y ||
    existing.get("width") !== el.width ||
    existing.get("height") !== el.height ||
    ((existing.get("zIndex") as number | null) ?? null) !== (el.zIndex ?? null)
  ) {
    return false;
  }
  return sameProps(existing.get("props") as Y.Map<unknown> | undefined, el.props);
}

function sameProps(map: Y.Map<unknown> | undefined, props: SlideElement["props"]): boolean {
  const target = Object.entries(props ?? {}).filter(([, value]) => value !== undefined);
  if ((map?.size ?? 0) !== target.length) return false;
  return target.every(([key, value]) => sameValue(map?.get(key), value));
}

function sameValue(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => item === b[index]);
  }
  return a === b;
}

function applySlide(doc: Y.Doc, slide: Slide): void {
  const slideMap = slidesOf(doc);
  const existing = slideMap.get(slide.id);
  if (!existing) {
    slideMap.set(slide.id, slideToY(slide));
    return;
  }
  if (existing.get("order") !== slide.order) existing.set("order", slide.order);
  if (existing.get("title") !== slide.title) existing.set("title", slide.title);
  if (existing.get("bg") !== slide.bg) existing.set("bg", slide.bg);
}
