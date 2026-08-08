import { Inject, Injectable } from "@nestjs/common";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { DRIZZLE } from "../db/db.constants";
import type { Database } from "../db/db.types";
import { participants } from "../db/schema";
import { PRESENCE_TIMEOUT_MS } from "./presence.constants";

@Injectable()
export class PresenceService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async touch(
    presentationId: string,
    participantId: string,
    participantName: string | null,
  ): Promise<void> {
    const lastSeenAt = Date.now();
    await this.db
      .insert(participants)
      .values({ presentationId, participantId, participantName, lastSeenAt })
      .onConflictDoUpdate({
        target: [participants.presentationId, participants.participantId],
        set: {
          lastSeenAt,
          participantName: sql`coalesce(excluded.participant_name, ${participants.participantName})`,
        },
      });
  }

  async count(presentationId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(participants)
      .where(
        and(
          eq(participants.presentationId, presentationId),
          gte(participants.lastSeenAt, Date.now() - PRESENCE_TIMEOUT_MS),
        ),
      );
    return row?.value ?? 0;
  }
}
