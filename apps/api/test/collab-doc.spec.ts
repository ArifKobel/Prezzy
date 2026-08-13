import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as awarenessProtocol from "y-protocols/awareness";
import * as Y from "yjs";
import { setTitle as setSharedTitle } from "@Prezzy/editor-doc";
import { DocRegistryService } from "@/collab/doc-registry.service";
import { readDoc } from "@/collab/doc-schema";
import { presentationDocs, presentations, slideElements, slides } from "@/db/schema";
import { type Seed, seed } from "./support/seed";
import { createTestApp } from "./support/test-app";
import { type TestDatabase, openTestDatabase, resetTestDatabase } from "./support/test-database";

let database: TestDatabase;
let app: INestApplication;
let registry: DocRegistryService;
let fixture: Seed;

beforeAll(async () => {
  database = openTestDatabase();
  app = await createTestApp(database.db);
  registry = app.get(DocRegistryService);
});

afterAll(async () => {
  await app.close();
  await database.client.end();
});

beforeEach(async () => {
  await resetTestDatabase(database.client);
  fixture = await seed(database.db);
});

const setTitle = (doc: Y.Doc, title: string) => {
  Y.transact(doc, () => {
    doc.getMap<unknown>("meta").set("title", title);
  });
};

const addElement = (doc: Y.Doc, id: string, slideId: string, x: number) => {
  Y.transact(doc, () => {
    const element = new Y.Map<unknown>();
    element.set("slideId", slideId);
    element.set("type", "text");
    element.set("x", x);
    element.set("y", 5);
    element.set("width", 20);
    element.set("height", 10);
    element.set("zIndex", 0);
    element.set("createdAt", Date.now());
    const props = new Y.Map<unknown>();
    props.set("content", "<p>hi</p>");
    element.set("props", props);
    doc.getMap<Y.Map<unknown>>("elements").set(id, element);
  });
};

const removeSlide = (doc: Y.Doc, slideId: string) => {
  Y.transact(doc, () => {
    doc.getMap<Y.Map<unknown>>("slides").delete(slideId);
  });
};

describe("hydration", () => {
  it("builds the doc from existing rows on first connect", async () => {
    const elementId = randomUUID();
    await database.db.insert(slideElements).values({
      id: elementId,
      slideId: fixture.slideA,
      type: "text",
      x: 1,
      y: 2,
      width: 30,
      height: 10,
      zIndex: 0,
      props: { content: "<p>seeded</p>" },
    });

    const doc = await registry.connect(fixture.presentationId, "s1");
    const content = readDoc(doc);
    expect(content.title).toBe("Deck");
    expect(content.slides.map((slide) => slide.id)).toEqual([fixture.slideA, fixture.slideB]);
    expect(content.elements).toHaveLength(1);
    expect(content.elements[0]).toMatchObject({ id: elementId, x: 1, props: { content: "<p>seeded</p>" } });
    await registry.disconnect(fixture.presentationId, "s1");
  });
});

describe("materialization", () => {
  it("leases, mutates, and persists a closed doc", async () => {
    await registry.withDoc(fixture.presentationId, (doc: Y.Doc) => setSharedTitle(doc, "Agent edit"));

    const [presentation] = await database.db
      .select()
      .from(presentations)
      .where(eq(presentations.id, fixture.presentationId));
    expect(presentation.title).toBe("Agent edit");
    expect(await registry.docFor(fixture.presentationId)).toBeNull();
  });

  it("releases its lease when a mutation fails", async () => {
    await expect(
      registry.withDoc(fixture.presentationId, () => {
        throw new Error("failed edit");
      }),
    ).rejects.toThrow("failed edit");

    expect(await registry.docFor(fixture.presentationId)).toBeNull();
  });

  it("writes doc edits back to rows and stores the doc state", async () => {
    const elementId = randomUUID();
    const doc = await registry.connect(fixture.presentationId, "s1");
    setTitle(doc, "Renamed");
    addElement(doc, elementId, fixture.slideA, 42);
    await registry.disconnect(fixture.presentationId, "s1");

    const [presentation] = await database.db
      .select()
      .from(presentations)
      .where(eq(presentations.id, fixture.presentationId));
    expect(presentation.title).toBe("Renamed");

    const rows = await database.db
      .select()
      .from(slideElements)
      .where(eq(slideElements.slideId, fixture.slideA));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: elementId, x: 42, props: { content: "<p>hi</p>" } });

    const [stored] = await database.db
      .select()
      .from(presentationDocs)
      .where(eq(presentationDocs.presentationId, fixture.presentationId));
    expect(stored).toBeDefined();
    expect(stored.state.length).toBeGreaterThan(0);
  });

  it("removes rows for slides deleted in the doc", async () => {
    const doc = await registry.connect(fixture.presentationId, "s1");
    removeSlide(doc, fixture.slideB);
    await registry.disconnect(fixture.presentationId, "s1");

    const rows = await database.db
      .select()
      .from(slides)
      .where(eq(slides.presentationId, fixture.presentationId));
    expect(rows.map((row) => row.id)).toEqual([fixture.slideA]);
  });
});

describe("awareness", () => {
  it("tracks peer states and clears them when their socket disconnects", async () => {
    await registry.connect(fixture.presentationId, "s1");
    await registry.connect(fixture.presentationId, "s2");

    const peerDoc = new Y.Doc();
    const peer = new awarenessProtocol.Awareness(peerDoc);
    peer.setLocalStateField("user", { name: "Peer" });
    await registry.applyAwareness(
      fixture.presentationId,
      awarenessProtocol.encodeAwarenessUpdate(peer, [peerDoc.clientID]),
      "s2",
    );

    let states = await registry.awarenessStates(fixture.presentationId);
    expect(states?.size).toBe(1);
    expect([...(states?.values() ?? [])][0]).toMatchObject({ user: { name: "Peer" } });

    await registry.disconnect(fixture.presentationId, "s2");
    states = await registry.awarenessStates(fixture.presentationId);
    expect(states?.size).toBe(0);

    await registry.disconnect(fixture.presentationId, "s1");
    peer.destroy();
    peerDoc.destroy();
  });
});

describe("reload", () => {
  it("restores the doc from the stored state instead of rehydrating", async () => {
    const elementId = randomUUID();
    const first = await registry.connect(fixture.presentationId, "s1");
    setTitle(first, "Edited");
    addElement(first, elementId, fixture.slideA, 7);
    await registry.disconnect(fixture.presentationId, "s1");

    const second = await registry.connect(fixture.presentationId, "s2");
    const content = readDoc(second);
    expect(content.title).toBe("Edited");
    expect(content.slides).toHaveLength(2);
    expect(content.elements.map((element) => element.id)).toEqual([elementId]);
    await registry.disconnect(fixture.presentationId, "s2");
  });
});
