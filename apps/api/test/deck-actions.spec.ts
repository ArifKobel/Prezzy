import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { DeckService } from "@/deck-actions/deck.service";
import { ElementActionsService } from "@/deck-actions/element-actions.service";
import { SlideActionsService } from "@/deck-actions/slide-actions.service";
import { slideElements } from "@/db/schema";
import { type Seed, seed } from "./support/seed";
import { createTestApp } from "./support/test-app";
import { type TestDatabase, openTestDatabase, resetTestDatabase } from "./support/test-database";

let database: TestDatabase;
let app: INestApplication;
let deck: DeckService;
let slides: SlideActionsService;
let elements: ElementActionsService;
let fixture: Seed;

beforeAll(async () => {
  database = openTestDatabase();
  app = await createTestApp(database.db);
  deck = app.get(DeckService);
  slides = app.get(SlideActionsService);
  elements = app.get(ElementActionsService);
});

afterAll(async () => {
  await app.close();
  await database.client.end();
});

beforeEach(async () => {
  await resetTestDatabase(database.client);
  fixture = await seed(database.db);
});

const rowsOf = (slideId: string) =>
  database.db.select().from(slideElements).where(eq(slideElements.slideId, slideId));

describe("slide content", () => {
  it("atomically replaces slide content with contiguous local z-indexes", async () => {
    const response = await slides.setContent(fixture.ownerId, fixture.presentationId, fixture.slideA, [
      { type: "shape", x: 5, y: 5, width: 90, height: 90, props: { color: "surface" } },
      { type: "heading", x: 10, y: 10, width: 80, height: 20, props: { content: "<p>Hello</p>", fontSize: 40 } },
    ]);

    expect(response.zIndices).toEqual([0, 1]);
    const rows = await rowsOf(fixture.slideA);
    expect(rows.map((row) => row.zIndex)).toEqual([0, 1]);
    expect(rows[1].props).toMatchObject({ fontSize: 40 });
  });

  it("returns diagnostics for content the renderer cannot honour", async () => {
    const response = await slides.setContent(fixture.ownerId, fixture.presentationId, fixture.slideA, [
      { type: "shape", x: 95, y: 5, width: 20, height: 10, props: { content: "<p>nope</p>" } },
    ]);

    expect(response.warnings).toEqual([
      "Element 0: Element extends outside the slide bounds (0-100 percent). It will be clipped.",
      "Element 0: Prop content is ignored for shape elements.",
    ]);
  });

  it("creates a complete semantic layout in one mutation", async () => {
    const response = await slides.addLayout(fixture.ownerId, fixture.presentationId, {
      layout: "cards-grid",
      title: "Cards",
      items: [
        { title: "One", body: "First" },
        { title: "Two", body: "Second" },
      ],
    });

    const rows = await rowsOf(response.slideId);
    expect(rows.length).toBeGreaterThan(4);
    expect(rows.map((row) => row.zIndex)).toEqual(rows.map((_, index) => index));
  });
});

describe("guards", () => {
  it("rejects an unknown slide", async () => {
    await expect(
      slides.setContent(fixture.ownerId, fixture.presentationId, randomUUID(), []),
    ).rejects.toMatchObject({ status: 404 });
    await expect(slides.update(fixture.ownerId, fixture.presentationId, randomUUID(), { title: "x" })).rejects.toMatchObject({ status: 404 });
    await expect(
      elements.add(fixture.ownerId, fixture.presentationId, {
        slideId: randomUUID(),
        type: "shape",
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("rejects an unknown element", async () => {
    await expect(
      elements.update(fixture.ownerId, fixture.presentationId, randomUUID(), { position: { x: 1, y: 1 } }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("rejects a foreign presentation before touching the document", async () => {
    await expect(deck.get(fixture.otherId, fixture.presentationId)).rejects.toBeDefined();
  });

  it("keeps the last slide", async () => {
    await slides.remove(fixture.ownerId, fixture.presentationId, fixture.slideB);
    await expect(slides.remove(fixture.ownerId, fixture.presentationId, fixture.slideA)).rejects.toMatchObject({
      status: 400,
    });
  });

  it("requires a complete permutation when reordering", async () => {
    await expect(
      slides.reorder(fixture.ownerId, fixture.presentationId, [fixture.slideA]),
    ).rejects.toMatchObject({ status: 400 });

    const reordered = await slides.reorder(fixture.ownerId, fixture.presentationId, [
      fixture.slideB,
      fixture.slideA,
    ]);
    expect(reordered.slideIds).toEqual([fixture.slideB, fixture.slideA]);
    const after = await deck.get(fixture.ownerId, fixture.presentationId);
    expect(after.slides.map((slide) => slide.id)).toEqual([fixture.slideB, fixture.slideA]);
  });
});

describe("element stacking", () => {
  it("clamps a requested z-index and reports the authoritative one", async () => {
    await elements.add(fixture.ownerId, fixture.presentationId, {
      slideId: fixture.slideA,
      type: "shape",
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    const front = await elements.add(fixture.ownerId, fixture.presentationId, {
      slideId: fixture.slideA,
      type: "shape",
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      zIndex: 99,
    });

    expect(front.zIndex).toBe(1);
    const moved = await elements.update(fixture.ownerId, fixture.presentationId, front.elementId, {
      order: "back",
    });
    expect(moved.zIndex).toBe(0);
  });
});
