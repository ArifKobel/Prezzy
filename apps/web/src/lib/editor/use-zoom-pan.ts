import { useEffect, useState } from "react";

import { DESIGN_H, DESIGN_W } from "@/components/slide-canvas";

export function useZoomPan(canvasAreaRef: React.RefObject<HTMLDivElement | null>) {
  const [fitScale, setFitScale] = useState(1);
  const [userZoom, setUserZoom] = useState(0.8);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const effectiveScale = fitScale * userZoom;

  useEffect(() => {
    const el = canvasAreaRef.current;
    if (!el) return;
    const PAD = 64;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setFitScale(Math.min((width - PAD) / DESIGN_W, (height - PAD) / DESIGN_H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const area = canvasAreaRef.current;
    if (!area) return;
    function onWheel(e: WheelEvent) {
      if (!(e.metaKey || e.altKey || e.ctrlKey)) return;
      e.preventDefault();
      e.stopPropagation();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      setUserZoom((prev) => {
        const next = Math.min(5, Math.max(0.1, prev * factor));
        const af = next / prev;
        const areaRect = area!.getBoundingClientRect();
        const cx = e.clientX - areaRect.left, cy = e.clientY - areaRect.top;
        const mx = areaRect.width / 2, my = areaRect.height / 2;
        setPanOffset((p) => ({ x: p.x * af + (cx - mx) * (1 - af), y: p.y * af + (cy - my) * (1 - af) }));
        return next;
      });
    }
    area.addEventListener("wheel", onWheel, { passive: false });
    return () => area.removeEventListener("wheel", onWheel);
  }, []);

  function resetZoom() { setUserZoom(0.8); setPanOffset({ x: 0, y: 0 }); }

  return { userZoom, setUserZoom, panOffset, effectiveScale, resetZoom };
}
