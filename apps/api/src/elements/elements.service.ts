import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { AccessService } from "@/access/access.service";
import { DRIZZLE } from "@/db/db.constants";
import type { Database } from "@/db/db.types";
import { type SlideElementRow, slideElements, slides } from "@/db/schema";
import type { FirstSlidePreview, SlideElement } from "@/shared";
import { toElement } from "@/elements/element.serializer";

@Injectable()
export class ElementsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly access: AccessService,
  ) {}

  async listBySlide(slideId: string): Promise<SlideElement[]> {
    const rows = await this.selectBySlide(slideId);
    return rows.map(toElement);
  }

  async listByPresentation(presentationId: string, userId: string): Promise<SlideElement[]> {
    await this.access.ownedPresentation(presentationId, userId);
    const rows = await this.db
      .select({ element: slideElements })
      .from(slideElements)
      .innerJoin(slides, eq(slides.id, slideElements.slideId))
      .where(eq(slides.presentationId, presentationId))
      .orderBy(asc(slides.order), asc(slides.createdAt), asc(slideElements.createdAt));
    return rows.map((row) => toElement(row.element));
  }

  async listFirstSlide(presentationId: string, userId: string): Promise<FirstSlidePreview> {
    await this.access.ownedPresentation(presentationId, userId);
    const [first] = await this.db
      .select()
      .from(slides)
      .where(eq(slides.presentationId, presentationId))
      .orderBy(asc(slides.order), asc(slides.createdAt))
      .limit(1);
    if (!first) return { bg: null, elements: [] };
    return { bg: first.bg, elements: await this.listBySlide(first.id) };
  }

  private selectBySlide(slideId: string): Promise<SlideElementRow[]> {
    return this.db
      .select()
      .from(slideElements)
      .where(eq(slideElements.slideId, slideId))
      .orderBy(asc(slideElements.createdAt))
      .limit(200);
  }
}
