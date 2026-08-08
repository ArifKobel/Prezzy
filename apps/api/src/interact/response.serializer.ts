import type { AudienceResponseRow } from "@/db/schema";
import type { AudienceResponse } from "@/shared";

export const toResponse = (row: AudienceResponseRow): AudienceResponse => ({
  id: row.id,
  elementId: row.elementId,
  participantId: row.participantId,
  participantName: row.participantName,
  value: row.value,
  correct: row.correct,
  score: row.score,
  createdAt: row.createdAt,
});
