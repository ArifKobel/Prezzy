import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { AccessService } from "@/access/access.service";
import { DRIZZLE } from "@/db/db.constants";
import type { Database } from "@/db/db.types";
import { type PresentationRow, presentations } from "@/db/schema";
import { EventsService } from "@/events/events.service";
import { PresenceService } from "@/presence/presence.service";
import { toPresentation } from "@/presentations/presentation.serializer";
import type { Presentation } from "@/shared";
import type { HeartbeatDto } from "@/interact/dto/heartbeat.dto";

@Injectable()
export class InteractService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly access: AccessService,
    private readonly events: EventsService,
    private readonly presence: PresenceService,
  ) {}

  async getByJoinCode(code: string): Promise<Presentation> {
    return toPresentation(await this.findByJoinCode(code));
  }

  async heartbeat(code: string, dto: HeartbeatDto): Promise<{ count: number }> {
    const presentation = await this.findByJoinCode(code);
    await this.presence.touch(presentation.id, dto.participantId, dto.participantName ?? null);
    const count = await this.presence.count(presentation.id);
    this.events.presenceChanged(this.access.target(presentation), count);
    return { count };
  }

  private async findByJoinCode(code: string): Promise<PresentationRow> {
    const [row] = await this.db
      .select()
      .from(presentations)
      .where(eq(presentations.joinCode, code.toUpperCase()))
      .limit(1);
    if (!row) throw new NotFoundException("Session not found");
    return row;
  }
}
