import type { ElementProps, SlideElement } from "@Prezzy/shared";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export const clearProps = (...keys: (keyof ElementProps)[]): ElementProps =>
  Object.fromEntries(keys.map((key) => [key, null])) as ElementProps;

export function useSlideElements(slideId: string | null) {
  return useQuery({
    queryKey: ["elements", slideId],
    queryFn: () => apiFetch<SlideElement[]>(`/slides/${slideId}/elements`),
    enabled: !!slideId,
  });
}
