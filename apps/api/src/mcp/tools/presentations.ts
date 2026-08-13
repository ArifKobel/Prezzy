import * as z from "zod/v4";
import type { DeckService } from "@/deck-actions/deck.service";
import { presentationTitle, themePatch, uuid } from "@/mcp/schemas";
import { defineTool, type McpTool } from "@/mcp/tool";
import type { PresentationsService } from "@/presentations/presentations.service";

export const presentationTools = (presentations: PresentationsService, deck: DeckService): McpTool[] => [
  defineTool({
    name: "presentations_list",
    description: "List the authenticated user's presentations",
    scope: "presentations:read",
    annotations: { readOnlyHint: true },
    run: (_args, { userId }) => presentations.list(userId),
  }),
  defineTool({
    name: "presentation_get",
    description: "Get presentation metadata",
    scope: "presentations:read",
    annotations: { readOnlyHint: true },
    input: z.object({ presentationId: uuid }),
    run: ({ presentationId }, { userId }) => presentations.get(presentationId, userId),
  }),
  defineTool({
    name: "deck_get",
    description: "Read the authoritative current deck including slides and elements",
    scope: "presentations:read",
    annotations: { readOnlyHint: true },
    input: z.object({ presentationId: uuid }),
    run: ({ presentationId }, { userId }) => deck.get(userId, presentationId),
  }),
  defineTool({
    name: "presentation_create",
    description: "Create a presentation with an initial slide",
    scope: "presentations:write",
    input: z.object({ title: presentationTitle }),
    run: ({ title }, { userId }) => presentations.create(userId, { title }),
  }),
  defineTool({
    name: "presentation_delete",
    description: "Permanently delete a presentation",
    scope: "presentations:write",
    annotations: { destructiveHint: true },
    input: z.object({ presentationId: uuid }),
    run: async ({ presentationId }, { userId }) => {
      await presentations.remove(presentationId, userId);
      return { presentationId, deleted: true };
    },
  }),
  defineTool({
    name: "presentation_set_title",
    description: "Set the presentation title",
    scope: "presentations:write",
    input: z.object({ presentationId: uuid, title: presentationTitle }),
    run: ({ presentationId, title }, { userId }) => deck.setTitle(userId, presentationId, title),
  }),
  defineTool({
    name: "presentation_set_theme",
    description: "Patch presentation theme values, using null to clear a value",
    scope: "presentations:write",
    input: z.object({ presentationId: uuid, theme: themePatch }),
    run: ({ presentationId, theme }, { userId }) => deck.setTheme(userId, presentationId, theme),
  }),
];
