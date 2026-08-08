import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type SlideElementRow, audienceResponses, slideElements } from "@/db/schema";
import type { ElementProps, ElementType } from "@/shared";
import { type Seed, seed } from "./support/seed";
import { createTestApp, sessionCookie } from "./support/test-app";
import { type TestDatabase, openTestDatabase, resetTestDatabase } from "./support/test-database";

let database: TestDatabase;
let app: INestApplication;
let fixture: Seed;
let ownerCookie: string;
let otherCookie: string;

interface ElementSeed {
  slideId: string;
  id?: string;
  type?: ElementType;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  props?: ElementProps | null;
}

const endpoint = (slideId: string): string => `/api/slides/${slideId}/elements`;

const putElements = (slideId: string, cookie: string | null, body: unknown) => {
  const call = request(app.getHttpServer()).put(endpoint(slideId));
  if (cookie) call.set("Cookie", cookie);
  return call.send(body as object);
};

const entry = (id: string, overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  id,
  type: "text",
  x: 1,
  y: 2,
  width: 3,
  height: 4,
  ...overrides,
});

const insertElement = async (input: ElementSeed): Promise<SlideElementRow> => {
  const [row] = await database.db
    .insert(slideElements)
    .values({
      id: input.id ?? randomUUID(),
      slideId: input.slideId,
      type: input.type ?? "text",
      x: input.x ?? 0,
      y: input.y ?? 0,
      width: input.width ?? 100,
      height: input.height ?? 50,
      zIndex: input.zIndex ?? 0,
      props: input.props ?? null,
    })
    .returning();
  return row;
};

const insertResponse = async (elementId: string, value: string): Promise<void> => {
  await database.db.insert(audienceResponses).values({
    elementId,
    participantId: `participant-${value}`,
    participantName: value,
    value,
    createdAt: Date.now(),
  });
};

const elementsOf = (slideId: string): Promise<SlideElementRow[]> =>
  database.db
    .select()
    .from(slideElements)
    .where(eq(slideElements.slideId, slideId))
    .orderBy(asc(slideElements.zIndex));

const snapshot = async () => ({
  elements: await database.db.select().from(slideElements).orderBy(asc(slideElements.id)),
  responses: await database.db.select().from(audienceResponses).orderBy(asc(audienceResponses.id)),
});

beforeAll(async () => {
  database = openTestDatabase();
  app = await createTestApp(database.db);
});

afterAll(async () => {
  await app.close();
  await database.client.end();
});

beforeEach(async () => {
  await resetTestDatabase(database.client);
  fixture = await seed(database.db);
  ownerCookie = sessionCookie(app, fixture.ownerId);
  otherCookie = sessionCookie(app, fixture.otherId);
});

describe("PUT /api/slides/:slideId/elements", () => {
  it("inserts every provided element when the slide is empty and defaults zIndex to array order", async () => {
    const first = randomUUID();
    const second = randomUUID();

    const response = await putElements(fixture.slideA, ownerCookie, {
      elements: [
        entry(first, {
          type: "heading",
          x: 10,
          y: 20,
          width: 30,
          height: 40,
          props: { content: "Hello" },
        }),
        entry(second),
      ],
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);

    const rows = await elementsOf(fixture.slideA);
    expect(rows.map((row) => row.id)).toEqual([first, second]);
    expect(rows[0]).toMatchObject({
      slideId: fixture.slideA,
      type: "heading",
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      zIndex: 0,
      props: { content: "Hello" },
    });
    expect(rows[1]).toMatchObject({ slideId: fixture.slideA, type: "text", zIndex: 1 });
  });

  it("honours an explicit zIndex instead of the array index", async () => {
    const id = randomUUID();

    const response = await putElements(fixture.slideA, ownerCookie, {
      elements: [entry(id, { zIndex: 42 })],
    });

    expect(response.status).toBe(200);
    const [row] = await elementsOf(fixture.slideA);
    expect(row.zIndex).toBe(42);
  });

  it("updates geometry and replaces props wholesale", async () => {
    const existing = await insertElement({
      slideId: fixture.slideA,
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      props: { content: "old", color: "#ffffff", rotation: 90 },
    });

    const response = await putElements(fixture.slideA, ownerCookie, {
      elements: [
        entry(existing.id, {
          type: "text",
          x: 5,
          y: 6,
          width: 7,
          height: 8,
          props: { content: "new" },
        }),
      ],
    });

    expect(response.status).toBe(200);
    const rows = await elementsOf(fixture.slideA);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: existing.id, x: 5, y: 6, width: 7, height: 8 });
    expect(rows[0].props).toEqual({ content: "new" });
    expect(rows[0].createdAt.getTime()).toBe(existing.createdAt.getTime());
  });

  it("clears props when the payload omits them", async () => {
    const existing = await insertElement({
      slideId: fixture.slideA,
      props: { content: "old" },
    });

    const response = await putElements(fixture.slideA, ownerCookie, {
      elements: [entry(existing.id)],
    });

    expect(response.status).toBe(200);
    const [row] = await elementsOf(fixture.slideA);
    expect(row.props).toBeNull();
  });

  it("deletes elements of this slide that are absent from the payload", async () => {
    const kept = await insertElement({ slideId: fixture.slideA, zIndex: 0 });
    const removed = await insertElement({ slideId: fixture.slideA, zIndex: 1 });

    const response = await putElements(fixture.slideA, ownerCookie, {
      elements: [entry(kept.id)],
    });

    expect(response.status).toBe(200);
    expect(response.body.map((element: { id: string }) => element.id)).toEqual([kept.id]);

    const rows = await elementsOf(fixture.slideA);
    expect(rows.map((row) => row.id)).toEqual([kept.id]);

    const gone = await database.db
      .select()
      .from(slideElements)
      .where(eq(slideElements.id, removed.id));
    expect(gone).toHaveLength(0);
  });

  it("never touches elements of a different slide in the same presentation", async () => {
    await insertElement({ slideId: fixture.slideA });
    await insertElement({ slideId: fixture.slideB, type: "shape", zIndex: 0 });
    await insertElement({ slideId: fixture.slideB, type: "image", zIndex: 1 });
    const before = await elementsOf(fixture.slideB);

    const response = await putElements(fixture.slideA, ownerCookie, {
      elements: [entry(randomUUID())],
    });

    expect(response.status).toBe(200);
    expect(await elementsOf(fixture.slideB)).toEqual(before);
  });

  it("keeps audience responses of surviving elements and cascades away those of deleted ones", async () => {
    const survivor = await insertElement({ slideId: fixture.slideA, type: "quiz", zIndex: 0 });
    const doomed = await insertElement({ slideId: fixture.slideA, type: "wordcloud", zIndex: 1 });
    await insertResponse(survivor.id, "survivor-answer");
    await insertResponse(doomed.id, "doomed-answer");

    const survivorResponsesBefore = await database.db
      .select()
      .from(audienceResponses)
      .where(eq(audienceResponses.elementId, survivor.id));

    const response = await putElements(fixture.slideA, ownerCookie, {
      elements: [entry(survivor.id, { type: "quiz" })],
    });

    expect(response.status).toBe(200);

    const survivorResponsesAfter = await database.db
      .select()
      .from(audienceResponses)
      .where(eq(audienceResponses.elementId, survivor.id));
    expect(survivorResponsesAfter).toEqual(survivorResponsesBefore);

    const doomedResponses = await database.db
      .select()
      .from(audienceResponses)
      .where(eq(audienceResponses.elementId, doomed.id));
    expect(doomedResponses).toHaveLength(0);
  });

  it("is idempotent: the same payload twice yields the same state and no duplicates", async () => {
    const payload = {
      elements: [
        entry(randomUUID(), { type: "heading", props: { content: "One" } }),
        entry(randomUUID(), { x: 9, y: 9, width: 9, height: 9 }),
      ],
    };

    const first = await putElements(fixture.slideA, ownerCookie, payload);
    expect(first.status).toBe(200);
    const afterFirst = await snapshot();

    const second = await putElements(fixture.slideA, ownerCookie, payload);
    expect(second.status).toBe(200);
    const afterSecond = await snapshot();

    expect(afterSecond).toEqual(afterFirst);
    expect(second.body).toEqual(first.body);
    expect(afterSecond.elements).toHaveLength(2);
  });

  it("rejects an invalid payload with 400 and leaves the database untouched", async () => {
    await insertElement({ slideId: fixture.slideA, zIndex: 0 });
    const doomed = await insertElement({ slideId: fixture.slideA, zIndex: 1 });
    await insertResponse(doomed.id, "answer");
    await insertElement({ slideId: fixture.slideB });
    const before = await snapshot();

    const invalidPayloads = [
      { elements: [entry("not-a-uuid")] },
      { elements: [{ id: randomUUID(), type: "text", x: 1, y: 2, height: 4 }] },
      { elements: [entry(randomUUID(), { x: "left" })] },
      { elements: [entry(randomUUID(), { type: "banana" })] },
      { elements: [entry(randomUUID(), { props: { content: 12 } })] },
      { elements: "everything" },
      {},
    ];

    for (const payload of invalidPayloads) {
      const response = await putElements(fixture.slideA, ownerCookie, payload);
      expect(response.status).toBe(400);
      expect(await snapshot()).toEqual(before);
    }
  });

  it("rejects a payload with duplicate ids with 400 and leaves the database untouched", async () => {
    await insertElement({ slideId: fixture.slideA });
    const before = await snapshot();
    const duplicated = randomUUID();

    const response = await putElements(fixture.slideA, ownerCookie, {
      elements: [entry(duplicated), entry(duplicated, { x: 99 })],
    });

    expect(response.status).toBe(400);
    expect(await snapshot()).toEqual(before);
  });

  it("rolls back the whole transaction when a write fails mid-flight", async () => {
    const doomed = await insertElement({ slideId: fixture.slideA, zIndex: 0 });
    await insertElement({ slideId: fixture.slideA, zIndex: 1 });
    await insertResponse(doomed.id, "answer");
    const before = await snapshot();

    const response = await putElements(fixture.slideA, ownerCookie, {
      elements: [entry(randomUUID(), { zIndex: 2_147_483_648 })],
    });

    expect(response.status).toBeGreaterThanOrEqual(500);
    expect(await snapshot()).toEqual(before);
  });

  it("accepts an empty array and clears only this slide", async () => {
    await insertElement({ slideId: fixture.slideA, zIndex: 0 });
    await insertElement({ slideId: fixture.slideA, zIndex: 1 });
    await insertElement({ slideId: fixture.slideB });
    const slideBBefore = await elementsOf(fixture.slideB);

    const response = await putElements(fixture.slideA, ownerCookie, { elements: [] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
    expect(await elementsOf(fixture.slideA)).toHaveLength(0);
    expect(await elementsOf(fixture.slideB)).toEqual(slideBBefore);
  });

  it("rejects another user with 403 and changes nothing", async () => {
    await insertElement({ slideId: fixture.slideA });
    const before = await snapshot();

    const response = await putElements(fixture.slideA, otherCookie, {
      elements: [entry(randomUUID())],
    });

    expect(response.status).toBe(403);
    expect(await snapshot()).toEqual(before);
  });

  it("rejects an unauthenticated request with 401 and changes nothing", async () => {
    await insertElement({ slideId: fixture.slideA });
    const before = await snapshot();

    const response = await putElements(fixture.slideA, null, {
      elements: [entry(randomUUID())],
    });

    expect(response.status).toBe(401);
    expect(await snapshot()).toEqual(before);
  });

  it("refuses to adopt an element that lives on another slide", async () => {
    const foreign = await insertElement({ slideId: fixture.slideB, type: "image" });
    await insertElement({ slideId: fixture.slideA });
    const before = await snapshot();

    const response = await putElements(fixture.slideA, ownerCookie, {
      elements: [entry(foreign.id)],
    });

    expect(response.status).toBe(409);
    expect(await snapshot()).toEqual(before);
  });
});
