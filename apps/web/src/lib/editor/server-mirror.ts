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
      map.delete(el.id);
      map.set(el.id, elementToY(el));
    }
  }, REMOTE_ORIGIN);
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
