import type { SlideRow } from "@/db/schema";
import type { Slide } from "@/shared";

export const toSlide = (row: SlideRow): Slide => ({
  id: row.id,
  presentationId: row.presentationId,
  order: row.order,
  title: row.title,
  createdAt: row.createdAt.getTime(),
});
