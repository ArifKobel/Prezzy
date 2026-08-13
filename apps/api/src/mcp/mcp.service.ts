import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { DeckService } from "@/deck-actions/deck.service";
import { ElementActionsService } from "@/deck-actions/element-actions.service";
import { SlideActionsService } from "@/deck-actions/slide-actions.service";
import { PreviewService } from "@/mcp/preview/preview.service";
import { registerTools, type McpTool } from "@/mcp/tool";
import { elementTools } from "@/mcp/tools/elements";
import { presentationTools } from "@/mcp/tools/presentations";
import { previewTools } from "@/mcp/tools/preview";
import { slideTools } from "@/mcp/tools/slides";
import { PresentationsService } from "@/presentations/presentations.service";

const INSTRUCTIONS =
  "Use slide_preview to inspect slides visually. Call it before changing an existing slide and again after visual changes. Do not judge layout from coordinates or element JSON alone.";

@Injectable()
export class McpService implements OnModuleDestroy {
  private readonly tools: McpTool[];
  private readonly handler = createMcpHandler(({ authInfo }) =>
    this.server(userIdOf(authInfo?.extra), new Set(authInfo?.scopes ?? [])),
  );
  readonly nodeHandler = toNodeHandler(this.handler);

  constructor(
    presentations: PresentationsService,
    deck: DeckService,
    slides: SlideActionsService,
    elements: ElementActionsService,
    preview: PreviewService,
  ) {
    this.tools = [
      ...presentationTools(presentations, deck),
      ...slideTools(slides),
      ...elementTools(elements),
      ...previewTools(preview),
    ];
  }

  async onModuleDestroy(): Promise<void> {
    await this.handler.close();
  }

  private server(userId: string, scopes: Set<string>): McpServer {
    const server = new McpServer(
      { name: "prezzy", version: "0.1.0" },
      { capabilities: { tools: {} }, instructions: INSTRUCTIONS },
    );
    registerTools(server, this.tools, scopes, { userId });
    return server;
  }
}

function userIdOf(extra: Record<string, unknown> | undefined): string {
  const userId = extra?.userId;
  if (typeof userId !== "string") throw new Error("Missing authenticated Prezzy user");
  return userId;
}
