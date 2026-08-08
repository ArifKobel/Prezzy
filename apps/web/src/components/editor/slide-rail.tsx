import type { Slide, SlideElement } from "@Prezzy/shared";
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
import { GripVertical, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SlideCanvas } from "@/components/slide-canvas";

import { usePresentationElements } from "@/lib/api/presentations";
import { useReorderSlides } from "@/lib/api/slides";
import type { PresentationTheme } from "@/lib/quiz-constants";

function sameSlideSet(a: Slide[], b: Slide[]): boolean {
  if (a.length !== b.length) return false;
  const ids = new Set(a.map((s) => s.id));
  return b.every((s) => ids.has(s.id));
}

function SortableThumbnail({
  slide,
  index,
  isActive,
  elements,
  onClick,
  theme,
}: {
  slide: Slide;
  index: number;
  isActive: boolean;
  elements: SlideElement[];
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
  } = useSortable({ id: slide.id });

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
  slides: Slide[];
  activeSlideId: string | null;
  presentationId: string;
  onSwitchSlide: (id: string) => void;
  onAddSlide: () => void;
  theme?: PresentationTheme | null;
}) {
  const reorder = useReorderSlides();
  const { data: allElements } = usePresentationElements(presentationId);

  const elementsBySlide = useMemo(() => {
    const map = new Map<string, SlideElement[]>();
    if (!allElements) return map;
    for (const el of allElements) {
      const list = map.get(el.slideId) ?? [];
      list.push(el);
      map.set(el.slideId, list);
    }
    return map;
  }, [allElements]);

  const [localSlides, setLocalSlides] = useState(slides);
  const serverSlides = useRef(slides);
  const pendingReorders = useRef(0);

  useEffect(() => {
    serverSlides.current = slides;
    setLocalSlides((prev) =>
      pendingReorders.current > 0 && sameSlideSet(prev, slides) ? prev : slides,
    );
  }, [slides]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = localSlides.findIndex((s) => s.id === active.id);
      const newIndex = localSlides.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(localSlides, oldIndex, newIndex);
      setLocalSlides(reordered);
      pendingReorders.current += 1;

      try {
        await reorder({ presentationId, slideIds: reordered.map((s) => s.id) });
      } catch {
        setLocalSlides(serverSlides.current);
      } finally {
        pendingReorders.current -= 1;
      }
    },
    [localSlides, presentationId, reorder],
  );

  const slideIds = localSlides.map((s) => s.id);

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
                key={slide.id}
                slide={slide}
                index={i}
                isActive={slide.id === activeSlideId}
                elements={elementsBySlide.get(slide.id) ?? []}
                onClick={() => onSwitchSlide(slide.id)}
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
