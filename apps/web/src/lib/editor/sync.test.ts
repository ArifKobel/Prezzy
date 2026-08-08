import type { SlideElement } from "@Prezzy/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSync, type SyncTransport } from "@/lib/editor/sync";
import { createEditorStore, type EditorStore } from "@/lib/editor/store";

interface FakeServer extends SyncTransport {
  state: Map<string, SlideElement[]>;
  calls: number;
  failEvery: number;
  delay: number;
}

function fakeServer(): FakeServer {
  const server: FakeServer = {
    state: new Map(),
    calls: 0,
    failEvery: 0,
    delay: 0,
    async putSlideElements(slideId, elements) {
      server.calls++;
      const shouldFail = server.failEvery > 0 && server.calls % server.failEvery === 0;
      const snapshot = elements.map((el) => ({ ...el }));
      if (server.delay > 0) await new Promise((resolve) => setTimeout(resolve, server.delay));
      if (shouldFail) throw new Error("network");
      server.state.set(slideId, snapshot);
    },
  };
  return server;
}

function seeded(): EditorStore {
  const store = createEditorStore();
  store.load({
    title: "Deck",
    theme: null,
    slides: [
      { id: "s1", presentationId: "p1", order: 0, title: null, createdAt: 1 },
      { id: "s2", presentationId: "p1", order: 1, title: null, createdAt: 2 },
    ],
    elements: [
      { id: "a", slideId: "s1", type: "shape", x: 10, y: 10, width: 20, height: 20, zIndex: 0, props: null, createdAt: 1 },
      { id: "b", slideId: "s2", type: "shape", x: 30, y: 30, width: 10, height: 10, zIndex: 0, props: null, createdAt: 2 },
    ],
  });
  return store;
}

const projection = (store: EditorStore, slideId: string) =>
  store.getState().elements
    .filter((el) => el.slideId === slideId)
    .map((el) => ({ id: el.id, x: el.x, y: el.y, width: el.width, height: el.height }));

const onServer = (server: FakeServer, slideId: string) =>
  (server.state.get(slideId) ?? []).map((el) => ({ id: el.id, x: el.x, y: el.y, width: el.width, height: el.height }));

let store: EditorStore;
let server: FakeServer;

beforeEach(() => {
  vi.useFakeTimers();
  store = seeded();
  server = fakeServer();
});

afterEach(() => { vi.useRealTimers(); });

async function settle(sync: { flushNow: () => Promise<void>; pending: () => Set<string> }) {
  for (let i = 0; i < 40 && sync.pending().size > 0; i++) {
    await vi.advanceTimersByTimeAsync(1200);
  }
  await sync.flushNow();
}

describe("quiet start", () => {
  it("sends nothing when the document does not change", async () => {
    const sync = createSync(store, server, { debounceMs: 10 });
    await vi.advanceTimersByTimeAsync(100);
    expect(server.calls).toBe(0);
    sync.stop();
  });
});

describe("happy path", () => {
  it("sends only the slide that changed", async () => {
    const sync = createSync(store, server, { debounceMs: 10 });
    store.moveElements([{ id: "a", x: 40, y: 40 }]);
    await settle(sync);
    expect(onServer(server, "s1")).toEqual(projection(store, "s1"));
    expect(server.state.has("s2")).toBe(false);
    sync.stop();
  });

  it("collapses a burst of edits into one request", async () => {
    const sync = createSync(store, server, { debounceMs: 50 });
    for (let i = 0; i < 20; i++) store.moveElements([{ id: "a", x: i, y: i }]);
    await settle(sync);
    expect(server.calls).toBe(1);
    expect(onServer(server, "s1")).toEqual(projection(store, "s1"));
    sync.stop();
  });

  it("reports idle once everything landed", async () => {
    const sync = createSync(store, server, { debounceMs: 10 });
    store.moveElements([{ id: "a", x: 12, y: 12 }]);
    await settle(sync);
    expect(sync.status()).toBe("idle");
    expect(sync.pending().size).toBe(0);
    sync.stop();
  });
});

describe("under failure", () => {
  it("converges when every second request fails", async () => {
    server.failEvery = 2;
    const sync = createSync(store, server, { debounceMs: 10, retryMs: 10 });
    store.moveElements([{ id: "a", x: 25, y: 25 }]);
    store.addElement({ type: "shape", x: 1, y: 1, width: 5, height: 5 });
    await settle(sync);
    expect(onServer(server, "s1")).toEqual(projection(store, "s1"));
    sync.stop();
  });

  it("converges when every request but the last fails", async () => {
    server.failEvery = 1;
    const sync = createSync(store, server, { debounceMs: 10, retryMs: 10 });
    store.moveElements([{ id: "a", x: 60, y: 60 }]);
    await vi.advanceTimersByTimeAsync(200);
    expect(sync.status()).toBe("error");
    server.failEvery = 0;
    await settle(sync);
    expect(onServer(server, "s1")).toEqual(projection(store, "s1"));
    expect(sync.status()).toBe("idle");
    sync.stop();
  });

  it("keeps the slide pending while it fails", async () => {
    server.failEvery = 1;
    const sync = createSync(store, server, { debounceMs: 10, retryMs: 10 });
    store.moveElements([{ id: "a", x: 33, y: 33 }]);
    await vi.advanceTimersByTimeAsync(100);
    expect(sync.pending().has("s1")).toBe(true);
    sync.stop();
  });
});

describe("edits during a slow request", () => {
  it("does not lose an edit made while the request was in flight", async () => {
    server.delay = 50;
    const sync = createSync(store, server, { debounceMs: 10, retryMs: 10 });
    store.moveElements([{ id: "a", x: 20, y: 20 }]);
    await vi.advanceTimersByTimeAsync(15);
    store.moveElements([{ id: "a", x: 70, y: 70 }]);
    await settle(sync);
    expect(onServer(server, "s1")).toEqual(projection(store, "s1"));
    sync.stop();
  });
});

describe("shape of the payload", () => {
  it("sends the full desired state, not a delta", async () => {
    const sync = createSync(store, server, { debounceMs: 10 });
    store.addElement({ type: "shape", x: 1, y: 1, width: 5, height: 5 });
    await settle(sync);
    expect(server.state.get("s1")).toHaveLength(2);
    sync.stop();
  });

  it("sends an empty list when the last element goes", async () => {
    const sync = createSync(store, server, { debounceMs: 10 });
    store.removeElements(["a"]);
    await settle(sync);
    expect(server.state.get("s1")).toEqual([]);
    sync.stop();
  });

  it("ends up matching the document after a random sequence", async () => {
    server.failEvery = 3;
    const sync = createSync(store, server, { debounceMs: 5, retryMs: 5 });
    const created: string[] = [];
    for (let i = 0; i < 30; i++) {
      const roll = i % 5;
      if (roll === 0) {
        const id = store.addElement({ type: "shape", x: i, y: i, width: 5, height: 5 });
        if (id) created.push(id);
      } else if (roll === 1 && created.length > 0) {
        store.removeElements([created.pop()!]);
      } else {
        store.moveElements([{ id: "a", x: i % 90, y: (i * 3) % 90 }]);
      }
      await vi.advanceTimersByTimeAsync(3);
    }
    await settle(sync);
    expect(onServer(server, "s1")).toEqual(projection(store, "s1"));
    sync.stop();
  });
});

describe("stopping", () => {
  it("sends nothing after stop", async () => {
    const sync = createSync(store, server, { debounceMs: 10 });
    sync.stop();
    store.moveElements([{ id: "a", x: 45, y: 45 }]);
    await vi.advanceTimersByTimeAsync(200);
    expect(server.calls).toBe(0);
  });
});
