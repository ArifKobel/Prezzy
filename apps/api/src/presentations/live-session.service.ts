import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, eq, inArray } from "drizzle-orm";
import { AccessService } from "../access/access.service";
import { DRIZZLE } from "../db/db.constants";
import type { Database } from "../db/db.types";
import {
  type PresentationRow,
  audienceResponses,
  presentations,
  slideElements,
  slides,
} from "../db/schema";
import { EventsService } from "../events/events.service";
import { PresenceService } from "../presence/presence.service";
import type { LeaderboardEntry, Presentation } from "../shared";
import type { SetQuizDto } from "./dto/set-quiz.dto";
import { toPresentation } from "./presentation.serializer";

@Injectable()
export class LiveSessionService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly access: AccessService,
    private readonly events: EventsService,
    private readonly presence: PresenceService,
  ) {}

  async setLiveSlide(id: string, userId: string, slideId: string | null): Promise<Presentation> {
    await this.access.ownedPresentation(id, userId);
    return this.applyUpdate(id, {
      liveSlideId: slideId,
      quizElementId: null,
      quizPhase: null,
      quizStartedAt: null,
    });
  }

  async setQuiz(id: string, userId: string, dto: SetQuizDto): Promise<Presentation> {
    await this.access.ownedPresentation(id, userId);
    return this.applyUpdate(id, {
      quizElementId: dto.elementId,
      quizPhase: dto.phase,
      quizStartedAt: dto.phase === "answering" ? Date.now() : 0,
    });
  }

  async clearQuiz(id: string, userId: string): Promise<Presentation> {
    await this.access.ownedPresentation(id, userId);
    return this.applyUpdate(id, { quizElementId: null, quizPhase: null, quizStartedAt: null });
  }

  async leaderboard(id: string, userId: string): Promise<LeaderboardEntry[]> {
    await this.access.ownedPresentation(id, userId);
    const rows = await this.db
      .select({ response: audienceResponses })
      .from(audienceResponses)
      .innerJoin(slideElements, eq(slideElements.id, audienceResponses.elementId))
      .innerJoin(slides, eq(slides.id, slideElements.slideId))
      .where(and(eq(slides.presentationId, id), eq(slideElements.type, "quiz")))
      .orderBy(asc(audienceResponses.elementId), asc(audienceResponses.createdAt));

    const entries = new Map<string, LeaderboardEntry>();
    for (const { response } of rows) {
      const entry = entries.get(response.participantId) ?? {
        name: response.participantName ?? "Anonymous",
        score: 0,
        correct: 0,
        total: 0,
      };
      entry.total++;
      if (response.correct) entry.correct++;
      entry.score += response.score ?? 0;
      if (response.participantName) entry.name = response.participantName;
      entries.set(response.participantId, entry);
    }

    return [...entries.values()]
      .sort((a, b) => b.score - a.score || b.correct - a.correct)
      .slice(0, 50);
  }

  async participantCount(id: string, userId: string): Promise<{ count: number }> {
    await this.access.ownedPresentation(id, userId);
    return { count: await this.presence.count(id) };
  }

  async clearResponses(id: string, userId: string): Promise<{ deleted: number }> {
    const presentation = await this.access.ownedPresentation(id, userId);
    const elements = await this.db
      .select({ id: slideElements.id })
      .from(slideElements)
      .innerJoin(slides, eq(slides.id, slideElements.slideId))
      .where(
        and(eq(slides.presentationId, id), inArray(slideElements.type, ["quiz", "wordcloud"])),
      );
    if (elements.length === 0) return { deleted: 0 };

    const elementIds = elements.map((element) => element.id);
    const removed = await this.db
      .delete(audienceResponses)
      .where(inArray(audienceResponses.elementId, elementIds))
      .returning({ id: audienceResponses.id });

    const target = this.access.target(presentation);
    for (const elementId of elementIds) {
      this.events.responsesChanged(target, elementId);
    }
    return { deleted: removed.length };
  }

  private async applyUpdate(
    id: string,
    values: Partial<PresentationRow>,
  ): Promise<Presentation> {
    const [updated] = await this.db
      .update(presentations)
      .set(values)
      .where(eq(presentations.id, id))
      .returning();
    if (!updated) throw new NotFoundException("Presentation not found");
    this.events.presentationUpdated(this.access.target(updated));
    return toPresentation(updated);
  }
}
