import type { ElementProps, ElementType, SlideElement } from "@Prezzy/shared";
import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import {
  type ElementScope,
  invalidateElementScope,
  scopeByElement,
  scopeBySlide,
} from "@/lib/api/element-scope";

export const clearProps = (...keys: (keyof ElementProps)[]): ElementProps =>
  Object.fromEntries(keys.map((key) => [key, null])) as ElementProps;

export const fetchSlideElements = (slideId: string) =>
  apiFetch<SlideElement[]>(`/slides/${slideId}/elements`);

export function putSlideElements(slideId: string, elements: SlideElement[]): Promise<SlideElement[]> {
  return apiFetch<SlideElement[]>(`/slides/${slideId}/elements`, {
    method: "PUT",
    body: {
      elements: elements.map((el) => ({
        id: el.id,
        type: el.type,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        zIndex: el.zIndex ?? undefined,
        props: el.props ?? undefined,
      })),
    },
  });
}

export function useSlideElements(slideId: string | null) {
  return useQuery({
    queryKey: ["elements", slideId],
    queryFn: () => fetchSlideElements(slideId!),
    enabled: !!slideId,
  });
}

function useElementMutation<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
  scope: (queryClient: QueryClient, args: TArgs, result: TResult) => ElementScope,
) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: fn,
    onSuccess: (result, args) =>
      invalidateElementScope(queryClient, scope(queryClient, args, result)),
  });
  return mutation.mutateAsync;
}

const byElement = (queryClient: QueryClient, args: { id: string }): ElementScope =>
  scopeByElement(queryClient, args.id);

const byResult = (
  queryClient: QueryClient,
  _args: unknown,
  result: SlideElement,
): ElementScope => scopeBySlide(queryClient, result.slideId);

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
    (queryClient, args) => scopeBySlide(queryClient, args.slideId),
  );
}

export function useUpdateElementPosition() {
  return useElementMutation(
    (args: { id: string; x: number; y: number }) =>
      apiFetch<SlideElement>(`/elements/${args.id}`, {
        method: "PATCH",
        body: { x: args.x, y: args.y },
      }),
    byResult,
  );
}

export function useUpdateElementGeometry() {
  return useElementMutation(
    (args: { id: string; x: number; y: number; width: number; height: number }) =>
      apiFetch<SlideElement>(`/elements/${args.id}`, {
        method: "PATCH",
        body: { x: args.x, y: args.y, width: args.width, height: args.height },
      }),
    byResult,
  );
}

export function useUpdateElementContent() {
  return useElementMutation(
    (args: { id: string; content: string }) =>
      apiFetch<SlideElement>(`/elements/${args.id}`, {
        method: "PATCH",
        body: { props: { content: args.content } },
      }),
    byResult,
  );
}

export function useUpdateElementProps() {
  return useElementMutation(
    (args: { id: string; props: ElementProps }) =>
      apiFetch<SlideElement>(`/elements/${args.id}`, {
        method: "PATCH",
        body: { props: args.props },
      }),
    byResult,
  );
}

export function useUpdateElementImageSrc() {
  return useElementMutation(
    (args: { id: string; src: string }) =>
      apiFetch<SlideElement>(`/elements/${args.id}`, {
        method: "PATCH",
        body: { props: { src: args.src } },
      }),
    byResult,
  );
}

export function useRemoveElement() {
  return useElementMutation(
    (args: { id: string }) => apiFetch<void>(`/elements/${args.id}`, { method: "DELETE" }),
    byElement,
  );
}

export function useReorderElement() {
  return useElementMutation(
    (args: { id: string; action: "front" | "forward" | "backward" | "back" }) =>
      apiFetch<void>(`/elements/${args.id}/reorder`, {
        method: "POST",
        body: { action: args.action },
      }),
    byElement,
  );
}
