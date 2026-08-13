import { and, eq, gt, isNull, or } from "drizzle-orm";
import type { Adapter, AdapterPayload } from "oidc-provider";
import type { Database } from "@/db/db.types";
import { oauthArtifacts } from "@/db/schema";

export const oauthAdapter = (db: Database) =>
  class DrizzleOAuthAdapter implements Adapter {
    constructor(private readonly model: string) {}

    async upsert(id: string, payload: AdapterPayload, expiresIn?: number): Promise<void> {
      const values = {
        model: this.model,
        id,
        payload: payload as Record<string, unknown>,
        grantId: payload.grantId,
        userCode: payload.userCode,
        uid: payload.uid,
        consumedAt: payload.consumed ? new Date() : null,
        expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
      };
      await db.insert(oauthArtifacts).values(values).onConflictDoUpdate({
        target: [oauthArtifacts.model, oauthArtifacts.id],
        set: values,
      });
    }

    find(id: string): Promise<AdapterPayload | undefined> {
      return this.findOne(eq(oauthArtifacts.id, id));
    }

    findByUserCode(userCode: string): Promise<AdapterPayload | undefined> {
      return this.findOne(eq(oauthArtifacts.userCode, userCode));
    }

    findByUid(uid: string): Promise<AdapterPayload | undefined> {
      return this.findOne(eq(oauthArtifacts.uid, uid));
    }

    async consume(id: string): Promise<void> {
      await db
        .update(oauthArtifacts)
        .set({ consumedAt: new Date() })
        .where(and(eq(oauthArtifacts.model, this.model), eq(oauthArtifacts.id, id)));
    }

    async destroy(id: string): Promise<void> {
      await db
        .delete(oauthArtifacts)
        .where(and(eq(oauthArtifacts.model, this.model), eq(oauthArtifacts.id, id)));
    }

    async revokeByGrantId(grantId: string): Promise<void> {
      await db.delete(oauthArtifacts).where(eq(oauthArtifacts.grantId, grantId));
    }

    private async findOne(condition: ReturnType<typeof eq>): Promise<AdapterPayload | undefined> {
      const [row] = await db
        .select()
        .from(oauthArtifacts)
        .where(
          and(
            eq(oauthArtifacts.model, this.model),
            condition,
            or(isNull(oauthArtifacts.expiresAt), gt(oauthArtifacts.expiresAt, new Date())),
          ),
        )
        .limit(1);
      if (!row) return undefined;
      return {
        ...row.payload,
        ...(row.consumedAt ? { consumed: Math.floor(row.consumedAt.getTime() / 1000) } : {}),
      } as AdapterPayload;
    }
  };
