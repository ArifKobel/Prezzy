import type { Slide, SlideElement } from "@Prezzy/shared";
import { ContextMenu, ContextMenuTrigger } from "@Prezzy/ui/components/context-menu";
import { cn } from "@Prezzy/ui/lib/utils";
import { SlideContextMenu } from "@/components/editor/slide-context-menu";
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
import { Copy, GripVertical, LayoutGrid, Plus } from "lucide-react";
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
  onDuplicate,
  onDelete,
  onAddAfter,
  onPickLayout,
  canDelete,
  theme,
}: {
  slide: Slide;
  index: number;
  isActive: boolean;
  elements: SlideElement[];
  onClick: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddAfter: () => void;
  onPickLayout: () => void;
  canDelete: boolean;
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
      <ContextMenu>
      <ContextMenuTrigger
        onClick={onClick}
        onContextMenu={onClick}
        className={cn(
          "relative block aspect-video w-full cursor-pointer overflow-hidden rounded-lg shadow-sm transition-shadow hover:shadow-md",
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

        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          title="Duplicate slide"
          className="absolute right-1 top-1 z-10 flex size-5 items-center justify-center rounded-md bg-surface-container-lowest/85 text-muted-foreground opacity-0 shadow-sm backdrop-blur-sm transition-all hover:text-foreground group-hover:opacity-100"
        >
          <Copy className="size-3" />
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
      </ContextMenuTrigger>

      <SlideContextMenu
        canDelete={canDelete}
        onAddAfter={onAddAfter}
        onPickLayout={onPickLayout}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />
      </ContextMenu>
    </div>
  );
}

export function SlideRail({
  slides,
  activeSlideId,
  presentationId,
  onSwitchSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onPickLayout,
  theme,
}: {
  slides: Slide[];
  activeSlideId: string | null;
  presentationId: string;
  onSwitchSlide: (id: string) => void;
  onAddSlide: (afterSlideId?: string) => void;
  onDuplicateSlide: (id: string) => void;
  onDeleteSlide: (id: string) => void;
  onPickLayout: () => void;
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
                onDuplicate={() => onDuplicateSlide(slide.id)}
                onDelete={() => onDeleteSlide(slide.id)}
                onAddAfter={() => onAddSlide(slide.id)}
                onPickLayout={onPickLayout}
                canDelete={localSlides.length > 1}
                theme={theme}
              />
            ))}
          </SortableContext>
        </DndContext>

        <div className="group relative">
          <button
            onClick={() => onAddSlide()}
            className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border transition-all hover:border-primary/30 hover:bg-surface-container"
          >
            <Plus className="size-4 text-muted-foreground/40 transition-colors group-hover:text-primary" />
            <span className="font-sans text-[8px] font-medium text-muted-foreground/40 transition-colors group-hover:text-foreground">
              Add Slide
            </span>
          </button>
          <button
            onClick={onPickLayout}
            title="Add slide from layout"
            className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-md bg-surface-container-lowest/85 text-muted-foreground opacity-0 shadow-sm backdrop-blur-sm transition-all hover:text-foreground group-hover:opacity-100"
          >
            <LayoutGrid className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
