import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import postgres from "postgres";
import {
  ADMIN_DATABASE_URL,
  TEST_DATABASE_NAME,
  TEST_DATABASE_URL,
  assertTestDatabase,
} from "./test-database";

const apiRoot = resolve(process.cwd());

const ensureDatabase = async (): Promise<void> => {
  const admin = postgres(ADMIN_DATABASE_URL, { max: 1, onnotice: () => {} });
  try {
    const rows = await admin`select 1 from pg_database where datname = ${TEST_DATABASE_NAME}`;
    if (rows.length === 0) {
      await admin.unsafe(`create database "${TEST_DATABASE_NAME}"`);
    }
  } finally {
    await admin.end();
  }
};

const pushSchema = (): void => {
  execFileSync(
    process.execPath,
    [resolve(apiRoot, "node_modules/drizzle-kit/bin.cjs"), "push", "--force"],
    {
      cwd: apiRoot,
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
};

export default async function setup(): Promise<void> {
  await ensureDatabase();
  pushSchema();
  const client = postgres(TEST_DATABASE_URL, { max: 1, onnotice: () => {} });
  try {
    await assertTestDatabase(client);
  } finally {
    await client.end();
  }
}
