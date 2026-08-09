import type { Slide } from "@Prezzy/shared";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export function useSlides(presentationId: string | null) {
  return useQuery({
    queryKey: ["slides", presentationId],
    queryFn: () => apiFetch<Slide[]>(`/presentations/${presentationId}/slides`),
    enabled: !!presentationId,
  });
}
