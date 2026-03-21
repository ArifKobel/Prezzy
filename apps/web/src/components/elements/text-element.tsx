import { cn } from "@Prezzy/ui/lib/utils";
import { HEADING_CLS, TEXT_CLS } from "@/components/slide-canvas";

export function TextElement({
  isHeading,
  content,
  opacity,
  showPlaceholder = false,
}: {
  isHeading: boolean;
  content: string;
  opacity?: number;
  showPlaceholder?: boolean;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none select-none",
        isHeading ? HEADING_CLS : TEXT_CLS,
      )}
      style={{
        opacity: opacity != null ? opacity / 100 : 1,
      }}
      dangerouslySetInnerHTML={{
        __html: content || (showPlaceholder
          ? `<p class="text-muted-foreground opacity-25">${isHeading ? "Heading" : "Text box"}</p>`
          : ""),
      }}
    />
  );
}
