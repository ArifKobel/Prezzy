import * as z from "zod/v4";
import type { ElementActionsService } from "@/deck-actions/element-actions.service";
import { elementProps, geometrySchema, newElement, position, reorderAction, uuid } from "@/mcp/schemas";
import { defineTool, type McpTool } from "@/mcp/tool";

export const elementTools = (elements: ElementActionsService): McpTool[] => [
  defineTool({
    name: "element_add",
    description: "Add an element to a slide",
    scope: "presentations:write",
    input: z.object({ presentationId: uuid }).extend(newElement.shape),
    run: ({ presentationId, ...element }, { userId }) => elements.add(userId, presentationId, element),
  }),
  defineTool({
    name: "element_update",
    description: "Update element geometry, position, properties, or stacking order",
    scope: "presentations:write",
    input: z.object({
      presentationId: uuid,
      elementId: uuid,
      geometry: geometrySchema.optional(),
      position: position.optional(),
      props: elementProps.optional(),
      order: reorderAction.optional(),
    }),
    run: ({ presentationId, elementId, ...patch }, { userId }) =>
      elements.update(userId, presentationId, elementId, patch),
  }),
  defineTool({
    name: "elements_delete",
    description: "Delete one or more elements",
    scope: "presentations:write",
    annotations: { destructiveHint: true },
    input: z.object({ presentationId: uuid, elementIds: z.array(uuid).min(1) }),
    run: ({ presentationId, elementIds }, { userId }) => elements.remove(userId, presentationId, elementIds),
  }),
];
