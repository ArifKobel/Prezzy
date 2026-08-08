import type { SlideElementRow } from "@/db/schema";
import type { SlideElement } from "@/shared";

export const toElement = (row: SlideElementRow): SlideElement => ({
  id: row.id,
  slideId: row.slideId,
  type: row.type,
  x: row.x,
  y: row.y,
  width: row.width,
  height: row.height,
  zIndex: row.zIndex,
  props: row.props,
  createdAt: row.createdAt.getTime(),
});
