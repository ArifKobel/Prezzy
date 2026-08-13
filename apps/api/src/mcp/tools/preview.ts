import * as z from "zod/v4";
import type { PreviewService, SlideRender } from "@/mcp/preview/preview.service";
import { uuid } from "@/mcp/schemas";
import { defineTool, type McpTool } from "@/mcp/tool";

export const previewTools = (preview: PreviewService): McpTool[] => [
  defineTool({
    name: "slide_preview",
    description:
      "Render a slide exactly as Prezzy displays it and return a PNG image. Use before and after visual edits.",
    scope: "presentations:read",
    annotations: { readOnlyHint: true },
    input: z.object({ presentationId: uuid, slideId: uuid }),
    run: ({ presentationId, slideId }, { userId }): Promise<SlideRender & { slideId: string }> =>
      preview.render(userId, presentationId, slideId).then((render) => ({ ...render, slideId })),
    content: ({ png, warnings, slideId }) => [
      { type: "image", data: png.toString("base64"), mimeType: "image/png" },
      {
        type: "text",
        text: `Rendered slide ${slideId} at 960x540. Inspect this image before deciding on further layout changes.`,
      },
      ...(warnings.length > 0 ? [{ type: "text" as const, text: `Render warnings: ${warnings.join(" ")}` }] : []),
    ],
  }),
];
