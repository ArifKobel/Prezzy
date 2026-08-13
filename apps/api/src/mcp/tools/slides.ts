import * as z from "zod/v4";
import type { SlideActionsService } from "@/deck-actions/slide-actions.service";
import { layoutItem, slideElementInput, slideLayout, uuid } from "@/mcp/schemas";
import { defineTool, type McpTool } from "@/mcp/tool";

const slideAddInput = z
  .object({
    presentationId: uuid,
    afterSlideId: uuid.optional(),
    layout: slideLayout.optional(),
    title: z.string().optional(),
    kicker: z.string().optional(),
    subtitle: z.string().optional(),
    items: z.array(layoutItem).max(6).optional(),
    quote: z.string().optional(),
    attribution: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.layout && !value.title) {
      context.addIssue({ code: "custom", message: "title is required when layout is set", path: ["title"] });
    }
  });

export const slideTools = (slides: SlideActionsService): McpTool[] => [
  defineTool({
    name: "slide_add",
    description:
      "Add an empty slide or create a complete slide from one of six semantic layouts in one atomic call. Prefer layouts over manual coordinates.",
    scope: "presentations:write",
    input: slideAddInput,
    run: ({ presentationId, afterSlideId, layout, title, ...content }, { userId }) =>
      layout && title
        ? slides.addLayout(userId, presentationId, { afterSlideId, layout, title, ...content })
        : slides.add(userId, presentationId, afterSlideId),
  }),
  defineTool({
    name: "slide_set_content",
    description:
      "Atomically replace every element on one slide. Element order defines slide-local zIndex 0..n-1. Coordinates are percentages of a 16:9 slide (0-100), not pixels.",
    scope: "presentations:write",
    input: z.object({ presentationId: uuid, slideId: uuid, elements: z.array(slideElementInput).max(100) }),
    run: ({ presentationId, slideId, elements }, { userId }) =>
      slides.setContent(userId, presentationId, slideId, elements),
  }),
  defineTool({
    name: "slide_duplicate",
    description: "Duplicate a slide and its elements",
    scope: "presentations:write",
    input: z.object({ presentationId: uuid, slideId: uuid }),
    run: ({ presentationId, slideId }, { userId }) => slides.duplicate(userId, presentationId, slideId),
  }),
  defineTool({
    name: "slide_update",
    description: "Update a slide title or background",
    scope: "presentations:write",
    input: z.object({
      presentationId: uuid,
      slideId: uuid,
      title: z.string().max(500).optional(),
      bg: z.string().nullable().optional(),
    }),
    run: ({ presentationId, slideId, title, bg }, { userId }) =>
      slides.update(userId, presentationId, slideId, { title, bg }),
  }),
  defineTool({
    name: "slide_delete",
    description: "Delete a slide and its elements",
    scope: "presentations:write",
    annotations: { destructiveHint: true },
    input: z.object({ presentationId: uuid, slideId: uuid }),
    run: ({ presentationId, slideId }, { userId }) => slides.remove(userId, presentationId, slideId),
  }),
  defineTool({
    name: "slides_reorder",
    description: "Set the complete slide order",
    scope: "presentations:write",
    input: z.object({ presentationId: uuid, slideIds: z.array(uuid).min(1) }),
    run: ({ presentationId, slideIds }, { userId }) => slides.reorder(userId, presentationId, slideIds),
  }),
];
