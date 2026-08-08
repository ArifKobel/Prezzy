import type { Slide, SlideElement } from "@Prezzy/shared";
import type { QueryClient } from "@tanstack/react-query";

export type ElementScope = { slideId: string | null; presentationId: string | null };

export function scopeBySlide(queryClient: QueryClient, slideId: string): ElementScope {
  return { slideId, presentationId: presentationOfSlide(queryClient, slideId) };
}

export function scopeByElement(queryClient: QueryClient, elementId: string): ElementScope {
  const decks = queryClient.getQueriesData<SlideElement[]>({ queryKey: ["presentationElements"] });
  for (const [key, data] of decks) {
    const found = data?.find((element) => element.id === elementId);
    if (found) {
      return { slideId: found.slideId, presentationId: typeof key[1] === "string" ? key[1] : null };
    }
  }
  const lists = queryClient.getQueriesData<SlideElement[]>({ queryKey: ["elements"] });
  for (const [, data] of lists) {
    const found = data?.find((element) => element.id === elementId);
    if (found) return scopeBySlide(queryClient, found.slideId);
  }
  return { slideId: null, presentationId: null };
}

export function invalidateElementScope(queryClient: QueryClient, scope: ElementScope): void {
  queryClient.invalidateQueries({
    queryKey: scope.slideId ? ["elements", scope.slideId] : ["elements"],
  });
  queryClient.invalidateQueries({
    queryKey: scope.presentationId
      ? ["presentationElements", scope.presentationId]
      : ["presentationElements"],
  });
  queryClient.invalidateQueries({
    queryKey: scope.presentationId
      ? ["firstSlideElements", scope.presentationId]
      : ["firstSlideElements"],
  });
}

function presentationOfSlide(queryClient: QueryClient, slideId: string): string | null {
  const decks = queryClient.getQueriesData<Slide[]>({ queryKey: ["slides"] });
  for (const [, data] of decks) {
    const slide = data?.find((item) => item.id === slideId);
    if (slide) return slide.presentationId;
  }
  return null;
}
