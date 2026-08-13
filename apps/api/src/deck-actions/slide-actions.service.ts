import {
  addSlide,
  addSlideWithElements,
  duplicateSlide,
  removeSlide,
  reorderSlides,
  replaceSlideElements,
  setSlideBg,
  setSlideTitle,
  slideIds,
  type SlideElementInput,
} from "@Prezzy/editor-doc";
import { BadRequestException, Injectable } from "@nestjs/common";
import { DocEditor, requireSlide } from "@/deck-actions/doc-editor";
import { warningsForElements } from "@/deck-actions/element-diagnostics";
import { layoutElements, type LayoutContent } from "@/deck-actions/slide-layouts";

@Injectable()
export class SlideActionsService {
  constructor(private readonly editor: DocEditor) {}

  add(userId: string, presentationId: string, afterSlideId?: string) {
    return this.editor.withDoc(userId, presentationId, (doc) => {
      if (afterSlideId) requireSlide(doc, afterSlideId);
      return { slideId: addSlide(doc, afterSlideId) };
    });
  }

  addLayout(userId: string, presentationId: string, input: LayoutContent & { afterSlideId?: string }) {
    return this.editor.withDoc(userId, presentationId, (doc) => {
      if (input.afterSlideId) requireSlide(doc, input.afterSlideId);
      const created = addSlideWithElements(doc, layoutElements(input), input.afterSlideId, Date.now(), input.title);
      return { ...created, layout: input.layout };
    });
  }

  duplicate(userId: string, presentationId: string, slideId: string) {
    return this.editor.withDoc(userId, presentationId, (doc) => {
      requireSlide(doc, slideId);
      return { slideId: duplicateSlide(doc, slideId) };
    });
  }

  update(userId: string, presentationId: string, slideId: string, input: { title?: string; bg?: string | null }) {
    return this.editor.withDoc(userId, presentationId, (doc) => {
      requireSlide(doc, slideId);
      if (input.title !== undefined) setSlideTitle(doc, slideId, input.title);
      if (input.bg !== undefined) setSlideBg(doc, slideId, input.bg);
      return { slideId };
    });
  }

  remove(userId: string, presentationId: string, slideId: string) {
    return this.editor.withDoc(userId, presentationId, (doc) => {
      requireSlide(doc, slideId);
      if (slideIds(doc).length === 1) throw new BadRequestException("A presentation must keep one slide");
      removeSlide(doc, slideId);
      return { slideId };
    });
  }

  reorder(userId: string, presentationId: string, order: string[]) {
    return this.editor.withDoc(userId, presentationId, (doc) => {
      const current = slideIds(doc);
      if (current.length !== order.length || current.some((id) => !order.includes(id))) {
        throw new BadRequestException("slideIds must contain every slide exactly once");
      }
      reorderSlides(doc, order);
      return { slideIds: order };
    });
  }

  setContent(userId: string, presentationId: string, slideId: string, elements: SlideElementInput[]) {
    return this.editor.withDoc(userId, presentationId, (doc) => {
      requireSlide(doc, slideId);
      const elementIds = replaceSlideElements(doc, slideId, elements);
      return {
        slideId,
        elementIds,
        zIndices: elementIds.map((_, index) => index),
        warnings: warningsForElements(elements),
      };
    });
  }
}
