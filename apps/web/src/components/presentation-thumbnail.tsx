import { api } from "@Prezzy/backend/convex/_generated/api";
import type { Id } from "@Prezzy/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { SlideCanvas } from "@/components/slide-canvas";

export function PresentationThumbnail({
  presentationId,
}: {
  presentationId: Id<"presentations">;
}) {
  const elements = useQuery(api.slideElements.listFirstSlide, {
    presentationId,
  });

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
      elements={elements.map((el) => ({
        _id: el._id,
        type: el.type,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        zIndex: el.zIndex ?? 0,
        props: el.props as Record<string, any> | null,
      }))}
      scaleToFit
      showPlaceholders
      className="h-full w-full"
    />
  );
}
