import type { PresentationRow } from "@/db/schema";
import type { Presentation } from "@/shared";

export const toPresentation = (row: PresentationRow): Presentation => ({
  id: row.id,
  title: row.title,
  joinCode: row.joinCode,
  liveSlideId: row.liveSlideId,
  quizState: row.quizElementId
    ? {
        elementId: row.quizElementId,
        phase: row.quizPhase ?? "question",
        startedAt: row.quizStartedAt ?? 0,
      }
    : null,
  theme: row.theme,
  createdAt: row.createdAt.getTime(),
  updatedAt: row.updatedAt.getTime(),
});
