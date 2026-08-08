import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, asc, eq, inArray, ne, notInArray, sql } from "drizzle-orm";
import { AccessService } from "@/access/access.service";
import { mergePatch } from "@/common/merge";
import { DRIZZLE } from "@/db/db.constants";
import type { Database, DbExecutor } from "@/db/db.types";
import { type SlideElementRow, slideElements, slides } from "@/db/schema";
import { EventsService } from "@/events/events.service";
import type { ElementProps, SlideElement } from "@/shared";
import type { CreateElementDto } from "@/elements/dto/create-element.dto";
import type { ReorderAction } from "@/elements/dto/reorder-element.dto";
import type { ReplaceElementDto } from "@/elements/dto/replace-element.dto";
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
    const rows = await this.selectBySlide(this.db, slideId);
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

  async replace(
    slideId: string,
    userId: string,
    elements: ReplaceElementDto[],
  ): Promise<SlideElement[]> {
    const { presentation } = await this.access.ownedSlide(slideId, userId);
    const ids = elements.map((element) => element.id);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException("Duplicate element id in payload");
    }

    const rows = await this.db.transaction(async (tx) => {
      await this.assertNoForeignIds(tx, slideId, ids);
      await tx
        .delete(slideElements)
        .where(and(eq(slideElements.slideId, slideId), notInArray(slideElements.id, ids)));
      if (elements.length > 0) {
        await tx
          .insert(slideElements)
          .values(elements.map((element, index) => this.toRowValues(slideId, element, index)))
          .onConflictDoUpdate({
            target: slideElements.id,
            set: {
              slideId: sql`excluded."slide_id"`,
              type: sql`excluded."type"`,
              x: sql`excluded."x"`,
              y: sql`excluded."y"`,
              width: sql`excluded."width"`,
              height: sql`excluded."height"`,
              zIndex: sql`excluded."z_index"`,
              props: sql`excluded."props"`,
            },
          });
      }
      return this.selectBySlide(tx, slideId);
    });

    this.events.elementsChanged(this.access.target(presentation), slideId);
    return rows.map(toElement);
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

  private selectBySlide(executor: DbExecutor, slideId: string): Promise<SlideElementRow[]> {
    return executor
      .select()
      .from(slideElements)
      .where(eq(slideElements.slideId, slideId))
      .orderBy(asc(slideElements.createdAt))
      .limit(200);
  }

  private toRowValues(slideId: string, element: ReplaceElementDto, index: number) {
    return {
      id: element.id,
      slideId,
      type: element.type,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      zIndex: element.zIndex ?? index,
      props: element.props ? mergePatch<ElementProps>(null, element.props) : null,
    };
  }

  private async assertNoForeignIds(
    executor: DbExecutor,
    slideId: string,
    ids: string[],
  ): Promise<void> {
    if (ids.length === 0) return;
    const foreign = await executor
      .select({ id: slideElements.id })
      .from(slideElements)
      .where(and(inArray(slideElements.id, ids), ne(slideElements.slideId, slideId)))
      .limit(1);
    if (foreign.length > 0) {
      throw new ConflictException("Element belongs to another slide");
    }
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
