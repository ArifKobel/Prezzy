import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, count, desc, eq } from "drizzle-orm";
import { AccessService } from "../access/access.service";
import { DRIZZLE } from "../db/db.constants";
import type { Database } from "../db/db.types";
import { audienceResponses } from "../db/schema";
import { EventsService } from "../events/events.service";
import type { AudienceResponse } from "../shared";
import type { SubmitResponseDto } from "./dto/submit-response.dto";
import { toResponse } from "./response.serializer";

const DEFAULT_TIMER_SECONDS = 20;
const DEFAULT_MAX_RESPONSES = 1;

@Injectable()
export class ResponsesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly access: AccessService,
    private readonly events: EventsService,
  ) {}

  async listByElement(elementId: string): Promise<AudienceResponse[]> {
    const rows = await this.db
      .select()
      .from(audienceResponses)
      .where(eq(audienceResponses.elementId, elementId))
      .orderBy(desc(audienceResponses.createdAt))
      .limit(500);
    return rows.map(toResponse);
  }

  async submit(dto: SubmitResponseDto): Promise<AudienceResponse> {
    const { element, presentation } = await this.access.element(dto.elementId);
    const target = this.access.target(presentation);

    let correct: boolean | null = null;
    let score: number | null = null;

    if (element.type === "quiz") {
      if (presentation.quizElementId !== dto.elementId || presentation.quizPhase !== "answering") {
        throw new ConflictException("Quiz is not accepting answers right now");
      }

      const options = element.props?.options ?? [];
      const correctOption = element.props?.correctOption;
      if (correctOption != null) correct = dto.value === options[correctOption];

      const timerSeconds = element.props?.timerSeconds ?? DEFAULT_TIMER_SECONDS;
      const timeScoring = element.props?.timeScoring ?? true;
      const startedAt = presentation.quizStartedAt ?? 0;

      if (correct) {
        if (!timeScoring || startedAt <= 0) {
          score = 1000;
        } else {
          const elapsed = (Date.now() - startedAt) / 1000;
          const fraction = Math.max(0, 1 - elapsed / timerSeconds);
          score = Math.max(100, Math.round(1000 * fraction));
        }
      } else {
        score = 0;
      }

      const [previous] = await this.db
        .select()
        .from(audienceResponses)
        .where(
          and(
            eq(audienceResponses.elementId, dto.elementId),
            eq(audienceResponses.participantId, dto.participantId),
          ),
        )
        .limit(1);

      if (previous) {
        const [updated] = await this.db
          .update(audienceResponses)
          .set({
            value: dto.value,
            correct,
            score,
            participantName: dto.participantName ?? previous.participantName,
          })
          .where(eq(audienceResponses.id, previous.id))
          .returning();
        if (!updated) throw new NotFoundException("Response not found");
        this.events.responsesChanged(target, dto.elementId);
        return toResponse(updated);
      }
    }

    if (element.type === "wordcloud") {
      const maxResponses = element.props?.maxResponses ?? DEFAULT_MAX_RESPONSES;
      const [existing] = await this.db
        .select({ value: count() })
        .from(audienceResponses)
        .where(
          and(
            eq(audienceResponses.elementId, dto.elementId),
            eq(audienceResponses.participantId, dto.participantId),
          ),
        );
      if ((existing?.value ?? 0) >= maxResponses) {
        throw new ConflictException("Maximum number of responses reached");
      }
    }

    const [created] = await this.db
      .insert(audienceResponses)
      .values({
        elementId: dto.elementId,
        participantId: dto.participantId,
        participantName: dto.participantName ?? null,
        value: dto.value,
        correct,
        score,
        createdAt: Date.now(),
      })
      .returning();
    if (!created) throw new NotFoundException("Element not found");

    this.events.responsesChanged(target, dto.elementId);
    return toResponse(created);
  }
}
