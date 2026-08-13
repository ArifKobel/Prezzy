import type { ContentBlock, McpServer, ToolAnnotations } from "@modelcontextprotocol/server";
import type * as z from "zod/v4";

export type ToolScope = "presentations:read" | "presentations:write";

export interface ToolContext {
  userId: string;
}

export interface McpTool<Args = unknown, Result = unknown> {
  name: string;
  description: string;
  scope: ToolScope;
  input?: z.ZodType<Args>;
  annotations?: ToolAnnotations;
  run: (args: Args, context: ToolContext) => Result | Promise<Result>;
  content?: (result: Result) => ContentBlock[];
}

export const defineTool = <Args, Result>(tool: McpTool<Args, Result>): McpTool => tool as McpTool;

const VISUAL_REMINDER =
  "Visual reminder: use slide_preview for affected slides before judging layout and after visual edits.";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const jsonResult = (value: unknown) => ({
  content: [
    { type: "text" as const, text: JSON.stringify(value) },
    { type: "text" as const, text: VISUAL_REMINDER },
  ],
  ...(isPlainObject(value) ? { structuredContent: value } : {}),
});

const grants = (scopes: Set<string>, required: ToolScope): boolean =>
  required === "presentations:write"
    ? scopes.has("presentations:write")
    : scopes.has("presentations:read") || scopes.has("presentations:write");

export const toolsFor = (tools: McpTool[], scopes: Set<string>): McpTool[] =>
  tools.filter((tool) => grants(scopes, tool.scope));

export function registerTools(
  server: McpServer,
  tools: McpTool[],
  scopes: Set<string>,
  context: ToolContext,
): void {
  for (const tool of toolsFor(tools, scopes)) {
    const handler = async (args: unknown) => {
      const result = await tool.run(tool.input ? args : undefined, context);
      return tool.content ? { content: tool.content(result) } : jsonResult(result);
    };
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        ...(tool.input ? { inputSchema: tool.input } : {}),
        ...(tool.annotations ? { annotations: tool.annotations } : {}),
      },
      handler as never,
    );
  }
}
