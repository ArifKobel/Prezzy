import type { ElementProps, ElementType, SlideElement } from "@Prezzy/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export function useSlideElements(slideId: string | null) {
  return useQuery({
    queryKey: ["elements", slideId],
    queryFn: () => apiFetch<SlideElement[]>(`/slides/${slideId}/elements`),
    enabled: !!slideId,
  });
}

function useElementMutation<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: fn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["elements"] });
      queryClient.invalidateQueries({ queryKey: ["presentationElements"] });
      queryClient.invalidateQueries({ queryKey: ["firstSlideElements"] });
    },
  });
  return mutation.mutateAsync;
}

export function useCreateElement() {
  return useElementMutation(
    (args: {
      slideId: string;
      type: ElementType;
      x: number;
      y: number;
      width: number;
      height: number;
      props?: ElementProps;
      zIndex?: number;
    }) =>
      apiFetch<SlideElement>(`/slides/${args.slideId}/elements`, {
        method: "POST",
        body: {
          type: args.type,
          x: args.x,
          y: args.y,
          width: args.width,
          height: args.height,
          props: args.props,
          zIndex: args.zIndex,
        },
      }),
  );
}

export function useUpdateElementPosition() {
  return useElementMutation((args: { id: string; x: number; y: number }) =>
    apiFetch<SlideElement>(`/elements/${args.id}`, { method: "PATCH", body: { x: args.x, y: args.y } }),
  );
}

export function useUpdateElementGeometry() {
  return useElementMutation(
    (args: { id: string; x: number; y: number; width: number; height: number }) =>
      apiFetch<SlideElement>(`/elements/${args.id}`, {
        method: "PATCH",
        body: { x: args.x, y: args.y, width: args.width, height: args.height },
      }),
  );
}

export function useUpdateElementContent() {
  return useElementMutation((args: { id: string; content: string }) =>
    apiFetch<SlideElement>(`/elements/${args.id}`, {
      method: "PATCH",
      body: { props: { content: args.content } },
    }),
  );
}

export function useUpdateElementProps() {
  return useElementMutation((args: { id: string; props: ElementProps }) =>
    apiFetch<SlideElement>(`/elements/${args.id}`, { method: "PATCH", body: { props: args.props } }),
  );
}

export function useUpdateElementImageSrc() {
  return useElementMutation((args: { id: string; src: string }) =>
    apiFetch<SlideElement>(`/elements/${args.id}`, { method: "PATCH", body: { props: { src: args.src } } }),
  );
}

export function useRemoveElement() {
  return useElementMutation((args: { id: string }) =>
    apiFetch<void>(`/elements/${args.id}`, { method: "DELETE" }),
  );
}

export function useReorderElement() {
  return useElementMutation(
    (args: { id: string; action: "front" | "forward" | "backward" | "back" }) =>
      apiFetch<void>(`/elements/${args.id}/reorder`, { method: "POST", body: { action: args.action } }),
  );
}
