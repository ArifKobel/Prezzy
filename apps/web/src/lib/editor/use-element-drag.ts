import type { SlideElement } from "@Prezzy/shared";
import { useRef, useState } from "react";

import type { HistoryEntry } from "@/lib/editor/history";
import { snapPos } from "@/lib/editor/snap";

type DragMove = { id: string; oldX: number; oldY: number; newX: number; newY: number };

export function useElementDrag({
  canvasRef, elements,
  selectedIds, setSelectedIds, editingId, setEditingId,
  moveableActive, updatePosition, pushHistory, liveId,
}: {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  elements: SlideElement[] | undefined;
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  moveableActive: React.RefObject<boolean>;
  updatePosition: (args: { id: string; x: number; y: number }) => Promise<unknown>;
  pushHistory: (entry: HistoryEntry) => void;
  liveId: (id: string) => string;
}) {
  const [dragPositions, setDragPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [snapLines, setSnapLines] = useState<{ vLines: number[]; hLines: number[] }>({ vLines: [], hLines: [] });
  const dragging = useRef<{ startMX: number; startMY: number; items: Array<{ id: string; startX: number; startY: number }> } | null>(null);
  const dragPosRef = useRef<Map<string, { x: number; y: number }> | null>(null);
  const sessionRef = useRef(0);

  function handleElementPointerDown(e: React.PointerEvent<HTMLDivElement>, el: SlideElement) {
    if (editingId === el.id || e.button === 2 || moveableActive.current) return;
    e.preventDefault();
    e.stopPropagation();
    if (editingId) setEditingId(null);

    if (e.shiftKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(el.id)) next.delete(el.id); else next.add(el.id);
        return next;
      });
      return;
    }

    const dragIds: Set<string> = selectedIds.has(el.id) && selectedIds.size > 1
      ? selectedIds : new Set([el.id]);

    if (!selectedIds.has(el.id) || selectedIds.size === 1) setSelectedIds(new Set([el.id]));

    const session = ++sessionRef.current;
    const items = Array.from(dragIds).map((id) => {
      const data = elements?.find((e) => e.id === id);
      return { id, startX: data?.x ?? 0, startY: data?.y ?? 0 };
    });
    dragging.current = { startMX: e.clientX, startMY: e.clientY, items };

    const leadEl  = elements?.find((e) => e.id === el.id);
    const leadW   = leadEl?.width  ?? 20;
    const leadH   = leadEl?.height ?? 20;
    const movingIds = new Set(items.map((i) => i.id));

    function detach() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("lostpointercapture", onCancel);
    }

    function onMove(ev: PointerEvent) {
      if (!dragging.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const dx = ((ev.clientX - dragging.current.startMX) / rect.width)  * 100;
      const dy = ((ev.clientY - dragging.current.startMY) / rect.height) * 100;
      const lead = dragging.current.items[0];
      const snapped = snapPos(Math.max(0, lead.startX + dx), Math.max(0, lead.startY + dy), leadW, leadH, movingIds, elements);
      const offX = snapped.x - Math.max(0, lead.startX + dx);
      const offY = snapped.y - Math.max(0, lead.startY + dy);
      const positions = new Map(dragging.current.items.map((item) => [
        item.id, { x: Math.max(0, item.startX + dx + offX), y: Math.max(0, item.startY + dy + offY) },
      ]));
      dragPosRef.current = positions;
      setDragPositions(new Map(positions));
      setSnapLines({ vLines: snapped.vLines, hLines: snapped.hLines });
    }

    function onCancel() {
      detach();
      dragging.current = null;
      dragPosRef.current = null;
      setDragPositions(new Map());
      setSnapLines({ vLines: [], hLines: [] });
    }

    function onUp() {
      detach();
      const active = dragging.current;
      const positions = dragPosRef.current;
      dragging.current = null;
      dragPosRef.current = null;
      setSnapLines({ vLines: [], hLines: [] });

      const moves: DragMove[] = [];
      if (active && positions) {
        for (const item of active.items) {
          const pos = positions.get(item.id);
          if (!pos || (pos.x === item.startX && pos.y === item.startY)) continue;
          moves.push({ id: item.id, oldX: item.startX, oldY: item.startY, newX: pos.x, newY: pos.y });
        }
      }

      if (moves.length === 0) {
        setDragPositions(new Map());
        return;
      }

      const writes = moves.map((m) => updatePosition({ id: m.id, x: m.newX, y: m.newY }));
      Promise.allSettled(writes).then(() => {
        if (sessionRef.current === session) setDragPositions(new Map());
      });

      pushHistory({
        undo: () => Promise.all(moves.map((m) => updatePosition({ id: liveId(m.id), x: m.oldX, y: m.oldY }))),
        redo: () => Promise.all(moves.map((m) => updatePosition({ id: liveId(m.id), x: m.newX, y: m.newY }))),
      });
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("lostpointercapture", onCancel);
  }

  return { dragPositions, snapLines, handleElementPointerDown };
}
