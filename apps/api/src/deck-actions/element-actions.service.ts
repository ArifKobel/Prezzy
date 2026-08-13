import {
  addElement,
  elementAt,
  moveElements,
  removeElements,
  reorderElement,
  setGeometry,
  setProps,
  type NewElement,
  type ReorderAction,
} from "@Prezzy/editor-doc";
import { Injectable } from "@nestjs/common";
import type { ElementProps } from "@Prezzy/shared";
import { DocEditor, requireElement, requireSlide } from "@/deck-actions/doc-editor";
import { elementWarnings } from "@/deck-actions/element-diagnostics";

export interface ElementPatch {
  geometry?: { x: number; y: number; width: number; height: number };
  position?: { x: number; y: number };
  props?: ElementProps;
  order?: ReorderAction;
}

@Injectable()
export class ElementActionsService {
  constructor(private readonly editor: DocEditor) {}

  add(userId: string, presentationId: string, input: NewElement) {
    return this.editor.withDoc(userId, presentationId, (doc) => {
      requireSlide(doc, input.slideId);
      const elementId = addElement(doc, input);
      return { elementId, zIndex: elementAt(doc, elementId)?.zIndex ?? 0, warnings: elementWarnings(input) };
    });
  }

  update(userId: string, presentationId: string, elementId: string, patch: ElementPatch) {
    return this.editor.withDoc(userId, presentationId, (doc) => {
      requireElement(doc, elementId);
      if (patch.geometry) setGeometry(doc, elementId, patch.geometry);
      if (patch.position) moveElements(doc, [{ id: elementId, ...patch.position }]);
      if (patch.props) setProps(doc, elementId, patch.props);
      if (patch.order) reorderElement(doc, elementId, patch.order);
      const element = elementAt(doc, elementId);
      return {
        elementId,
        zIndex: element?.zIndex ?? 0,
        warnings: element ? elementWarnings(element) : [],
      };
    });
  }

  remove(userId: string, presentationId: string, elementIds: string[]) {
    return this.editor.withDoc(userId, presentationId, (doc) => {
      removeElements(doc, elementIds);
      return { elementIds };
    });
  }
}
