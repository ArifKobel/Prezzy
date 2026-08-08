import type { Provider } from "@nestjs/common";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/config/env";
import { DRIZZLE } from "@/db/db.constants";
import type { Database } from "@/db/db.types";
import * as schema from "@/db/schema";

export const databaseProvider: Provider = {
  provide: DRIZZLE,
  useFactory: (): Database => drizzle(postgres(env.databaseUrl), { schema }),
};
