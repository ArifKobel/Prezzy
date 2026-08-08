import { useFirstSlideElements } from "@/lib/api/presentations";
import { SlideCanvas } from "@/components/slide-canvas";

export function PresentationThumbnail({
  presentationId,
}: {
  presentationId: string;
}) {
  const { data: elements } = useFirstSlideElements(presentationId);

  if (!elements || elements.length === 0) {
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
      elements={elements}
      scaleToFit
      showPlaceholders
      className="h-full w-full"
    />
  );
}
