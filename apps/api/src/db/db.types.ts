import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/db/schema";

export type Database = PostgresJsDatabase<typeof schema>;
