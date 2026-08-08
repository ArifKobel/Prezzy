import type { Database } from "@/db/db.types";
import { presentations, slides, users } from "@/db/schema";

export interface Seed {
  ownerId: string;
  otherId: string;
  presentationId: string;
  slideA: string;
  slideB: string;
}

export const seed = async (db: Database): Promise<Seed> => {
  const [owner] = await db
    .insert(users)
    .values({ email: "owner@test.local", name: "Owner", passwordHash: "x" })
    .returning();
  const [other] = await db
    .insert(users)
    .values({ email: "other@test.local", name: "Other", passwordHash: "x" })
    .returning();
  const [presentation] = await db
    .insert(presentations)
    .values({ userId: owner.id, title: "Deck", joinCode: "TEST01" })
    .returning();
  const [slideA] = await db
    .insert(slides)
    .values({ presentationId: presentation.id, order: 0, title: "A" })
    .returning();
  const [slideB] = await db
    .insert(slides)
    .values({ presentationId: presentation.id, order: 1, title: "B" })
    .returning();

  return {
    ownerId: owner.id,
    otherId: other.id,
    presentationId: presentation.id,
    slideA: slideA.id,
    slideB: slideB.id,
  };
};
