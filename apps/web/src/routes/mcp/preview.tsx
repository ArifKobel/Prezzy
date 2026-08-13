import type { PresentationTheme, Slide, SlideElement } from "@Prezzy/shared";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SlideCanvas } from "@/components/slide-canvas";
import { apiFetch } from "@/lib/api/client";

interface PreviewData {
  presentationId: string;
  title: string;
  theme: PresentationTheme | null;
  slide: Slide;
  elements: SlideElement[];
}

export const Route = createFileRoute("/mcp/preview")({
  validateSearch: (search: Record<string, unknown>): { token: string } => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  component: McpPreviewPage,
});

function McpPreviewPage() {
  const { token } = Route.useSearch();
  const [data, setData] = useState<PreviewData | null>(null);

  useEffect(() => {
    if (token) {
      apiFetch<PreviewData>(`/mcp-preview?token=${encodeURIComponent(token)}`).then(setData);
    }
  }, [token]);

  if (!data) return <div className="h-[540px] w-[960px] bg-white" />;
  return (
    <div data-mcp-preview-ready className="h-[540px] w-[960px] overflow-hidden">
      <SlideCanvas elements={data.elements} theme={data.theme} slideBg={data.slide.bg} />
    </div>
  );
}
