import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DRIZZLE } from "@/db/db.constants";
import type { Database } from "@/db/db.types";
import { type PresentationRow, presentations, slideElements, slides } from "@/db/schema";
import type { RealtimeTarget } from "@/events/realtime-target";
import type { ElementContext, SlideContext } from "@/access/access.types";

@Injectable()
export class AccessService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async presentation(presentationId: string): Promise<PresentationRow> {
    const [row] = await this.db
      .select()
      .from(presentations)
      .where(eq(presentations.id, presentationId))
      .limit(1);
    if (!row) throw new NotFoundException("Presentation not found");
    return row;
  }

  async ownedPresentation(presentationId: string, userId: string): Promise<PresentationRow> {
    const row = await this.presentation(presentationId);
    if (row.userId !== userId) throw new ForbiddenException("Not your presentation");
    return row;
  }

  async slide(slideId: string): Promise<SlideContext> {
    const [row] = await this.db
      .select({ slide: slides, presentation: presentations })
      .from(slides)
      .innerJoin(presentations, eq(presentations.id, slides.presentationId))
      .where(eq(slides.id, slideId))
      .limit(1);
    if (!row) throw new NotFoundException("Slide not found");
    return row;
  }

  async ownedSlide(slideId: string, userId: string): Promise<SlideContext> {
    const context = await this.slide(slideId);
    if (context.presentation.userId !== userId) throw new ForbiddenException("Not your presentation");
    return context;
  }

  async element(elementId: string): Promise<ElementContext> {
    const [row] = await this.db
      .select({ element: slideElements, slide: slides, presentation: presentations })
      .from(slideElements)
      .innerJoin(slides, eq(slides.id, slideElements.slideId))
      .innerJoin(presentations, eq(presentations.id, slides.presentationId))
      .where(eq(slideElements.id, elementId))
      .limit(1);
    if (!row) throw new NotFoundException("Element not found");
    return row;
  }

  async ownedElement(elementId: string, userId: string): Promise<ElementContext> {
    const context = await this.element(elementId);
    if (context.presentation.userId !== userId) throw new ForbiddenException("Not your presentation");
    return context;
  }

  target(presentation: PresentationRow): RealtimeTarget {
    return { presentationId: presentation.id, joinCode: presentation.joinCode };
  }
}
