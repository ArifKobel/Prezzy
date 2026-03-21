import type { Doc, Id } from "@Prezzy/backend/convex/_generated/dataModel";
import { useRef, useState } from "react";

import type { HistoryEntry } from "@/lib/editor/history";
import { snapPos, type Geo } from "@/lib/editor/snap";

export function useElementDrag({
  canvasRef, elements, localGeometry, setLocalGeometry,
  selectedIds, setSelectedIds, editingId, setEditingId,
  moveableActive, updatePosition, pushHistory,
}: {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  elements: Doc<"slideElements">[] | undefined;
  localGeometry: Map<Id<"slideElements">, Geo>;
  setLocalGeometry: React.Dispatch<React.SetStateAction<Map<Id<"slideElements">, Geo>>>;
  selectedIds: Set<Id<"slideElements">>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<Id<"slideElements">>>>;
  editingId: Id<"slideElements"> | null;
  setEditingId: (id: Id<"slideElements"> | null) => void;
  moveableActive: React.RefObject<boolean>;
  updatePosition: (args: { id: Id<"slideElements">; x: number; y: number }) => void;
  pushHistory: (entry: HistoryEntry) => void;
}) {
  const [dragPositions, setDragPositions] = useState<Map<Id<"slideElements">, { x: number; y: number }>>(new Map());
  const [snapLines, setSnapLines] = useState<{ vLines: number[]; hLines: number[] }>({ vLines: [], hLines: [] });
  const dragging = useRef<{ startMX: number; startMY: number; items: Array<{ id: Id<"slideElements">; startX: number; startY: number }> } | null>(null);
  const dragPosRef = useRef<Map<Id<"slideElements">, { x: number; y: number }> | null>(null);

  function handleElementPointerDown(e: React.PointerEvent<HTMLDivElement>, el: Doc<"slideElements">) {
    if (editingId === el._id || e.button === 2 || moveableActive.current) return;
    e.preventDefault();
    e.stopPropagation();
    if (editingId) setEditingId(null);

    if (e.shiftKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(el._id)) next.delete(el._id); else next.add(el._id);
        return next;
      });
      return;
    }

    const dragIds: Set<Id<"slideElements">> = selectedIds.has(el._id) && selectedIds.size > 1
      ? selectedIds : new Set([el._id]);

    if (!selectedIds.has(el._id) || selectedIds.size === 1) setSelectedIds(new Set([el._id]));

    const items = Array.from(dragIds).map((id) => {
      const geo = localGeometry.get(id);
      const data = elements?.find((e) => e._id === id);
      return { id, startX: geo?.x ?? data?.x ?? 0, startY: geo?.y ?? data?.y ?? 0 };
    });
    dragging.current = { startMX: e.clientX, startMY: e.clientY, items };

    const leadEl  = elements?.find((e) => e._id === el._id);
    const leadGeo = localGeometry.get(el._id) ?? leadEl;
    const leadW   = leadGeo?.width  ?? leadEl?.width  ?? 20;
    const leadH   = leadGeo?.height ?? leadEl?.height ?? 20;
    const movingIds = new Set(items.map((i) => i.id as string));

    function onMove(ev: PointerEvent) {
      if (!dragging.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const dx = ((ev.clientX - dragging.current.startMX) / rect.width)  * 100;
      const dy = ((ev.clientY - dragging.current.startMY) / rect.height) * 100;
      const lead = dragging.current.items[0];
      const snapped = snapPos(Math.max(0, lead.startX + dx), Math.max(0, lead.startY + dy), leadW, leadH, movingIds, elements, localGeometry);
      const offX = snapped.x - Math.max(0, lead.startX + dx);
      const offY = snapped.y - Math.max(0, lead.startY + dy);
      const positions = new Map(dragging.current.items.map((item) => [
        item.id, { x: Math.max(0, item.startX + dx + offX), y: Math.max(0, item.startY + dy + offY) },
      ]));
      dragPosRef.current = positions;
      setDragPositions(new Map(positions));
      setSnapLines({ vLines: snapped.vLines, hLines: snapped.hLines });
    }

    function onUp() {
      if (dragging.current && dragPosRef.current) {
        const moves: Array<{ id: Id<"slideElements">; oldX: number; oldY: number; newX: number; newY: number }> = [];
        dragPosRef.current.forEach((pos, id) => {
          const data = elements?.find((e) => e._id === id);
          const existing = localGeometry.get(id);
          moves.push({ id, oldX: data?.x ?? 0, oldY: data?.y ?? 0, newX: pos.x, newY: pos.y });
          setLocalGeometry((prev) => new Map(prev).set(id, {
            x: pos.x, y: pos.y,
            width: existing?.width ?? data?.width ?? 0,
            height: existing?.height ?? data?.height ?? 0,
          }));
          updatePosition({ id, x: pos.x, y: pos.y });
        });
        if (moves.length > 0) {
          pushHistory({
            undo: () => { for (const m of moves) updatePosition({ id: m.id, x: m.oldX, y: m.oldY }); },
            redo: () => { for (const m of moves) updatePosition({ id: m.id, x: m.newX, y: m.newY }); },
          });
        }
      }
      dragging.current = null;
      dragPosRef.current = null;
      setDragPositions(new Map());
      setSnapLines({ vLines: [], hLines: [] });
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return { dragPositions, snapLines, handleElementPointerDown };
}
