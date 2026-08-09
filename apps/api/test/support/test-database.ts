import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import type { Database } from "@/db/db.types";
import * as schema from "@/db/schema";

export const TEST_DATABASE_NAME = "prezzy_test";

const HOST = process.env.TEST_DATABASE_HOST ?? "postgres://prezzy:prezzy@localhost:5433";

export const TEST_DATABASE_URL = `${HOST}/${TEST_DATABASE_NAME}`;

export const ADMIN_DATABASE_URL = `${HOST}/postgres`;

export const TEST_JWT_SECRET = "prezzy-test-secret";

const TRUNCATE = [
  "audience_responses",
  "participants",
  "presentation_docs",
  "slide_elements",
  "slides",
  "presentations",
  "users",
].join(", ");

export interface TestDatabase {
  db: Database;
  client: Sql;
}

export const openTestDatabase = (): TestDatabase => {
  const client = postgres(TEST_DATABASE_URL, { max: 2, onnotice: () => {} });
  return { db: drizzle(client, { schema }), client };
};

export const assertTestDatabase = async (client: Sql): Promise<void> => {
  const [row] = await client<{ name: string }[]>`select current_database() as name`;
  if (row?.name !== TEST_DATABASE_NAME) {
    throw new Error(`Refusing to run destructive test setup against "${row?.name}"`);
  }
};

export const resetTestDatabase = async (client: Sql): Promise<void> => {
  await assertTestDatabase(client);
  await client.unsafe(`truncate table ${TRUNCATE} restart identity cascade`);
};
