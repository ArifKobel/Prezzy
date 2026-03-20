import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const create = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    const now = Date.now();
    const joinCode = generateJoinCode();
    const id = await ctx.db.insert("presentations", {
      title: args.title,
      userId: user?._id,
      joinCode,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("slides", {
      presentationId: id,
      order: 0,
      title: "Slide 1",
    });
    return id;
  },
});

export const get = query({
  args: { id: v.id("presentations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) return [];
    const all = await ctx.db.query("presentations").order("desc").take(200);
    return all.filter((p) => p.userId === user._id);
  },
});

export const updateTitle = mutation({
  args: { id: v.id("presentations"), title: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { title: args.title, updatedAt: Date.now() });
  },
});

const themeValidator = v.object({
  primaryColor: v.optional(v.string()),
  secondaryColor: v.optional(v.string()),
  backgroundColor: v.optional(v.string()),
  surfaceColor: v.optional(v.string()),
  textColor: v.optional(v.string()),
  headingFont: v.optional(v.string()),
  bodyFont: v.optional(v.string()),
});

export const updateTheme = mutation({
  args: { id: v.id("presentations"), theme: themeValidator },
  handler: async (ctx, args) => {
    const p = await ctx.db.get(args.id);
    if (!p) throw new Error("Presentation not found");
    await ctx.db.patch(args.id, {
      theme: { ...p.theme, ...args.theme },
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("presentations") },
  handler: async (ctx, args) => {
    const slides = await ctx.db
      .query("slides")
      .withIndex("by_presentation_order", (q) => q.eq("presentationId", args.id))
      .take(500);
    for (const slide of slides) {
      const elements = await ctx.db
        .query("slideElements")
        .withIndex("by_slide", (q) => q.eq("slideId", slide._id))
        .take(500);
      for (const el of elements) {
        await ctx.db.delete(el._id);
      }
      await ctx.db.delete(slide._id);
    }
    await ctx.db.delete(args.id);
  },
});
