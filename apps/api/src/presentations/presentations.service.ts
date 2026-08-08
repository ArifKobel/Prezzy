import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { AccessService } from "@/access/access.service";
import { mergeDefined } from "@/common/merge";
import { DRIZZLE } from "@/db/db.constants";
import type { Database } from "@/db/db.types";
import { presentations, slides } from "@/db/schema";
import { EventsService } from "@/events/events.service";
import type { Presentation, PresentationTheme } from "@/shared";
import type { CreatePresentationDto } from "@/presentations/dto/create-presentation.dto";
import type { UpdatePresentationDto } from "@/presentations/dto/update-presentation.dto";
import { generateJoinCode } from "@/presentations/join-code";
import { toPresentation } from "@/presentations/presentation.serializer";

@Injectable()
export class PresentationsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly access: AccessService,
    private readonly events: EventsService,
  ) {}

  async list(userId: string): Promise<Presentation[]> {
    const rows = await this.db
      .select()
      .from(presentations)
      .where(eq(presentations.userId, userId))
      .orderBy(desc(presentations.updatedAt))
      .limit(200);
    return rows.map(toPresentation);
  }

  async get(id: string, userId: string): Promise<Presentation> {
    return toPresentation(await this.access.ownedPresentation(id, userId));
  }

  async create(userId: string, dto: CreatePresentationDto): Promise<Presentation> {
    const joinCode = await this.uniqueJoinCode();
    const [created] = await this.db
      .insert(presentations)
      .values({ userId, title: dto.title, joinCode })
      .returning();
    if (!created) throw new NotFoundException("Could not create presentation");
    await this.db.insert(slides).values({ presentationId: created.id, order: 0, title: "Slide 1" });
    const target = this.access.target(created);
    this.events.presentationUpdated(target);
    this.events.slidesChanged(target);
    return toPresentation(created);
  }

  async update(id: string, userId: string, dto: UpdatePresentationDto): Promise<Presentation> {
    const existing = await this.access.ownedPresentation(id, userId);
    const [updated] = await this.db
      .update(presentations)
      .set({
        ...(dto.title === undefined ? {} : { title: dto.title }),
        ...(dto.theme === undefined
          ? {}
          : { theme: mergeDefined<PresentationTheme>(existing.theme, dto.theme) }),
        updatedAt: new Date(),
      })
      .where(eq(presentations.id, id))
      .returning();
    if (!updated) throw new NotFoundException("Presentation not found");
    this.events.presentationUpdated(this.access.target(updated));
    return toPresentation(updated);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.access.ownedPresentation(id, userId);
    await this.db.delete(presentations).where(eq(presentations.id, id));
    this.events.presentationUpdated(this.access.target(existing));
  }

  private async uniqueJoinCode(): Promise<string> {
    let code = generateJoinCode();
    let attempts = 0;
    while (attempts < 10) {
      const [conflict] = await this.db
        .select({ id: presentations.id })
        .from(presentations)
        .where(eq(presentations.joinCode, code))
        .limit(1);
      if (!conflict) break;
      code = generateJoinCode();
      attempts++;
    }
    return code;
  }
}
