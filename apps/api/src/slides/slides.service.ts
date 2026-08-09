import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { AccessService } from "@/access/access.service";
import { DRIZZLE } from "@/db/db.constants";
import type { Database } from "@/db/db.types";
import { type SlideRow, slides } from "@/db/schema";
import type { Slide } from "@/shared";
import { toSlide } from "@/slides/slide.serializer";

@Injectable()
export class SlidesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly access: AccessService,
  ) {}

  async listByPresentation(presentationId: string, userId: string): Promise<Slide[]> {
    await this.access.ownedPresentation(presentationId, userId);
    const rows = await this.loadOrdered(presentationId);
    return rows.map(toSlide);
  }

  private loadOrdered(presentationId: string): Promise<SlideRow[]> {
    return this.db
      .select()
      .from(slides)
      .where(eq(slides.presentationId, presentationId))
      .orderBy(asc(slides.order), asc(slides.createdAt))
      .limit(200);
  }
}
