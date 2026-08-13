import type { McpServer } from "@modelcontextprotocol/server";
import { describe, expect, it, vi } from "vitest";
import type { DeckService } from "@/deck-actions/deck.service";
import type { ElementActionsService } from "@/deck-actions/element-actions.service";
import type { SlideActionsService } from "@/deck-actions/slide-actions.service";
import type { PreviewService } from "@/mcp/preview/preview.service";
import { jsonResult, registerTools, toolsFor, type McpTool } from "@/mcp/tool";
import { elementTools } from "@/mcp/tools/elements";
import { presentationTools } from "@/mcp/tools/presentations";
import { previewTools } from "@/mcp/tools/preview";
import { slideTools } from "@/mcp/tools/slides";
import type { PresentationsService } from "@/presentations/presentations.service";

const stub = <T>(value: Partial<T>): T => value as T;

const buildTools = (overrides: {
  presentations?: Partial<PresentationsService>;
  deck?: Partial<DeckService>;
  slides?: Partial<SlideActionsService>;
  elements?: Partial<ElementActionsService>;
  preview?: Partial<PreviewService>;
} = {}): McpTool[] => [
  ...presentationTools(stub(overrides.presentations ?? {}), stub(overrides.deck ?? {})),
  ...slideTools(stub(overrides.slides ?? {})),
  ...elementTools(stub(overrides.elements ?? {})),
  ...previewTools(stub(overrides.preview ?? {})),
];

const names = (tools: McpTool[]) => tools.map((tool) => tool.name).sort();

const fakeServer = () => {
  const registered = new Map<string, (args: unknown) => Promise<{ content: unknown[] }>>();
  const server = {
    registerTool: (name: string, _config: unknown, handler: (args: unknown) => Promise<{ content: unknown[] }>) => {
      registered.set(name, handler);
    },
  } as unknown as McpServer;
  return { server, registered };
};

describe("tool scopes", () => {
  it("exposes nothing without a granted scope", () => {
    expect(toolsFor(buildTools(), new Set())).toEqual([]);
  });

  it("exposes only read tools for the read scope", () => {
    expect(names(toolsFor(buildTools(), new Set(["presentations:read"])))).toEqual([
      "deck_get",
      "presentation_get",
      "presentations_list",
      "slide_preview",
    ]);
  });

  it("includes every read tool in the write scope", () => {
    const read = names(toolsFor(buildTools(), new Set(["presentations:read"])));
    const write = names(toolsFor(buildTools(), new Set(["presentations:write"])));
    expect(write).toEqual(expect.arrayContaining(read));
    expect(write.length).toBe(buildTools().length);
  });

  it("marks destructive tools so clients can warn", () => {
    const destructive = buildTools()
      .filter((tool) => tool.annotations?.destructiveHint)
      .map((tool) => tool.name)
      .sort();
    expect(destructive).toEqual(["elements_delete", "presentation_delete", "slide_delete"]);
  });

  it("uses unique tool names", () => {
    const all = buildTools().map((tool) => tool.name);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("tool registration", () => {
  it("registers only granted tools and passes the authenticated user through", async () => {
    const list = vi.fn().mockResolvedValue([{ id: "p1" }]);
    const { server, registered } = fakeServer();

    registerTools(server, buildTools({ presentations: { list } }), new Set(["presentations:read"]), {
      userId: "user-1",
    });

    expect([...registered.keys()].sort()).toEqual(["deck_get", "presentation_get", "presentations_list", "slide_preview"]);
    const result = await registered.get("presentations_list")?.(undefined);
    expect(list).toHaveBeenCalledWith("user-1");
    expect(result?.content[0]).toEqual({ type: "text", text: JSON.stringify([{ id: "p1" }]) });
  });

  it("routes tool arguments to the matching service call", async () => {
    const setContent = vi.fn().mockResolvedValue({ slideId: "s1", elementIds: [], zIndices: [], warnings: [] });
    const { server, registered } = fakeServer();

    registerTools(server, buildTools({ slides: { setContent } }), new Set(["presentations:write"]), {
      userId: "user-2",
    });
    await registered.get("slide_set_content")?.({ presentationId: "p1", slideId: "s1", elements: [] });

    expect(setContent).toHaveBeenCalledWith("user-2", "p1", "s1", []);
  });

  it("returns the rendered slide as an image block", async () => {
    const render = vi.fn().mockResolvedValue({ png: Buffer.from("png-bytes"), warnings: ["clipped"] });
    const { server, registered } = fakeServer();

    registerTools(server, buildTools({ preview: { render } }), new Set(["presentations:read"]), {
      userId: "user-3",
    });
    const result = await registered.get("slide_preview")?.({ presentationId: "p1", slideId: "s1" });

    expect(render).toHaveBeenCalledWith("user-3", "p1", "s1");
    expect(result?.content[0]).toEqual({
      type: "image",
      data: Buffer.from("png-bytes").toString("base64"),
      mimeType: "image/png",
    });
    expect(result?.content[2]).toMatchObject({ text: "Render warnings: clipped" });
  });
});

describe("result envelope", () => {
  it("attaches structured content for objects only", () => {
    expect(jsonResult({ slideId: "s1" }).structuredContent).toEqual({ slideId: "s1" });
    expect(jsonResult([{ id: "p1" }]).structuredContent).toBeUndefined();
  });
});
