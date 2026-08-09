import { beforeEach, describe, expect, it } from "vitest";
import { createInteraction } from "@/lib/editor/interaction";
import { createEditorStore, type EditorStore } from "@/lib/editor/store";

let store: EditorStore;
let ui: ReturnType<typeof createInteraction>;

beforeEach(() => {
  store = createEditorStore();
  store.load({
    title: "Deck",
    theme: null,
    slides: [{ id: "s1", presentationId: "p1", order: 0, title: null, bg: null, createdAt: 1 }],
    elements: [
      { id: "a", slideId: "s1", type: "shape", x: 10, y: 10, width: 20, height: 20, zIndex: 0, props: null, createdAt: 1 },
      { id: "b", slideId: "s1", type: "shape", x: 50, y: 50, width: 20, height: 20, zIndex: 1, props: null, createdAt: 2 },
      { id: "c", slideId: "s1", type: "text", x: 10, y: 80, width: 30, height: 8, zIndex: 2, props: { content: "<p>hi</p>" }, createdAt: 3 },
    ],
  });
  ui = createInteraction(store);
});

const at = (id: string) => store.getState().elements.find((el) => el.id === id)!;
const ids = () => [...store.getState().selectedIds].sort();

describe("selecting", () => {
  it("selects on pointer down", () => {
    ui.pointerDownOnElement("a", { x: 15, y: 15 });
    expect(ids()).toEqual(["a"]);
  });

  it("adds and removes with shift", () => {
    ui.pointerDownOnElement("a", { x: 15, y: 15 });
    ui.pointerUp();
    ui.pointerDownOnElement("b", { x: 55, y: 55 }, { shift: true });
    expect(ids()).toEqual(["a", "b"]);
    ui.pointerDownOnElement("b", { x: 55, y: 55 }, { shift: true });
    expect(ids()).toEqual(["a"]);
  });

  it("keeps a multi selection when pressing on a member", () => {
    store.selectMany(["a", "b"]);
    ui.pointerDownOnElement("a", { x: 15, y: 15 });
    expect(ids()).toEqual(["a", "b"]);
  });

  it("reduces to one when clicking a member without moving", () => {
    store.selectMany(["a", "b"]);
    ui.pointerDownOnElement("a", { x: 15, y: 15 });
    ui.pointerUp();
    ui.pointerDownOnElement("a", { x: 15, y: 15 });
    expect(ids()).toEqual(["a", "b"]);
  });
});

describe("dragging", () => {
  it("moves the element and commits once", () => {
    ui.pointerDownOnElement("a", { x: 15, y: 15 });
    ui.pointerMove({ x: 35, y: 25 });
    ui.pointerUp();
    expect(at("a").x).toBeCloseTo(30, 5);
    expect(at("a").y).toBeCloseTo(20, 5);
    expect(store.undoManager.undoStack).toHaveLength(1);
  });

  it("keeps the whole selection selected afterwards", () => {
    store.selectMany(["a", "b"]);
    ui.pointerDownOnElement("a", { x: 15, y: 15 });
    ui.pointerMove({ x: 25, y: 15 });
    ui.pointerUp();
    expect(ids()).toEqual(["a", "b"]);
  });

  it("preserves relative positions of a group", () => {
    store.selectMany(["a", "b"]);
    const gap = { x: at("b").x - at("a").x, y: at("b").y - at("a").y };
    ui.pointerDownOnElement("a", { x: 15, y: 15 });
    ui.pointerMove({ x: -900, y: -900 });
    ui.pointerUp();
    expect(at("b").x - at("a").x).toBeCloseTo(gap.x, 5);
    expect(at("b").y - at("a").y).toBeCloseTo(gap.y, 5);
  });

  it("keeps every member on the slide", () => {
    store.selectMany(["a", "b"]);
    ui.pointerDownOnElement("a", { x: 15, y: 15 });
    ui.pointerMove({ x: -900, y: -900 });
    ui.pointerUp();
    for (const id of ["a", "b"]) {
      expect(at(id).x + at(id).width).toBeGreaterThan(0);
      expect(at(id).y + at(id).height).toBeGreaterThan(0);
    }
  });

  it("ignores a jitter below the threshold", () => {
    ui.pointerDownOnElement("a", { x: 15, y: 15 });
    ui.pointerMove({ x: 15.05, y: 15.05 });
    ui.pointerUp();
    expect(at("a").x).toBe(10);
    expect(store.undoManager.undoStack).toHaveLength(0);
  });

  it("writes nothing on cancel", () => {
    ui.pointerDownOnElement("a", { x: 15, y: 15 });
    ui.pointerMove({ x: 40, y: 40 });
    ui.cancel();
    expect(at("a").x).toBe(10);
    expect(store.getState().interaction.kind).toBe("idle");
  });

  it("leaves no interaction state behind", () => {
    ui.pointerDownOnElement("a", { x: 15, y: 15 });
    ui.pointerMove({ x: 40, y: 40 });
    ui.pointerUp();
    expect(store.getState().interaction.kind).toBe("idle");
  });

  it("undoes a group move in one step", () => {
    store.selectMany(["a", "b"]);
    ui.pointerDownOnElement("a", { x: 15, y: 15 });
    ui.pointerMove({ x: 25, y: 25 });
    ui.pointerUp();
    store.undo();
    expect(at("a").x).toBe(10);
    expect(at("b").x).toBe(50);
  });
});

describe("marquee", () => {
  it("selects everything it covers", () => {
    ui.pointerDownOnCanvas({ x: 0, y: 0 });
    ui.pointerMove({ x: 75, y: 75 });
    ui.pointerUp();
    expect(ids()).toEqual(["a", "b"]);
  });

  it("clears the selection when it is only a click", () => {
    store.selectMany(["a"]);
    ui.pointerDownOnCanvas({ x: 90, y: 5 });
    ui.pointerUp();
    expect(ids()).toEqual([]);
  });

  it("ignores elements it does not touch", () => {
    ui.pointerDownOnCanvas({ x: 0, y: 0 });
    ui.pointerMove({ x: 35, y: 35 });
    ui.pointerUp();
    expect(ids()).toEqual(["a"]);
  });

  it("works when dragged upwards", () => {
    ui.pointerDownOnCanvas({ x: 75, y: 75 });
    ui.pointerMove({ x: 0, y: 0 });
    ui.pointerUp();
    expect(ids()).toEqual(["a", "b"]);
  });
});

describe("text editing", () => {
  it("starts only on rich text", () => {
    ui.doubleClickOnElement("a");
    expect(store.editingId()).toBeNull();
    ui.doubleClickOnElement("c");
    expect(store.editingId()).toBe("c");
  });

  it("ends when pressing another element", () => {
    ui.doubleClickOnElement("c");
    ui.pointerDownOnElement("a", { x: 15, y: 15 });
    expect(store.editingId()).toBeNull();
    expect(ids()).toEqual(["a"]);
  });

  it("stays while pressing inside the edited element", () => {
    ui.doubleClickOnElement("c");
    ui.pointerDownOnElement("c", { x: 15, y: 82 });
    expect(store.editingId()).toBe("c");
  });

  it("ends on escape before clearing the selection", () => {
    ui.doubleClickOnElement("c");
    ui.escape();
    expect(store.editingId()).toBeNull();
    expect(ids()).toEqual(["c"]);
    ui.escape();
    expect(ids()).toEqual([]);
  });
});

describe("only one interaction at a time", () => {
  it("never reports drag and marquee together", () => {
    ui.pointerDownOnElement("a", { x: 15, y: 15 });
    ui.pointerMove({ x: 30, y: 30 });
    expect(store.getState().interaction.kind).toBe("drag");
    ui.pointerUp();
    ui.pointerDownOnCanvas({ x: 0, y: 0 });
    ui.pointerMove({ x: 20, y: 20 });
    expect(store.getState().interaction.kind).toBe("marquee");
    ui.pointerUp();
    expect(store.getState().interaction.kind).toBe("idle");
  });

  it("ignores a move that arrives without a session", () => {
    ui.pointerMove({ x: 40, y: 40 });
    expect(store.getState().interaction.kind).toBe("idle");
    expect(at("a").x).toBe(10);
  });

  it("ignores a stray pointer up", () => {
    ui.pointerUp();
    expect(store.getState().interaction.kind).toBe("idle");
  });
});
