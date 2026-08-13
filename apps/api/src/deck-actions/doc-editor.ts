import { hasElement, hasSlide } from "@Prezzy/editor-doc";
import { Injectable, NotFoundException } from "@nestjs/common";
import type { Doc } from "yjs";
import { AccessService } from "@/access/access.service";
import { DocRegistryService } from "@/collab/doc-registry.service";

@Injectable()
export class DocEditor {
  constructor(
    private readonly access: AccessService,
    private readonly docs: DocRegistryService,
  ) {}

  async withDoc<T>(userId: string, presentationId: string, fn: (doc: Doc) => T | Promise<T>): Promise<T> {
    await this.access.ownedPresentation(presentationId, userId);
    return this.docs.withDoc(presentationId, fn);
  }
}

export function requireSlide(doc: Doc, slideId: string): void {
  if (!hasSlide(doc, slideId)) throw new NotFoundException("Slide not found");
}

export function requireElement(doc: Doc, elementId: string): void {
  if (!hasElement(doc, elementId)) throw new NotFoundException("Element not found");
}
