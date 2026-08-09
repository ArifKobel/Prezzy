import type { PresentationTheme } from "@Prezzy/shared";
import { useFirstSlideElements } from "@/lib/api/presentations";
import { SlideCanvas } from "@/components/slide-canvas";

export function PresentationThumbnail({
  presentationId,
  theme,
}: {
  presentationId: string;
  theme?: PresentationTheme | null;
}) {
  const { data } = useFirstSlideElements(presentationId);

  if (!data || data.elements.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface-container">
        <span className="font-sans text-[10px] text-muted-foreground/30">
          Empty
        </span>
      </div>
    );
  }

  return (
    <SlideCanvas
      elements={data.elements}
      scaleToFit
      showPlaceholders
      className="h-full w-full"
      theme={theme}
      slideBg={data.bg}
    />
  );
}
