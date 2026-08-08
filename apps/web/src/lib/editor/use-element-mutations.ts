import type { ElementProps, ElementType, SlideElement } from "@Prezzy/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import {
  useCreateElement, useRemoveElement, useReorderElement,
  useUpdateElementContent, useUpdateElementGeometry, useUpdateElementImageSrc,
  useUpdateElementPosition, useUpdateElementProps,
} from "@/lib/api/elements";

export interface CreateElementArgs {
  slideId: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  props?: ElementProps;
  zIndex?: number;
}

export type ReorderAction = "front" | "forward" | "backward" | "back";

function ignoreUnhandled<T>(promise: Promise<T>): Promise<T> {
  promise.catch(() => {});
  return promise;
}

function mergeProps(base: ElementProps | null, patch: ElementProps): ElementProps {
  const merged: Record<string, unknown> = { ...(base ?? {}) };
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) merged[key] = value;
  }
  return merged as ElementProps;
}

export function useElementMutations() {
  const queryClient = useQueryClient();

  const create   = useCreateElement();
  const remove   = useRemoveElement();
  const reorder  = useReorderElement();
  const position = useUpdateElementPosition();
  const geometry = useUpdateElementGeometry();
  const content  = useUpdateElementContent();
  const props    = useUpdateElementProps();
  const imageSrc = useUpdateElementImageSrc();

  const patchElement = useCallback((id: string, apply: (el: SlideElement) => SlideElement) => {
    let previous: SlideElement | undefined;
    queryClient.setQueriesData<SlideElement[]>({ queryKey: ["elements"] }, (list) => {
      if (!list) return list;
      const index = list.findIndex((el) => el.id === id);
      if (index === -1) return list;
      previous = list[index];
      const next = [...list];
      next[index] = apply(previous);
      return next;
    });
    return previous;
  }, [queryClient]);

  const optimistic = useCallback(<TArgs extends { id: string }>(
    run: (args: TArgs) => Promise<unknown>,
    apply: (el: SlideElement, args: TArgs) => SlideElement,
  ) => (args: TArgs) => ignoreUnhandled((async () => {
    const previous = patchElement(args.id, (el) => apply(el, args));
    try {
      await run(args);
    } catch (error) {
      if (previous) patchElement(args.id, () => previous);
      throw error;
    }
  })()), [patchElement]);

  return useMemo(() => ({
    createElement: (args: CreateElementArgs) => ignoreUnhandled(create(args)),
    removeElement: (args: { id: string }) => ignoreUnhandled(remove(args)),
    reorderElement: (args: { id: string; action: ReorderAction }) => ignoreUnhandled(reorder(args)),
    updatePosition: optimistic(position, (el, args) => ({ ...el, x: args.x, y: args.y })),
    updateGeometry: optimistic(geometry, (el, args) => ({
      ...el, x: args.x, y: args.y, width: args.width, height: args.height,
    })),
    updateContent: optimistic(content, (el, args) => ({
      ...el, props: mergeProps(el.props, { content: args.content }),
    })),
    updateProps: optimistic(props, (el, args) => ({ ...el, props: mergeProps(el.props, args.props) })),
    updateImageSrc: optimistic(imageSrc, (el, args) => ({
      ...el, props: mergeProps(el.props, { src: args.src }),
    })),
  }), [create, remove, reorder, position, geometry, content, props, imageSrc, optimistic]);
}
