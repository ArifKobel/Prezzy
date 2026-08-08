import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { AccessService } from "@/access/access.service";
import { mergePatch } from "@/common/merge";
import { DRIZZLE } from "@/db/db.constants";
import type { Database } from "@/db/db.types";
import { type SlideElementRow, slideElements, slides } from "@/db/schema";
import { EventsService } from "@/events/events.service";
import type { ElementProps, SlideElement } from "@/shared";
import type { CreateElementDto } from "@/elements/dto/create-element.dto";
import type { ReorderAction } from "@/elements/dto/reorder-element.dto";
import type { UpdateElementDto } from "@/elements/dto/update-element.dto";
import { toElement } from "@/elements/element.serializer";

@Injectable()
export class ElementsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly access: AccessService,
    private readonly events: EventsService,
  ) {}

  async listBySlide(slideId: string): Promise<SlideElement[]> {
    const rows = await this.db
      .select()
      .from(slideElements)
      .where(eq(slideElements.slideId, slideId))
      .orderBy(asc(slideElements.createdAt))
      .limit(200);
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

  async listFirstSlide(presentationId: string, userId: string): Promise<SlideElement[]> {
    await this.access.ownedPresentation(presentationId, userId);
    const [first] = await this.db
      .select()
      .from(slides)
      .where(eq(slides.presentationId, presentationId))
      .orderBy(asc(slides.order), asc(slides.createdAt))
      .limit(1);
    if (!first) return [];
    return this.listBySlide(first.id);
  }

  async create(slideId: string, userId: string, dto: CreateElementDto): Promise<SlideElement> {
    const { presentation } = await this.access.ownedSlide(slideId, userId);
    const zIndex = dto.zIndex ?? (await this.nextZIndex(slideId));
    const [created] = await this.db
      .insert(slideElements)
      .values({
        slideId,
        type: dto.type,
        x: dto.x,
        y: dto.y,
        width: dto.width,
        height: dto.height,
        props: dto.props ? mergePatch<ElementProps>(null, dto.props) : null,
        zIndex,
      })
      .returning();
    if (!created) throw new NotFoundException("Slide not found");
    this.events.elementsChanged(this.access.target(presentation), slideId);
    return toElement(created);
  }

  async update(id: string, userId: string, dto: UpdateElementDto): Promise<SlideElement> {
    const { element, presentation } = await this.access.ownedElement(id, userId);
    const [updated] = await this.db
      .update(slideElements)
      .set({
        ...(dto.x === undefined ? {} : { x: dto.x }),
        ...(dto.y === undefined ? {} : { y: dto.y }),
        ...(dto.width === undefined ? {} : { width: dto.width }),
        ...(dto.height === undefined ? {} : { height: dto.height }),
        ...(dto.props === undefined
          ? {}
          : { props: mergePatch<ElementProps>(element.props, dto.props) }),
      })
      .where(eq(slideElements.id, id))
      .returning();
    if (!updated) throw new NotFoundException("Element not found");
    this.events.elementsChanged(this.access.target(presentation), element.slideId);
    return toElement(updated);
  }

  async reorder(id: string, userId: string, action: ReorderAction): Promise<void> {
    const { element, presentation } = await this.access.ownedElement(id, userId);
    const sorted = await this.normalize(element.slideId);
    const index = sorted.findIndex((row) => row.id === id);
    if (index === -1) return;

    if (action === "front" && index < sorted.length - 1) {
      await this.setZIndex(id, sorted.length);
    } else if (action === "back" && index > 0) {
      await this.setZIndex(id, -1);
    } else if (action === "forward" && index < sorted.length - 1) {
      await this.setZIndex(id, index + 1);
      await this.setZIndex(sorted[index + 1].id, index);
    } else if (action === "backward" && index > 0) {
      await this.setZIndex(id, index - 1);
      await this.setZIndex(sorted[index - 1].id, index);
    }

    this.events.elementsChanged(this.access.target(presentation), element.slideId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const { element, presentation } = await this.access.ownedElement(id, userId);
    await this.db.delete(slideElements).where(eq(slideElements.id, id));
    this.events.elementsChanged(this.access.target(presentation), element.slideId);
  }

  private async nextZIndex(slideId: string): Promise<number> {
    const siblings = await this.db
      .select()
      .from(slideElements)
      .where(eq(slideElements.slideId, slideId))
      .limit(200);
    return siblings.reduce((max, row) => Math.max(max, row.zIndex ?? 0), 0) + 1;
  }

  private async normalize(slideId: string): Promise<SlideElementRow[]> {
    const siblings = await this.db
      .select()
      .from(slideElements)
      .where(eq(slideElements.slideId, slideId))
      .limit(200);
    const sorted = [...siblings].sort(
      (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0) || a.createdAt.getTime() - b.createdAt.getTime(),
    );
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].zIndex !== i) await this.setZIndex(sorted[i].id, i);
      sorted[i] = { ...sorted[i], zIndex: i };
    }
    return sorted;
  }

  private async setZIndex(id: string, zIndex: number): Promise<void> {
    await this.db.update(slideElements).set({ zIndex }).where(eq(slideElements.id, id));
  }
}
