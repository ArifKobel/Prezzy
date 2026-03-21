import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const elementType = v.union(
  v.literal("heading"),
  v.literal("text"),
  v.literal("image"),
  v.literal("shape"),
  v.literal("quiz"),
  v.literal("wordcloud"),
  v.literal("leaderboard"),
  v.literal("qrcode"),
);

const propsValidator = v.object({
  content: v.optional(v.string()),
  src: v.optional(v.string()),
  color: v.optional(v.string()),
  objectFit: v.optional(v.string()),
  borderRadius: v.optional(v.number()),
  opacity: v.optional(v.number()),
  rotation: v.optional(v.number()),
  flipX: v.optional(v.boolean()),
  flipY: v.optional(v.boolean()),
  shapeType: v.optional(v.string()),
  question: v.optional(v.string()),
  options: v.optional(v.array(v.string())),
  correctOption: v.optional(v.number()),
  timerSeconds: v.optional(v.number()),
  timeScoring: v.optional(v.boolean()),
  accentColor: v.optional(v.string()),
  backgroundColor: v.optional(v.string()),
  textColor: v.optional(v.string()),
  prompt: v.optional(v.string()),
  maxResponses: v.optional(v.number()),
});

export const listBySlide = query({
  args: { slideId: v.id("slides") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("slideElements")
      .withIndex("by_slide", (q) => q.eq("slideId", args.slideId))
      .take(200);
  },
});

export const listByPresentation = query({
  args: { presentationId: v.id("presentations") },
  handler: async (ctx, args) => {
    const slides = await ctx.db
      .query("slides")
      .withIndex("by_presentation_order", (q) =>
        q.eq("presentationId", args.presentationId),
      )
      .take(200);
    const allElements = [];
    for (const slide of slides) {
      const elements = await ctx.db
        .query("slideElements")
        .withIndex("by_slide", (q) => q.eq("slideId", slide._id))
        .take(200);
      allElements.push(...elements);
    }
    return allElements;
  },
});

export const listFirstSlide = query({
  args: { presentationId: v.id("presentations") },
  handler: async (ctx, args) => {
    const firstSlide = await ctx.db
      .query("slides")
      .withIndex("by_presentation_order", (q) =>
        q.eq("presentationId", args.presentationId),
      )
      .order("asc")
      .first();
    if (!firstSlide) return [];
    return await ctx.db
      .query("slideElements")
      .withIndex("by_slide", (q) => q.eq("slideId", firstSlide._id))
      .take(200);
  },
});

export const create = mutation({
  args: {
    slideId: v.id("slides"),
    type: elementType,
    x: v.number(),
    y: v.number(),
    width: v.number(),
    height: v.number(),
    props: v.optional(propsValidator),
    zIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.zIndex != null) {
      return await ctx.db.insert("slideElements", { ...args, zIndex: args.zIndex });
    }
    const siblings = await ctx.db
      .query("slideElements")
      .withIndex("by_slide", (q) => q.eq("slideId", args.slideId))
      .take(200);
    const maxZ = siblings.reduce((m, el) => Math.max(m, el.zIndex ?? 0), 0);
    return await ctx.db.insert("slideElements", { ...args, zIndex: maxZ + 1 });
  },
});

export const reorder = mutation({
  args: {
    id: v.id("slideElements"),
    action: v.union(
      v.literal("front"),
      v.literal("forward"),
      v.literal("backward"),
      v.literal("back"),
    ),
  },
  handler: async (ctx, args) => {
    const el = await ctx.db.get(args.id);
    if (!el) throw new Error("Element not found");

    const siblings = await ctx.db
      .query("slideElements")
      .withIndex("by_slide", (q) => q.eq("slideId", el.slideId))
      .take(200);

    const sorted = [...siblings].sort(
      (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0) || a._creationTime - b._creationTime,
    );

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].zIndex !== i) {
        await ctx.db.patch(sorted[i]._id, { zIndex: i });
      }
      sorted[i] = { ...sorted[i], zIndex: i };
    }

    const idx = sorted.findIndex((s) => s._id === args.id);
    if (idx === -1) return;

    if (args.action === "front" && idx < sorted.length - 1) {
      await ctx.db.patch(args.id, { zIndex: sorted.length });
    } else if (args.action === "back" && idx > 0) {
      await ctx.db.patch(args.id, { zIndex: -1 });
    } else if (args.action === "forward" && idx < sorted.length - 1) {
      const above = sorted[idx + 1];
      await ctx.db.patch(args.id, { zIndex: idx + 1 });
      await ctx.db.patch(above._id, { zIndex: idx });
    } else if (args.action === "backward" && idx > 0) {
      const below = sorted[idx - 1];
      await ctx.db.patch(args.id, { zIndex: idx - 1 });
      await ctx.db.patch(below._id, { zIndex: idx });
    }
  },
});

export const updatePosition = mutation({
  args: { id: v.id("slideElements"), x: v.number(), y: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { x: args.x, y: args.y });
  },
});

export const updateGeometry = mutation({
  args: {
    id: v.id("slideElements"),
    x: v.number(),
    y: v.number(),
    width: v.number(),
    height: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      x: args.x,
      y: args.y,
      width: args.width,
      height: args.height,
    });
  },
});

export const updateContent = mutation({
  args: { id: v.id("slideElements"), content: v.string() },
  handler: async (ctx, args) => {
    const el = await ctx.db.get(args.id);
    if (!el) throw new Error("Element not found");
    await ctx.db.patch(args.id, { props: { ...el.props, content: args.content } });
  },
});

export const updateProps = mutation({
  args: {
    id: v.id("slideElements"),
    props: propsValidator,
  },
  handler: async (ctx, args) => {
    const el = await ctx.db.get(args.id);
    if (!el) throw new Error("Element not found");
    await ctx.db.patch(args.id, { props: { ...el.props, ...args.props } });
  },
});

export const updateImageSrc = mutation({
  args: { id: v.id("slideElements"), src: v.string() },
  handler: async (ctx, args) => {
    const el = await ctx.db.get(args.id);
    if (!el) throw new Error("Element not found");
    await ctx.db.patch(args.id, { props: { ...el.props, src: args.src } });
  },
});

export const setImageFromStorage = mutation({
  args: { id: v.id("slideElements"), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const el = await ctx.db.get(args.id);
    if (!el) throw new Error("Element not found");
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("Could not resolve storage URL");
    await ctx.db.patch(args.id, { props: { ...el.props, src: url } });
  },
});

export const remove = mutation({
  args: { id: v.id("slideElements") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
