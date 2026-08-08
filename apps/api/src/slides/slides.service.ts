import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import { AccessService } from "../access/access.service";
import { DRIZZLE } from "../db/db.constants";
import type { Database } from "../db/db.types";
import { type SlideRow, slideElements, slides } from "../db/schema";
import { EventsService } from "../events/events.service";
import type { ElementProps, Slide } from "../shared";
import type { CreateSlideFromLayoutDto } from "./dto/create-slide-from-layout.dto";
import { toSlide } from "./slide.serializer";

@Injectable()
export class SlidesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly access: AccessService,
    private readonly events: EventsService,
  ) {}

  async listByPresentation(presentationId: string, userId: string): Promise<Slide[]> {
    await this.access.ownedPresentation(presentationId, userId);
    const rows = await this.loadOrdered(presentationId);
    return rows.map(toSlide);
  }

  async create(presentationId: string, userId: string, afterOrder?: number): Promise<Slide> {
    const presentation = await this.access.ownedPresentation(presentationId, userId);
    const existing = await this.loadOrdered(presentationId);
    const [created] = await this.db
      .insert(slides)
      .values({
        presentationId,
        order: nextOrder(existing, afterOrder),
        title: `Slide ${existing.length + 1}`,
      })
      .returning();
    if (!created) throw new NotFoundException("Presentation not found");
    this.events.slidesChanged(this.access.target(presentation));
    return toSlide(created);
  }

  async createFromLayout(
    presentationId: string,
    userId: string,
    dto: CreateSlideFromLayoutDto,
  ): Promise<Slide> {
    const presentation = await this.access.ownedPresentation(presentationId, userId);
    const existing = dto.order === undefined ? await this.loadOrdered(presentationId) : [];
    const order = dto.order ?? nextOrder(existing, dto.afterOrder);
    const [created] = await this.db.insert(slides).values({ presentationId, order }).returning();
    if (!created) throw new NotFoundException("Presentation not found");

    if (dto.elements.length > 0) {
      await this.db.insert(slideElements).values(
        dto.elements.map((element, index) => ({
          slideId: created.id,
          type: element.type,
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          zIndex: index,
          props: element.props ? ({ ...element.props } as ElementProps) : null,
        })),
      );
    }

    const target = this.access.target(presentation);
    this.events.slidesChanged(target);
    this.events.elementsChanged(target, created.id);
    return toSlide(created);
  }

  async reorder(presentationId: string, userId: string, slideIds: string[]): Promise<void> {
    const presentation = await this.access.ownedPresentation(presentationId, userId);
    for (let index = 0; index < slideIds.length; index++) {
      await this.db
        .update(slides)
        .set({ order: index })
        .where(and(eq(slides.id, slideIds[index]), eq(slides.presentationId, presentationId)));
    }
    this.events.slidesChanged(this.access.target(presentation));
  }

  async duplicate(slideId: string, userId: string): Promise<Slide> {
    const { slide, presentation } = await this.access.ownedSlide(slideId, userId);
    const [created] = await this.db
      .insert(slides)
      .values({
        presentationId: slide.presentationId,
        order: slide.order + 0.5,
        title: slide.title ? `${slide.title} (copy)` : null,
      })
      .returning();
    if (!created) throw new NotFoundException("Slide not found");

    const elements = await this.db
      .select()
      .from(slideElements)
      .where(eq(slideElements.slideId, slideId))
      .orderBy(asc(slideElements.createdAt))
      .limit(200);

    if (elements.length > 0) {
      await this.db.insert(slideElements).values(
        elements.map((element) => ({
          slideId: created.id,
          type: element.type,
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          zIndex: element.zIndex,
          props: element.props,
        })),
      );
    }

    const target = this.access.target(presentation);
    this.events.slidesChanged(target);
    this.events.elementsChanged(target, created.id);
    return toSlide(created);
  }

  async updateTitle(slideId: string, userId: string, title: string): Promise<Slide> {
    const { presentation } = await this.access.ownedSlide(slideId, userId);
    const [updated] = await this.db
      .update(slides)
      .set({ title })
      .where(eq(slides.id, slideId))
      .returning();
    if (!updated) throw new NotFoundException("Slide not found");
    this.events.slidesChanged(this.access.target(presentation));
    return toSlide(updated);
  }

  async remove(slideId: string, userId: string): Promise<void> {
    const { presentation } = await this.access.ownedSlide(slideId, userId);
    await this.db.delete(slides).where(eq(slides.id, slideId));
    this.events.slidesChanged(this.access.target(presentation));
  }

  private loadOrdered(presentationId: string): Promise<SlideRow[]> {
    return this.db
      .select()
      .from(slides)
      .where(eq(slides.presentationId, presentationId))
      .orderBy(asc(slides.order))
      .limit(200);
  }
}

const nextOrder = (existing: SlideRow[], afterOrder?: number): number => {
  if (afterOrder !== undefined) return afterOrder + 1;
  if (existing.length === 0) return 0;
  return Math.max(...existing.map((slide) => slide.order)) + 1;
};
