import type { PresentationRow, SlideElementRow, SlideRow } from "@/db/schema";

export interface SlideContext {
  slide: SlideRow;
  presentation: PresentationRow;
}

export interface ElementContext {
  element: SlideElementRow;
  slide: SlideRow;
  presentation: PresentationRow;
}
