import type { SlideElement } from "@Prezzy/shared";
import { useRef } from "react";
import type { Point, createInteraction } from "@/lib/editor/interaction";
import type { EditorStore } from "@/lib/editor/store";

export function useCanvasPointer({
  canvasRef, canvasAreaRef, store, interaction, moveableActive,
}: {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  canvasAreaRef: React.RefObject<HTMLDivElement | null>;
  store: EditorStore;
  interaction: ReturnType<typeof createInteraction>;
  moveableActive: React.RefObject<boolean>;
}) {
  const didDragRef = useRef(false);
  const didMarqueeRef = useRef(false);

  function toPoint(clientX: number, clientY: number): Point | null {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  }

  function attach() {
    function detach() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("lostpointercapture", onCancel);
    }
    function onMove(e: PointerEvent) {
      const point = toPoint(e.clientX, e.clientY);
      if (point) interaction.pointerMove(point);
    }
    function onUp() {
      const current = store.getState().interaction;
      if (current.kind === "drag" && current.moved) didDragRef.current = true;
      if (current.kind === "marquee" && (current.rect.w > 0.5 || current.rect.h > 0.5)) {
        didMarqueeRef.current = true;
      }
      interaction.pointerUp();
      detach();
    }
    function onCancel() {
      interaction.cancel();
      detach();
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("lostpointercapture", onCancel);
  }

  function handleElementPointerDown(e: React.PointerEvent<HTMLDivElement>, el: SlideElement) {
    if (e.button === 2 || moveableActive.current) return;
    const state = store.getState().interaction;
    if (state.kind === "text" && state.id === el.id) return;
    e.preventDefault();
    e.stopPropagation();
    didDragRef.current = false;
    const point = toPoint(e.clientX, e.clientY);
    if (!point) return;
    interaction.pointerDownOnElement(el.id, point, { shift: e.shiftKey });
    attach();
  }

  function handleCanvasPointerDown(e: React.PointerEvent<HTMLElement>) {
    const target = e.target as HTMLElement;
    if (target !== canvasAreaRef.current && target !== canvasRef.current) return;
    const point = toPoint(e.clientX, e.clientY);
    if (!point) return;
    didMarqueeRef.current = false;
    interaction.pointerDownOnCanvas(point);
    attach();
  }

  return { handleElementPointerDown, handleCanvasPointerDown, didDragRef, didMarqueeRef };
}
