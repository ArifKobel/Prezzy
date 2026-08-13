import type { INestApplication } from "@nestjs/common";
import { sign } from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { presentations, slides, users } from "@/db/schema";
import { type Seed, seed } from "./support/seed";
import { createTestApp } from "./support/test-app";
import { TEST_JWT_SECRET, type TestDatabase, openTestDatabase, resetTestDatabase } from "./support/test-database";

let database: TestDatabase;
let app: INestApplication;
let fixture: Seed;

const ISSUER = "http://localhost:3001";

const previewToken = (
  claims: { userId: string; presentationId: string; slideId: string },
  options: { secret?: string; audience?: string; expiresIn?: number } = {},
) =>
  sign(claims, options.secret ?? TEST_JWT_SECRET, {
    audience: options.audience ?? "prezzy:slide-preview",
    issuer: ISSUER,
    expiresIn: options.expiresIn ?? 60,
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
});

describe("slide preview data", () => {
  it("serves preview data for a bound short-lived token", async () => {
    const token = previewToken({
      userId: fixture.ownerId,
      presentationId: fixture.presentationId,
      slideId: fixture.slideA,
    });

    const response = await request(app.getHttpServer()).get(`/api/mcp-preview?token=${encodeURIComponent(token)}`);

    expect(response.status).toBe(200);
    expect(response.body.slide.id).toBe(fixture.slideA);
    expect(response.body.elements).toEqual([]);
  });

  it.each([
    ["a foreign signing key", { secret: "not-the-server-secret" }],
    ["a token minted for another audience", { audience: "prezzy:something-else" }],
    ["an expired token", { expiresIn: -60 }],
  ])("rejects %s", async (_case, options) => {
    const token = previewToken(
      { userId: fixture.ownerId, presentationId: fixture.presentationId, slideId: fixture.slideA },
      options,
    );

    await request(app.getHttpServer()).get(`/api/mcp-preview?token=${encodeURIComponent(token)}`).expect(401);
  });

  it("rejects a valid token that points at someone else's deck", async () => {
    const token = previewToken({
      userId: fixture.otherId,
      presentationId: fixture.presentationId,
      slideId: fixture.slideA,
    });

    const response = await request(app.getHttpServer()).get(`/api/mcp-preview?token=${encodeURIComponent(token)}`);

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.body.slide).toBeUndefined();
  });

  it("rejects a slide that does not belong to the token's presentation", async () => {
    const [otherUser] = await database.db
      .insert(users)
      .values({ email: "second@example.com", name: "Second", passwordHash: "hash" })
      .returning();
    const [otherDeck] = await database.db
      .insert(presentations)
      .values({ userId: otherUser.id, title: "Other deck" })
      .returning();
    const [foreignSlide] = await database.db
      .insert(slides)
      .values({ presentationId: otherDeck.id, order: 0, title: "Foreign" })
      .returning();

    const token = previewToken({
      userId: fixture.ownerId,
      presentationId: fixture.presentationId,
      slideId: foreignSlide.id,
    });

    await request(app.getHttpServer()).get(`/api/mcp-preview?token=${encodeURIComponent(token)}`).expect(404);
  });
});

describe("MCP discovery", () => {
  it("publishes OAuth authorization server metadata", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/oauth/.well-known/openid-configuration")
      .expect(200);

    expect(response.body).toMatchObject({
      issuer: `${ISSUER}/api/oauth`,
      authorization_endpoint: `${ISSUER}/api/oauth/auth`,
      token_endpoint: `${ISSUER}/api/oauth/token`,
      client_id_metadata_document_supported: true,
    });
  });

  it("publishes protected resource metadata at the RFC 9728 path", async () => {
    const response = await request(app.getHttpServer())
      .get("/.well-known/oauth-protected-resource/api/mcp")
      .expect(200);

    expect(response.body.authorization_servers).toEqual([`${ISSUER}/api/oauth`]);
    expect(response.body.scopes_supported).toEqual(["presentations:read", "presentations:write"]);
  });

  it("challenges unauthenticated MCP requests with resource metadata", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/mcp")
      .set("Accept", "application/json, text/event-stream")
      .send({ jsonrpc: "2.0", id: 1, method: "server/discover" })
      .expect(401);

    expect(response.headers["www-authenticate"]).toContain(
      `resource_metadata="${ISSUER}/.well-known/oauth-protected-resource/api/mcp"`,
    );
  });

  it("refuses a cross-origin browser request before authentication", async () => {
    await request(app.getHttpServer())
      .post("/api/mcp")
      .set("Origin", "https://evil.example")
      .set("Accept", "application/json, text/event-stream")
      .send({ jsonrpc: "2.0", id: 1, method: "server/discover" })
      .expect(401);
  });
});

describe("OAuth interactions", () => {
  it("rejects an unknown interaction", async () => {
    await request(app.getHttpServer()).get("/api/oauth-interactions/does-not-exist").expect(400);
  });

  it("refuses a decision posted from a foreign origin", async () => {
    await request(app.getHttpServer())
      .post("/api/oauth-interactions/does-not-exist")
      .set("Origin", "https://evil.example")
      .send({ decision: "approve" })
      .expect(403);
  });
});
