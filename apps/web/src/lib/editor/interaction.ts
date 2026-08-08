import type { SlideElement } from "@Prezzy/shared";
import { clampGroupDelta, snapPos } from "@/lib/editor/snap";
import type { EditorStore, Rect } from "@/lib/editor/store";

const MOVE_THRESHOLD = 0.15;

export interface Point { x: number; y: number }

interface DragItem { id: string; startX: number; startY: number; width: number; height: number }

type Session =
  | { kind: "drag"; origin: Point; items: DragItem[]; lead: DragItem; moved: boolean }
  | { kind: "marquee"; origin: Point };

const isRichText = (el: SlideElement) => el.type === "heading" || el.type === "text";

const rectOf = (a: Point, b: Point): Rect => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  w: Math.abs(b.x - a.x),
  h: Math.abs(b.y - a.y),
});

const overlaps = (rect: Rect, el: SlideElement) =>
  el.x < rect.x + rect.w && el.x + el.width > rect.x &&
  el.y < rect.y + rect.h && el.y + el.height > rect.y;

export function createInteraction(store: EditorStore) {
  let session: Session | null = null;

  const toItem = (el: SlideElement): DragItem => ({
    id: el.id,
    startX: el.x,
    startY: el.y,
    width: el.width,
    height: el.height,
  });

  function pointerDownOnElement(id: string, point: Point, modifiers: { shift?: boolean } = {}) {
    const state = store.getState();
    if (state.interaction.kind === "text") {
      if (state.interaction.id === id) return;
      store.stopEditing();
    }

    if (modifiers.shift) {
      store.toggleSelection(id);
      return;
    }

    const selected = state.selectedIds;
    const dragIds = selected.has(id) && selected.size > 1 ? [...selected] : [id];
    if (!selected.has(id) || selected.size === 1) store.select(id);

    const byId = new Map(state.elements.map((el) => [el.id, el]));
    const items = dragIds.map((dragId) => byId.get(dragId)).filter(Boolean).map((el) => toItem(el!));
    const lead = items.find((item) => item.id === id);
    if (!lead || items.length === 0) return;

    session = { kind: "drag", origin: point, items, lead, moved: false };
    store.beginInteraction({
      kind: "drag",
      ids: items.map((item) => item.id),
      moved: false,
      positions: new Map(items.map((item) => [item.id, { x: item.startX, y: item.startY }])),
      snapLines: { vLines: [], hLines: [] },
    });
  }

  function pointerDownOnCanvas(point: Point) {
    if (store.getState().interaction.kind === "text") store.stopEditing();
    session = { kind: "marquee", origin: point };
    store.beginInteraction({ kind: "marquee", rect: rectOf(point, point) });
  }

  function pointerMove(point: Point) {
    if (!session) return;

    if (session.kind === "marquee") {
      store.updateInteraction({ kind: "marquee", rect: rectOf(session.origin, point) });
      return;
    }

    const dx = point.x - session.origin.x;
    const dy = point.y - session.origin.y;
    if (!session.moved && Math.abs(dx) + Math.abs(dy) < MOVE_THRESHOLD) return;
    session.moved = true;

    const moving = new Set(session.items.map((item) => item.id));
    const others = store.slideElements().filter((el) => !moving.has(el.id));
    const snapped = snapPos(
      session.lead.startX + dx,
      session.lead.startY + dy,
      session.lead.width,
      session.lead.height,
      moving,
      others,
    );
    const offX = snapped.x - (session.lead.startX + dx);
    const offY = snapped.y - (session.lead.startY + dy);
    const delta = clampGroupDelta(session.items, dx + offX, dy + offY);

    store.updateInteraction({
      kind: "drag",
      ids: session.items.map((item) => item.id),
      moved: true,
      positions: new Map(
        session.items.map((item) => [item.id, { x: item.startX + delta.dx, y: item.startY + delta.dy }]),
      ),
      snapLines: { vLines: snapped.vLines, hLines: snapped.hLines },
    });
  }

  function pointerUp() {
    if (!session) return;
    const active = session;
    session = null;

    if (active.kind === "marquee") {
      const state = store.getState();
      const rect = state.interaction.kind === "marquee" ? state.interaction.rect : null;
      store.endInteraction();
      if (!rect || (rect.w < 0.5 && rect.h < 0.5)) {
        store.clearSelection();
        return;
      }
      store.selectMany(store.slideElements().filter((el) => overlaps(rect, el)).map((el) => el.id));
      return;
    }

    const state = store.getState();
    const positions = state.interaction.kind === "drag" ? state.interaction.positions : null;
    store.endInteraction();
    if (!active.moved || !positions) return;

    const moves = active.items
      .map((item) => ({ id: item.id, ...positions.get(item.id)! }))
      .filter((move, index) => move.x !== active.items[index].startX || move.y !== active.items[index].startY);
    if (moves.length > 0) store.moveElements(moves);
  }

  function cancel() {
    session = null;
    store.endInteraction();
  }

  function doubleClickOnElement(id: string) {
    const el = store.getState().elements.find((item) => item.id === id);
    if (el && isRichText(el)) store.startEditing(id);
  }

  function escape() {
    const state = store.getState();
    if (state.interaction.kind === "text") { store.stopEditing(); return; }
    if (session) { cancel(); return; }
    store.clearSelection();
  }

  return {
    pointerDownOnElement,
    pointerDownOnCanvas,
    pointerMove,
    pointerUp,
    cancel,
    doubleClickOnElement,
    escape,
    isDragging: () => session?.kind === "drag" && session.moved,
  };
}
