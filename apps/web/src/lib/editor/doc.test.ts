import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import {
  addElement,
  addSlide,
  duplicateSlide,
  moveElements,
  removeElements,
  removeSlide,
  reorderElement,
  reorderSlides,
  setGeometry,
  setProps,
  setTheme,
} from "@/lib/editor/commands";
import { LOCAL_ORIGIN, createDoc, elementsOfSlide, loadDoc, snapshot } from "@/lib/editor/doc";

function undoManager(doc: Y.Doc) {
  return new Y.UndoManager(
    [doc.getMap("meta"), doc.getMap("slides"), doc.getMap("elements")],
    { trackedOrigins: new Set([LOCAL_ORIGIN]), captureTimeout: 0 },
  );
}

function seed() {
  const doc = createDoc();
  loadDoc(doc, {
    title: "Deck",
    theme: null,
    slides: [
      { id: "s1", presentationId: "p1", order: 0, title: "One", createdAt: 1 },
      { id: "s2", presentationId: "p1", order: 1, title: "Two", createdAt: 2 },
    ],
    elements: [
      { id: "e1", slideId: "s1", type: "heading", x: 5, y: 5, width: 40, height: 10, zIndex: 0, props: { content: "<p>A</p>" }, createdAt: 1 },
      { id: "e2", slideId: "s1", type: "text", x: 5, y: 20, width: 40, height: 10, zIndex: 1, props: { content: "<p>B</p>" }, createdAt: 2 },
      { id: "e3", slideId: "s1", type: "shape", x: 50, y: 20, width: 20, height: 20, zIndex: 2, props: { color: "#fff" }, createdAt: 3 },
      { id: "e4", slideId: "s2", type: "text", x: 5, y: 5, width: 30, height: 10, zIndex: 0, props: null, createdAt: 4 },
    ],
  });
  return doc;
}

const zIndices = (doc: Y.Doc, slideId: string) =>
  elementsOfSlide(doc, slideId).map((el) => el.zIndex);

const orders = (doc: Y.Doc) => snapshot(doc).slides.map((s) => s.order);

describe("loading", () => {
  it("round-trips slides and elements", () => {
    const doc = seed();
    const snap = snapshot(doc);
    expect(snap.slides.map((s) => s.id)).toEqual(["s1", "s2"]);
    expect(snap.elements).toHaveLength(4);
    expect(elementsOfSlide(doc, "s1").map((e) => e.id)).toEqual(["e1", "e2", "e3"]);
  });

  it("does not put loading into the undo stack", () => {
    const doc = createDoc();
    const undo = undoManager(doc);
    loadDoc(doc, { title: "Deck", theme: null, slides: [], elements: [] });
    expect(undo.canUndo()).toBe(false);
  });
});

describe("undo and redo", () => {
  const cases: Array<[string, (doc: Y.Doc) => void]> = [
    ["move", (doc) => moveElements(doc, [{ id: "e1", x: 40, y: 60 }])],
    ["multi move", (doc) => moveElements(doc, [{ id: "e1", x: 11, y: 12 }, { id: "e2", x: 13, y: 14 }])],
    ["resize", (doc) => setGeometry(doc, "e2", { x: 1, y: 2, width: 3, height: 4 })],
    ["props", (doc) => setProps(doc, "e3", { color: "#000", opacity: 50 })],
    ["clear a prop", (doc) => setProps(doc, "e1", { content: null as never })],
    ["add element", (doc) => addElement(doc, { slideId: "s1", type: "shape", x: 1, y: 1, width: 5, height: 5 })],
    ["remove elements", (doc) => removeElements(doc, ["e1", "e2"])],
    ["reorder element", (doc) => reorderElement(doc, "e1", "front")],
    ["add slide", (doc) => addSlide(doc, "s1")],
    ["remove slide", (doc) => removeSlide(doc, "s1")],
    ["duplicate slide", (doc) => duplicateSlide(doc, "s1", 99)],
    ["reorder slides", (doc) => reorderSlides(doc, ["s2", "s1"])],
    ["theme", (doc) => setTheme(doc, { primaryColor: "#123456" })],
  ];

  it.each(cases)("%s restores the document exactly", (_name, run) => {
    const doc = seed();
    const undo = undoManager(doc);
    const before = JSON.stringify(snapshot(doc));

    run(doc);
    expect(JSON.stringify(snapshot(doc))).not.toBe(before);

    undo.undo();
    expect(JSON.stringify(snapshot(doc))).toBe(before);
  });

  it.each(cases)("%s is exactly one undo step", (_name, run) => {
    const doc = seed();
    const undo = undoManager(doc);
    run(doc);
    expect(undo.undoStack).toHaveLength(1);
  });

  it.each(cases)("%s survives undo then redo", (_name, run) => {
    const doc = seed();
    const undo = undoManager(doc);
    run(doc);
    const after = JSON.stringify(snapshot(doc));

    undo.undo();
    undo.redo();
    expect(JSON.stringify(snapshot(doc))).toBe(after);
  });
});

describe("z-index stays a permutation", () => {
  it.each(["front", "back", "forward", "backward"] as const)("after %s", (action) => {
    const doc = seed();
    reorderElement(doc, "e1", action);
    expect(zIndices(doc, "s1")).toEqual([0, 1, 2]);
  });

  it("after adding and removing", () => {
    const doc = seed();
    addElement(doc, { slideId: "s1", type: "shape", x: 0, y: 0, width: 1, height: 1 });
    expect(zIndices(doc, "s1")).toEqual([0, 1, 2, 3]);
    removeElements(doc, ["e2"]);
    expect(zIndices(doc, "s1")).toEqual([0, 1, 2]);
  });

  it("moves the element to the intended position", () => {
    const doc = seed();
    reorderElement(doc, "e1", "front");
    expect(elementsOfSlide(doc, "s1").map((e) => e.id)).toEqual(["e2", "e3", "e1"]);
    reorderElement(doc, "e1", "back");
    expect(elementsOfSlide(doc, "s1").map((e) => e.id)).toEqual(["e1", "e2", "e3"]);
  });

  it("does not disturb another slide", () => {
    const doc = seed();
    reorderElement(doc, "e1", "front");
    expect(zIndices(doc, "s2")).toEqual([0]);
  });
});

describe("slide order stays unique and contiguous", () => {
  it("after inserting in the middle", () => {
    const doc = seed();
    addSlide(doc, "s1", 10);
    expect(orders(doc)).toEqual([0, 1, 2]);
    expect(snapshot(doc).slides.map((s) => s.id)[1]).not.toBe("s2");
  });

  it("after duplicating twice", () => {
    const doc = seed();
    duplicateSlide(doc, "s1", 10);
    duplicateSlide(doc, "s1", 20);
    expect(orders(doc)).toEqual([0, 1, 2, 3]);
  });

  it("after removing", () => {
    const doc = seed();
    removeSlide(doc, "s1");
    expect(orders(doc)).toEqual([0]);
  });

  it("after an explicit reorder", () => {
    const doc = seed();
    reorderSlides(doc, ["s2", "s1"]);
    expect(snapshot(doc).slides.map((s) => s.id)).toEqual(["s2", "s1"]);
    expect(orders(doc)).toEqual([0, 1]);
  });
});

describe("structural integrity", () => {
  it("removing a slide removes its elements and only those", () => {
    const doc = seed();
    removeSlide(doc, "s1");
    const snap = snapshot(doc);
    expect(snap.elements.map((e) => e.id)).toEqual(["e4"]);
  });

  it("duplicating a slide copies elements under fresh ids", () => {
    const doc = seed();
    const copyId = duplicateSlide(doc, "s1", 50);
    const copies = elementsOfSlide(doc, copyId);
    expect(copies).toHaveLength(3);
    expect(copies.map((e) => e.id)).not.toContain("e1");
    expect(copies.map((e) => e.props?.content)).toEqual(["<p>A</p>", "<p>B</p>", undefined]);
  });

  it("editing a duplicate does not touch the original", () => {
    const doc = seed();
    const copyId = duplicateSlide(doc, "s1", 50);
    const copy = elementsOfSlide(doc, copyId)[0];
    setProps(doc, copy.id, { content: "<p>changed</p>" });
    expect(elementsOfSlide(doc, "s1")[0].props?.content).toBe("<p>A</p>");
  });

  it("commands on a missing element are a no-op, not a throw", () => {
    const doc = seed();
    const before = JSON.stringify(snapshot(doc));
    setGeometry(doc, "gone", { x: 1, y: 1, width: 1, height: 1 });
    setProps(doc, "gone", { color: "#000" });
    reorderElement(doc, "gone", "front");
    moveElements(doc, [{ id: "gone", x: 1, y: 1 }]);
    removeElements(doc, ["gone"]);
    expect(JSON.stringify(snapshot(doc))).toBe(before);
  });
});

describe("remote changes", () => {
  it("are not undoable by the local user", () => {
    const doc = seed();
    const undo = undoManager(doc);
    loadDoc(doc, { title: "Replaced", theme: null, slides: [], elements: [] });
    expect(undo.canUndo()).toBe(false);
    expect(snapshot(doc).title).toBe("Replaced");
  });

  it("do not discard local undo history", () => {
    const doc = seed();
    const undo = undoManager(doc);
    moveElements(doc, [{ id: "e1", x: 90, y: 90 }]);
    Y.transact(doc, () => { doc.getMap("meta").set("title", "From elsewhere"); }, Symbol("other"));
    expect(undo.undoStack).toHaveLength(1);
  });
});
