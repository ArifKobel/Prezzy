import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEditorStore, type EditorStore } from "@/lib/editor/store";

function seeded(): EditorStore {
  const store = createEditorStore();
  store.load({
    title: "Deck",
    theme: null,
    slides: [
      { id: "s1", presentationId: "p1", order: 0, title: "One", bg: null, createdAt: 1 },
      { id: "s2", presentationId: "p1", order: 1, title: "Two", bg: null, createdAt: 2 },
    ],
    elements: [
      { id: "e1", slideId: "s1", type: "heading", x: 5, y: 5, width: 40, height: 10, zIndex: 0, props: { content: "<p>A</p>" }, createdAt: 1 },
      { id: "e2", slideId: "s1", type: "text", x: 5, y: 20, width: 40, height: 10, zIndex: 1, props: null, createdAt: 2 },
      { id: "e3", slideId: "s2", type: "shape", x: 5, y: 5, width: 10, height: 10, zIndex: 0, props: null, createdAt: 3 },
    ],
  });
  return store;
}

let store: EditorStore;
beforeEach(() => { store = seeded(); });

describe("snapshot identity", () => {
  it("is stable while nothing changes", () => {
    expect(store.getState()).toBe(store.getState());
  });

  it("changes when the document changes", () => {
    const before = store.getState();
    store.moveElements([{ id: "e1", x: 30, y: 30 }]);
    expect(store.getState()).not.toBe(before);
  });

  it("changes when only the selection changes", () => {
    const before = store.getState();
    store.select("e1");
    expect(store.getState()).not.toBe(before);
    expect(store.getState().elements).toEqual(before.elements);
  });

  it("notifies subscribers once per change", () => {
    const listener = vi.fn();
    store.subscribe(listener);
    store.select("e1");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    store.subscribe(listener)();
    store.select("e1");
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("active slide", () => {
  it("defaults to the first slide", () => {
    expect(store.getState().activeSlideId).toBe("s1");
  });

  it("only exposes elements of the active slide", () => {
    expect(store.slideElements().map((el) => el.id)).toEqual(["e1", "e2"]);
    store.setActiveSlide("s2");
    expect(store.slideElements().map((el) => el.id)).toEqual(["e3"]);
  });

  it("drops the selection when switching", () => {
    store.select("e1");
    store.setActiveSlide("s2");
    expect(store.getState().selectedIds.size).toBe(0);
  });

  it("falls back to another slide when the active one is removed", () => {
    store.removeSlide("s1");
    expect(store.getState().activeSlideId).toBe("s2");
  });

  it("refuses to remove the last slide", () => {
    store.removeSlide("s1");
    store.removeSlide("s2");
    expect(store.getState().slides).toHaveLength(1);
  });

  it("selects a newly added slide", () => {
    const id = store.addSlide("s1");
    expect(store.getState().activeSlideId).toBe(id);
  });

  it("selects a duplicated slide", () => {
    const id = store.duplicateSlide("s1");
    expect(store.getState().activeSlideId).toBe(id);
    expect(store.slideElements()).toHaveLength(2);
  });
});

describe("selection", () => {
  it("replaces on select and accumulates on toggle", () => {
    store.select("e1");
    store.toggleSelection("e2");
    expect([...store.getState().selectedIds].sort()).toEqual(["e1", "e2"]);
    store.toggleSelection("e2");
    expect([...store.getState().selectedIds]).toEqual(["e1"]);
  });

  it("never keeps an id that no longer exists", () => {
    store.selectMany(["e1", "e2"]);
    store.removeElements(["e1"]);
    expect([...store.getState().selectedIds]).toEqual(["e2"]);
  });

  it("survives an undo that removes the element again", () => {
    store.selectMany(["e1"]);
    const added = store.addElement({ type: "shape", x: 0, y: 0, width: 5, height: 5 });
    expect([...store.getState().selectedIds]).toEqual([added]);
    store.undo();
    expect(store.getState().selectedIds.has(added!)).toBe(false);
  });

  it("clears when the interaction target disappears", () => {
    store.startEditing("e1");
    store.removeElements(["e1"]);
    expect(store.getState().interaction.kind).toBe("idle");
  });
});

describe("undo", () => {
  it("reports availability", () => {
    expect(store.getState().canUndo).toBe(false);
    store.moveElements([{ id: "e1", x: 40, y: 40 }]);
    expect(store.getState().canUndo).toBe(true);
    store.undo();
    expect(store.getState().canUndo).toBe(false);
    expect(store.getState().canRedo).toBe(true);
  });

  it("does not treat loading as an undoable step", () => {
    store.moveElements([{ id: "e1", x: 40, y: 40 }]);
    store.load({ title: "Fresh", theme: null, slides: [], elements: [] });
    expect(store.getState().canUndo).toBe(false);
  });

  it("restores a removed element", () => {
    store.removeElements(["e1"]);
    expect(store.getState().elements.map((e) => e.id)).toEqual(["e2", "e3"]);
    store.undo();
    expect(store.getState().elements.map((e) => e.id).sort()).toEqual(["e1", "e2", "e3"]);
  });
});

describe("interaction", () => {
  it("goes back to idle when ended", () => {
    store.beginInteraction({
      kind: "drag",
      ids: ["e1"],
      moved: false,
      positions: new Map(),
      snapLines: { vLines: [], hLines: [] },
    });
    expect(store.getState().interaction.kind).toBe("drag");
    store.endInteraction();
    expect(store.getState().interaction.kind).toBe("idle");
  });

  it("reports the element being edited", () => {
    expect(store.editingId()).toBeNull();
    store.startEditing("e2");
    expect(store.editingId()).toBe("e2");
    store.stopEditing();
    expect(store.editingId()).toBeNull();
  });

  it("selects the element it starts editing", () => {
    store.startEditing("e2");
    expect([...store.getState().selectedIds]).toEqual(["e2"]);
  });
});

describe("elements", () => {
  it("adds to the active slide and selects the result", () => {
    store.setActiveSlide("s2");
    const id = store.addElement({ type: "shape", x: 1, y: 1, width: 5, height: 5 });
    expect(store.slideElements().map((e) => e.id)).toContain(id);
    expect([...store.getState().selectedIds]).toEqual([id]);
  });

  it("duplicates with an offset and keeps the props", () => {
    const id = store.duplicateElement("e1");
    const copy = store.getState().elements.find((e) => e.id === id)!;
    expect(copy.x).toBe(8);
    expect(copy.props?.content).toBe("<p>A</p>");
  });

  it("removes everything selected", () => {
    store.selectMany(["e1", "e2"]);
    store.removeSelected();
    expect(store.slideElements()).toHaveLength(0);
    expect(store.getState().selectedIds.size).toBe(0);
  });
});
