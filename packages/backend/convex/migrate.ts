import { internalMutation } from "./_generated/server";

export const cleanupOldInteractive = internalMutation({
  args: {},
  handler: async (ctx) => {
    const oldResponses = await ctx.db.query("audienceResponses").take(500);
    for (const r of oldResponses) {
      await ctx.db.delete(r._id);
    }
    return { deleted: oldResponses.length };
  },
});
