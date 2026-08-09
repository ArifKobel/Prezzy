import type { Slide } from "@Prezzy/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

type LayoutElement = {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props?: Record<string, unknown>;
};

export function useSlides(presentationId: string | null) {
  return useQuery({
    queryKey: ["slides", presentationId],
    queryFn: () => apiFetch<Slide[]>(`/presentations/${presentationId}/slides`),
    enabled: !!presentationId,
  });
}

function useSlideMutation<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slides"] });
      queryClient.invalidateQueries({ queryKey: ["presentationElements"] });
    },
  });
  return mutation.mutateAsync;
}

export function useCreateSlide() {
  return useSlideMutation((args: { presentationId: string; afterOrder?: number }) =>
    apiFetch<Slide>(`/presentations/${args.presentationId}/slides`, {
      method: "POST",
      body: { afterOrder: args.afterOrder },
    }),
  );
}

export function useCreateSlideFromLayout() {
  return useSlideMutation(
    (args: { presentationId: string; afterOrder?: number; order?: number; elements: LayoutElement[] }) =>
      apiFetch<Slide>(`/presentations/${args.presentationId}/slides/from-layout`, {
        method: "POST",
        body: { afterOrder: args.afterOrder, order: args.order, elements: args.elements },
      }),
  );
}

export function useUpdateSlide() {
  return useSlideMutation((args: { slideId: string; title?: string; bg?: string | null }) =>
    apiFetch<Slide>(`/slides/${args.slideId}`, {
      method: "PATCH",
      body: { title: args.title, bg: args.bg },
    }),
  );
}

export function useDuplicateSlide() {
  return useSlideMutation((args: { slideId: string }) =>
    apiFetch<Slide>(`/slides/${args.slideId}/duplicate`, { method: "POST" }),
  );
}

export function useRemoveSlide() {
  return useSlideMutation((args: { slideId: string }) =>
    apiFetch<void>(`/slides/${args.slideId}`, { method: "DELETE" }),
  );
}

export function useReorderSlides() {
  return useSlideMutation((args: { presentationId: string; slideIds: string[] }) =>
    apiFetch<void>(`/presentations/${args.presentationId}/slides/reorder`, {
      method: "POST",
      body: { slideIds: args.slideIds },
    }),
  );
}
