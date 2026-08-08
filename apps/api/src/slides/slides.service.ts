import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { AccessService } from "@/access/access.service";
import { mergePatch } from "@/common/merge";
import { DRIZZLE } from "@/db/db.constants";
import type { Database } from "@/db/db.types";
import { type SlideRow, slideElements, slides } from "@/db/schema";
import { EventsService } from "@/events/events.service";
import type { ElementProps, Slide } from "@/shared";
import type { CreateSlideFromLayoutDto } from "@/slides/dto/create-slide-from-layout.dto";
import { toSlide } from "@/slides/slide.serializer";

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
        order: insertOrder(existing, afterOrder),
        title: `Slide ${existing.length + 1}`,
      })
      .returning();
    if (!created) throw new NotFoundException("Presentation not found");
    const normalized = await this.renumber(presentationId, created);
    this.events.slidesChanged(this.access.target(presentation));
    return toSlide(normalized);
  }

  async createFromLayout(
    presentationId: string,
    userId: string,
    dto: CreateSlideFromLayoutDto,
  ): Promise<Slide> {
    const presentation = await this.access.ownedPresentation(presentationId, userId);
    const existing = await this.loadOrdered(presentationId);
    const order = dto.order ?? insertOrder(existing, dto.afterOrder);
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
          props: element.props ? mergePatch<ElementProps>(null, element.props) : null,
        })),
      );
    }

    const normalized = await this.renumber(presentationId, created);
    const target = this.access.target(presentation);
    this.events.slidesChanged(target);
    this.events.elementsChanged(target, created.id);
    return toSlide(normalized);
  }

  async reorder(presentationId: string, userId: string, slideIds: string[]): Promise<void> {
    const presentation = await this.access.ownedPresentation(presentationId, userId);
    const rows = await this.loadOrdered(presentationId);
    const remaining = new Map(rows.map((row) => [row.id, row]));
    const sequence: SlideRow[] = [];
    for (const id of slideIds) {
      const row = remaining.get(id);
      if (!row) continue;
      remaining.delete(id);
      sequence.push(row);
    }
    for (const row of rows) {
      if (remaining.has(row.id)) sequence.push(row);
    }
    await this.applyOrder(sequence);
    this.events.slidesChanged(this.access.target(presentation));
  }

  async duplicate(slideId: string, userId: string): Promise<Slide> {
    const { slide, presentation } = await this.access.ownedSlide(slideId, userId);
    const siblings = await this.loadOrdered(slide.presentationId);
    const [created] = await this.db
      .insert(slides)
      .values({
        presentationId: slide.presentationId,
        order: insertOrder(siblings, slide.order),
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

    const normalized = await this.renumber(slide.presentationId, created);
    const target = this.access.target(presentation);
    this.events.slidesChanged(target);
    this.events.elementsChanged(target, created.id);
    return toSlide(normalized);
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
    const { slide, presentation } = await this.access.ownedSlide(slideId, userId);
    await this.db.delete(slides).where(eq(slides.id, slideId));
    await this.applyOrder(await this.loadOrdered(slide.presentationId));
    this.events.slidesChanged(this.access.target(presentation));
  }

  private loadOrdered(presentationId: string): Promise<SlideRow[]> {
    return this.db
      .select()
      .from(slides)
      .where(eq(slides.presentationId, presentationId))
      .orderBy(asc(slides.order), asc(slides.createdAt))
      .limit(200);
  }

  private async renumber(presentationId: string, created: SlideRow): Promise<SlideRow> {
    const rows = await this.applyOrder(await this.loadOrdered(presentationId));
    return rows.find((row) => row.id === created.id) ?? created;
  }

  private async applyOrder(sequence: SlideRow[]): Promise<SlideRow[]> {
    const normalized: SlideRow[] = [];
    for (let index = 0; index < sequence.length; index++) {
      const row = sequence[index];
      if (row.order !== index) {
        await this.db.update(slides).set({ order: index }).where(eq(slides.id, row.id));
      }
      normalized.push({ ...row, order: index });
    }
    return normalized;
  }
}

const insertOrder = (existing: SlideRow[], afterOrder?: number): number => {
  if (afterOrder === undefined) {
    if (existing.length === 0) return 0;
    return Math.max(...existing.map((slide) => slide.order)) + 1;
  }
  const next = existing.find((slide) => slide.order > afterOrder);
  return next === undefined ? afterOrder + 1 : (afterOrder + next.order) / 2;
};
