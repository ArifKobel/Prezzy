import type { SlideElement } from "@Prezzy/shared";
import { useRef, useState } from "react";

import type { Geo } from "@/lib/editor/snap";

export function useMarquee({
  canvasRef, canvasAreaRef, elements, localGeometry, setSelectedIds,
}: {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  canvasAreaRef: React.RefObject<HTMLDivElement | null>;
  elements: SlideElement[] | undefined;
  localGeometry: Map<string, Geo>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const marqueeRef      = useRef<{ startX: number; startY: number } | null>(null);
  const marqueeStateRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const didMarqueeRef   = useRef(false);

  function handleMarqueePointerDown(e: React.PointerEvent<HTMLElement>) {
    if (!canvasRef.current) return;
    const target = e.target as HTMLElement;
    if (target !== canvasAreaRef.current && target !== canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = ((e.clientX - rect.left) / rect.width) * 100;
    const startY = ((e.clientY - rect.top) / rect.height) * 100;
    marqueeRef.current = { startX, startY };
    marqueeStateRef.current = null;

    function onMove(ev: PointerEvent) {
      if (!marqueeRef.current || !canvasRef.current) return;
      const r = canvasRef.current.getBoundingClientRect();
      const curX = ((ev.clientX - r.left) / r.width) * 100;
      const curY = ((ev.clientY - r.top) / r.height) * 100;
      const mq = {
        x: Math.min(marqueeRef.current.startX, curX),
        y: Math.min(marqueeRef.current.startY, curY),
        w: Math.abs(curX - marqueeRef.current.startX),
        h: Math.abs(curY - marqueeRef.current.startY),
      };
      marqueeStateRef.current = mq;
      setMarquee({ ...mq });
    }

    function onUp() {
      const mq = marqueeStateRef.current;
      if (mq && (Math.abs(mq.w) > 0.5 || Math.abs(mq.h) > 0.5) && elements) {
        const mx = Math.min(mq.x, mq.x + mq.w);
        const my = Math.min(mq.y, mq.y + mq.h);
        const mw = Math.abs(mq.w), mh = Math.abs(mq.h);
        const hit = new Set<string>();
        elements.forEach((el) => {
          const g = localGeometry.get(el.id) ?? el;
          if (g.x < mx + mw && g.x + g.width > mx && g.y < my + mh && g.y + g.height > my) hit.add(el.id);
        });
        didMarqueeRef.current = true;
        setSelectedIds(hit);
      }
      marqueeRef.current = null;
      marqueeStateRef.current = null;
      setMarquee(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return { marquee, didMarqueeRef, handleMarqueePointerDown };
}
