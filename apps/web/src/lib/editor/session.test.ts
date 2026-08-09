import type { Slide, SlideElement } from "@Prezzy/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type EditorSession, type SessionTransport, createEditorSession } from "@/lib/editor/session";
import { createEditorStore, type EditorStore } from "@/lib/editor/store";

interface FakeTransport extends SessionTransport {
  state: Map<string, SlideElement[]>;
  putCalls: number;
  getCalls: number;
  getDelay: number;
}

function fakeTransport(): FakeTransport {
  const transport: FakeTransport = {
    state: new Map(),
    putCalls: 0,
    getCalls: 0,
    getDelay: 0,
    async putSlideElements(slideId, elements) {
      transport.putCalls++;
      transport.state.set(slideId, elements.map((el) => ({ ...el })));
    },
    async getSlideElements(slideId) {
      transport.getCalls++;
      if (transport.getDelay > 0) await new Promise((resolve) => setTimeout(resolve, transport.getDelay));
      return (transport.state.get(slideId) ?? []).map((el) => ({ ...el }));
    },
  };
  return transport;
}

const slide = (id: string, order: number): Slide => ({
  id, presentationId: "p1", order, title: null, bg: null, createdAt: order,
});

const element = (id: string, slideId: string, x: number): SlideElement => ({
  id, slideId, type: "shape", x, y: 10, width: 20, height: 20, zIndex: 0, props: null, createdAt: 1,
});

const positionOf = (store: EditorStore, id: string) =>
  store.getState().elements.find((el) => el.id === id)?.x;

let store: EditorStore;
let transport: FakeTransport;
let session: EditorSession;

beforeEach(() => {
  vi.useFakeTimers();
  store = createEditorStore();
  transport = fakeTransport();
  session = createEditorSession(store, transport, { debounceMs: 10, retryMs: 10 });
  session.load({
    title: "Deck",
    theme: null,
    slides: [slide("s1", 0), slide("s2", 1)],
    elements: [element("a", "s1", 10), element("b", "s2", 30)],
  });
  transport.state.set("s1", [element("a", "s1", 10)]);
  transport.state.set("s2", [element("b", "s2", 30)]);
});

afterEach(() => { vi.useRealTimers(); });

describe("load", () => {
  it("baselines the loaded state instead of writing it back", async () => {
    await vi.advanceTimersByTimeAsync(100);
    expect(transport.putCalls).toBe(0);
  });
});

describe("adoptSlide", () => {
  it("brings a server slide and its elements into the doc without echoing them back", async () => {
    transport.state.set("s3", [element("c", "s3", 5)]);
    await session.adoptSlide(slide("s3", 2));
    expect(store.getState().slides.map((s) => s.id)).toContain("s3");
    expect(positionOf(store, "c")).toBe(5);
    await vi.advanceTimersByTimeAsync(100);
    expect(transport.putCalls).toBe(0);
  });

  it("fetches once when adopted twice concurrently", async () => {
    transport.getDelay = 50;
    transport.state.set("s3", [element("c", "s3", 5)]);
    void session.adoptSlide(slide("s3", 2));
    void session.adoptSlide(slide("s3", 2));
    await vi.advanceTimersByTimeAsync(100);
    expect(transport.getCalls).toBe(1);
    expect(positionOf(store, "c")).toBe(5);
  });

  it("only updates slide fields when the slide is already present", async () => {
    await session.adoptSlide({ ...slide("s1", 0), title: "renamed" });
    expect(transport.getCalls).toBe(0);
    expect(store.getState().slides[0]?.title).toBe("renamed");
  });
});

describe("refreshSlide", () => {
  it("applies the server state when there are no local edits", async () => {
    transport.state.set("s1", [element("a", "s1", 77)]);
    session.refreshSlide("s1");
    await vi.advanceTimersByTimeAsync(1);
    expect(positionOf(store, "a")).toBe(77);
  });

  it("does not fetch while the slide has unsent local edits", async () => {
    store.moveElements([{ id: "a", x: 55, y: 55 }]);
    transport.state.set("s1", [element("a", "s1", 77)]);
    session.refreshSlide("s1");
    await vi.advanceTimersByTimeAsync(1);
    expect(transport.getCalls).toBe(0);
    expect(positionOf(store, "a")).toBe(55);
  });

  it("drops a stale response when a local edit lands while the fetch is in flight", async () => {
    transport.getDelay = 50;
    transport.state.set("s1", [element("a", "s1", 77)]);
    session.refreshSlide("s1");
    await vi.advanceTimersByTimeAsync(10);
    store.moveElements([{ id: "a", x: 55, y: 55 }]);
    await vi.advanceTimersByTimeAsync(200);
    expect(positionOf(store, "a")).toBe(55);
    expect(transport.state.get("s1")?.[0]?.x).toBe(55);
  });

  it("fetches once for a burst of change events", async () => {
    transport.getDelay = 50;
    session.refreshSlide("s1");
    session.refreshSlide("s1");
    session.refreshSlide("s1");
    await vi.advanceTimersByTimeAsync(100);
    expect(transport.getCalls).toBe(1);
  });
});

describe("syncSlides", () => {
  it("removes deleted slides with their elements and adopts unknown ones", async () => {
    transport.state.set("s3", [element("c", "s3", 5)]);
    session.syncSlides([slide("s1", 0), slide("s3", 1)]);
    await vi.advanceTimersByTimeAsync(100);
    const state = store.getState();
    expect(state.slides.map((s) => s.id)).toEqual(["s1", "s3"]);
    expect(state.elements.map((el) => el.id).sort()).toEqual(["a", "c"]);
  });

  it("keeps local element edits on surviving slides", async () => {
    store.moveElements([{ id: "a", x: 61, y: 61 }]);
    session.syncSlides([slide("s1", 0), slide("s2", 1)]);
    expect(positionOf(store, "a")).toBe(61);
  });
});

describe("dispose", () => {
  it("flushes outstanding edits before stopping", async () => {
    store.moveElements([{ id: "a", x: 42, y: 42 }]);
    await session.dispose();
    expect(transport.state.get("s1")?.[0]?.x).toBe(42);
  });

  it("writes nothing after being disposed", async () => {
    await session.dispose();
    const putCalls = transport.putCalls;
    store.moveElements([{ id: "a", x: 99, y: 99 }]);
    await vi.advanceTimersByTimeAsync(100);
    expect(transport.putCalls).toBe(putCalls);
  });
});
