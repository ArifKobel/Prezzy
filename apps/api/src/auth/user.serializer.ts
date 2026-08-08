import type { UserRow } from "@/db/schema";
import type { User } from "@/shared";

export const toUser = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  name: row.name,
});
