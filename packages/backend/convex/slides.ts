import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByPresentation = query({
  args: { presentationId: v.id("presentations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("slides")
      .withIndex("by_presentation_order", (q) =>
        q.eq("presentationId", args.presentationId),
      )
      .order("asc")
      .take(200);
  },
});

export const create = mutation({
  args: {
    presentationId: v.id("presentations"),
    afterOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const slides = await ctx.db
      .query("slides")
      .withIndex("by_presentation_order", (q) =>
        q.eq("presentationId", args.presentationId),
      )
      .order("asc")
      .take(200);

    const order =
      args.afterOrder !== undefined
        ? args.afterOrder + 1
        : slides.length > 0
          ? Math.max(...slides.map((s) => s.order)) + 1
          : 0;

    return await ctx.db.insert("slides", {
      presentationId: args.presentationId,
      order,
      title: `Slide ${slides.length + 1}`,
    });
  },
});

export const duplicate = mutation({
  args: { slideId: v.id("slides") },
  handler: async (ctx, args) => {
    const slide = await ctx.db.get(args.slideId);
    if (!slide) throw new Error("Slide not found");

    const newId = await ctx.db.insert("slides", {
      presentationId: slide.presentationId,
      order: slide.order + 0.5,
      title: slide.title ? `${slide.title} (copy)` : undefined,
    });

    const elements = await ctx.db
      .query("slideElements")
      .withIndex("by_slide", (q) => q.eq("slideId", args.slideId))
      .take(200);

    for (const el of elements) {
      const { _id: _elId, _creationTime: _elTime, slideId: _sid, ...rest } = el;
      await ctx.db.insert("slideElements", { ...rest, slideId: newId });
    }

    return newId;
  },
});

export const remove = mutation({
  args: { slideId: v.id("slides") },
  handler: async (ctx, args) => {
    const elements = await ctx.db
      .query("slideElements")
      .withIndex("by_slide", (q) => q.eq("slideId", args.slideId))
      .take(200);
    for (const el of elements) {
      await ctx.db.delete(el._id);
    }
    await ctx.db.delete(args.slideId);
  },
});

export const reorder = mutation({
  args: {
    presentationId: v.id("presentations"),
    slideIds: v.array(v.id("slides")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.slideIds.length; i++) {
      await ctx.db.patch(args.slideIds[i], { order: i });
    }
  },
});

export const createFromLayout = mutation({
  args: {
    presentationId: v.id("presentations"),
    afterOrder: v.optional(v.number()),
    order: v.optional(v.number()),
    elements: v.array(
      v.object({
        type: v.string(),
        x: v.number(),
        y: v.number(),
        width: v.number(),
        height: v.number(),
        props: v.optional(v.any()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    let order: number;
    if (args.order !== undefined) {
      order = args.order;
    } else {
      const slides = await ctx.db
        .query("slides")
        .withIndex("by_presentation_order", (q) =>
          q.eq("presentationId", args.presentationId),
        )
        .order("asc")
        .take(200);

      order =
        args.afterOrder !== undefined
          ? args.afterOrder + 1
          : slides.length > 0
            ? Math.max(...slides.map((s) => s.order)) + 1
            : 0;
    }

    const slideId = await ctx.db.insert("slides", {
      presentationId: args.presentationId,
      order,
    });

    for (let i = 0; i < args.elements.length; i++) {
      const el = args.elements[i];
      await ctx.db.insert("slideElements", {
        slideId,
        type: el.type as any,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        zIndex: i,
        props: el.props,
      });
    }

    return slideId;
  },
});

export const createBatch = mutation({
  args: {
    presentationId: v.id("presentations"),
    slides: v.array(
      v.object({
        elements: v.array(
          v.object({
            type: v.string(),
            x: v.number(),
            y: v.number(),
            width: v.number(),
            height: v.number(),
            props: v.optional(v.any()),
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const ids: string[] = [];
    for (let i = 0; i < args.slides.length; i++) {
      const slideId = await ctx.db.insert("slides", {
        presentationId: args.presentationId,
        order: i,
      });
      for (let j = 0; j < args.slides[i].elements.length; j++) {
        const el = args.slides[i].elements[j];
        await ctx.db.insert("slideElements", {
          slideId,
          type: el.type as any,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          zIndex: j,
          props: el.props,
        });
      }
      ids.push(slideId);
    }
    return ids;
  },
});

export const updateTitle = mutation({
  args: { slideId: v.id("slides"), title: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.slideId, { title: args.title });
  },
});
