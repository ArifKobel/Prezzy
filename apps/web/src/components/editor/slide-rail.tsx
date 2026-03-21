import { api } from "@Prezzy/backend/convex/_generated/api";
import type { Doc, Id } from "@Prezzy/backend/convex/_generated/dataModel";
import { cn } from "@Prezzy/ui/lib/utils";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { arrayMove } from "@dnd-kit/sortable";
import { useMutation, useQuery } from "convex/react";
import { GripVertical, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SlideCanvas } from "@/components/slide-canvas";

import type { PresentationTheme } from "@/lib/quiz-constants";

function SortableThumbnail({
  slide,
  index,
  isActive,
  elements,
  onClick,
  theme,
}: {
  slide: Doc<"slides">;
  index: number;
  isActive: boolean;
  elements: Doc<"slideElements">[];
  onClick: () => void;
  theme?: PresentationTheme | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative",
        isDragging && "z-50 opacity-60",
      )}
    >
      <div
        onClick={onClick}
        className={cn(
          "relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg shadow-sm transition-shadow hover:shadow-md",
          isActive && "ring-2 ring-primary ring-offset-1 ring-offset-surface-container-low",
        )}
      >
        <button
          {...attributes}
          {...listeners}
          className="absolute left-0 top-0 bottom-0 z-10 flex w-5 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="size-3 text-muted-foreground/60" />
        </button>

        <span className="absolute left-1.5 top-1 z-10 font-sans text-[8px] text-muted-foreground">
          {index + 1}
        </span>
        <SlideCanvas
          elements={elements}
          className="pointer-events-none h-full w-full"
          scaleToFit
          theme={theme}
        />
      </div>
    </div>
  );
}

export function SlideRail({
  slides,
  activeSlideId,
  presentationId,
  onSwitchSlide,
  onAddSlide,
  theme,
}: {
  slides: Doc<"slides">[];
  activeSlideId: Id<"slides"> | null;
  presentationId: Id<"presentations">;
  onSwitchSlide: (id: Id<"slides">) => void;
  onAddSlide: () => void;
  theme?: PresentationTheme | null;
}) {
  const reorder = useMutation(api.slides.reorder);
  const allElements = useQuery(api.slideElements.listByPresentation, { presentationId });

  const elementsBySlide = useMemo(() => {
    const map = new Map<Id<"slides">, Doc<"slideElements">[]>();
    if (!allElements) return map;
    for (const el of allElements) {
      const list = map.get(el.slideId) ?? [];
      list.push(el);
      map.set(el.slideId, list);
    }
    return map;
  }, [allElements]);

  const [localSlides, setLocalSlides] = useState(slides);
  const pendingReorder = useRef(false);

  useEffect(() => {
    if (!pendingReorder.current) {
      setLocalSlides(slides);
    } else {
      const serverIds = slides.map((s) => s._id).join(",");
      const localIds = localSlides.map((s) => s._id).join(",");
      if (serverIds === localIds) {
        pendingReorder.current = false;
      }
    }
  }, [slides, localSlides]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = localSlides.findIndex((s) => s._id === active.id);
      const newIndex = localSlides.findIndex((s) => s._id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(localSlides, oldIndex, newIndex);
      setLocalSlides(reordered);
      pendingReorder.current = true;

      await reorder({
        presentationId: slides[0].presentationId,
        slideIds: reordered.map((s) => s._id),
      });
    },
    [localSlides, slides, reorder],
  );

  const slideIds = localSlides.map((s) => s._id);

  return (
    <div className="flex w-[180px] shrink-0 flex-col overflow-hidden bg-surface-container-low">
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 py-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={slideIds} strategy={verticalListSortingStrategy}>
            {localSlides.map((slide, i) => (
              <SortableThumbnail
                key={slide._id}
                slide={slide}
                index={i}
                isActive={slide._id === activeSlideId}
                elements={elementsBySlide.get(slide._id) ?? []}
                onClick={() => onSwitchSlide(slide._id)}
                theme={theme}
              />
            ))}
          </SortableContext>
        </DndContext>

        <button
          onClick={onAddSlide}
          className="group flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border transition-all hover:border-primary/30 hover:bg-surface-container"
        >
          <Plus className="size-4 text-muted-foreground/40 transition-colors group-hover:text-primary" />
          <span className="font-sans text-[8px] font-medium text-muted-foreground/40 transition-colors group-hover:text-foreground">
            Add Slide
          </span>
        </button>
      </div>
    </div>
  );
}
