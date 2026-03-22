import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const ensureJoinCode = mutation({
  args: { presentationId: v.id("presentations") },
  handler: async (ctx, args) => {
    const p = await ctx.db.get(args.presentationId);
    if (!p) throw new Error("Presentation not found");
    if (p.joinCode) return p.joinCode;
    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const conflict = await ctx.db
        .query("presentations")
        .withIndex("by_joinCode", (q) => q.eq("joinCode", code))
        .first();
      if (!conflict) break;
      code = generateCode();
      attempts++;
    }
    await ctx.db.patch(args.presentationId, { joinCode: code });
    return code;
  },
});

export const getByJoinCode = query({
  args: { joinCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("presentations")
      .withIndex("by_joinCode", (q) =>
        q.eq("joinCode", args.joinCode.toUpperCase()),
      )
      .first();
  },
});


export const setLiveSlide = mutation({
  args: {
    presentationId: v.id("presentations"),
    slideId: v.id("slides"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.presentationId, {
      liveSlideId: args.slideId,
      quizState: undefined,
    });
  },
});

export const clearLiveSlide = mutation({
  args: { presentationId: v.id("presentations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.presentationId, {
      liveSlideId: undefined,
      quizState: undefined,
    });
  },
});


export const startQuiz = mutation({
  args: {
    presentationId: v.id("presentations"),
    elementId: v.id("slideElements"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.presentationId, {
      quizState: {
        elementId: args.elementId,
        phase: "question",
        startedAt: 0,
      },
    });
  },
});

export const revealOptions = mutation({
  args: { presentationId: v.id("presentations") },
  handler: async (ctx, args) => {
    const p = await ctx.db.get(args.presentationId);
    if (!p?.quizState) throw new Error("No active quiz");
    await ctx.db.patch(args.presentationId, {
      quizState: {
        ...p.quizState,
        phase: "answering",
        startedAt: Date.now(),
      },
    });
  },
});

export const showResults = mutation({
  args: { presentationId: v.id("presentations") },
  handler: async (ctx, args) => {
    const p = await ctx.db.get(args.presentationId);
    if (!p?.quizState) throw new Error("No active quiz");
    await ctx.db.patch(args.presentationId, {
      quizState: {
        ...p.quizState,
        phase: "results",
      },
    });
  },
});

export const setQuizPhase = mutation({
  args: {
    presentationId: v.id("presentations"),
    elementId: v.id("slideElements"),
    phase: v.union(v.literal("question"), v.literal("answering"), v.literal("results")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.presentationId, {
      quizState: {
        elementId: args.elementId,
        phase: args.phase,
        startedAt: args.phase === "answering" ? Date.now() : 0,
      },
    });
  },
});

export const clearQuiz = mutation({
  args: { presentationId: v.id("presentations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.presentationId, {
      quizState: undefined,
    });
  },
});


export const clearAllResponses = mutation({
  args: { presentationId: v.id("presentations") },
  handler: async (ctx, args) => {
    const slides = await ctx.db
      .query("slides")
      .withIndex("by_presentation_order", (q) =>
        q.eq("presentationId", args.presentationId),
      )
      .take(200);

    let deleted = 0;
    for (const slide of slides) {
      const elements = await ctx.db
        .query("slideElements")
        .withIndex("by_slide", (q) => q.eq("slideId", slide._id))
        .take(200);
      for (const el of elements) {
        if (el.type !== "quiz" && el.type !== "wordcloud") continue;
        const responses = await ctx.db
          .query("audienceResponses")
          .withIndex("by_element", (q) => q.eq("elementId", el._id))
          .collect();
        for (const r of responses) {
          await ctx.db.delete(r._id);
          deleted++;
        }
      }
    }
    return { deleted };
  },
});

export const listResponses = query({
  args: { elementId: v.id("slideElements") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("audienceResponses")
      .withIndex("by_element", (q) => q.eq("elementId", args.elementId))
      .order("desc")
      .take(500);
  },
});

export const submitResponse = mutation({
  args: {
    elementId: v.id("slideElements"),
    participantId: v.string(),
    participantName: v.optional(v.string()),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const el = await ctx.db.get(args.elementId);
    if (!el) throw new Error("Element not found");

    if (el.type === "quiz") {
      const slide = await ctx.db.get(el.slideId);
      if (slide) {
        const pres = await ctx.db.get(slide.presentationId);
        if (
          !pres?.quizState ||
          pres.quizState.elementId !== args.elementId ||
          pres.quizState.phase !== "answering"
        ) {
          throw new Error("Quiz is not accepting answers right now");
        }
      }
    }

    let correct: boolean | undefined;
    let score: number | undefined;

    if (el.type === "quiz") {
      const options: string[] = (el.props?.options as string[]) ?? [];
      const correctIdx = el.props?.correctOption as number | undefined;
      if (correctIdx != null) {
        correct = args.value === options[correctIdx];
      }

      const timerSeconds = (el.props?.timerSeconds as number) ?? 20;
      const timeScoring = (el.props?.timeScoring as boolean) ?? true;

      if (correct) {
        if (!timeScoring) {
          score = 1000;
        } else {
          const slide = await ctx.db.get(el.slideId);
          if (slide) {
            const presentation = await ctx.db.get(slide.presentationId);
            const startedAt = presentation?.quizState?.startedAt ?? 0;
            if (startedAt > 0) {
              const elapsed = (Date.now() - startedAt) / 1000;
              const fraction = Math.max(0, 1 - elapsed / timerSeconds);
              score = Math.max(100, Math.round(1000 * fraction));
            } else {
              score = 1000;
            }
          } else {
            score = 1000;
          }
        }
      } else {
        score = 0;
      }

      const existing = await ctx.db
        .query("audienceResponses")
        .withIndex("by_element", (q) => q.eq("elementId", args.elementId))
        .collect();
      const prev = existing.find((r) => r.participantId === args.participantId);
      if (prev) {
        await ctx.db.patch(prev._id, {
          value: args.value,
          correct,
          score,
          participantName: args.participantName ?? prev.participantName,
        });
        return prev._id;
      }
    }

    if (el.type === "wordcloud") {
      const maxResponses = (el.props?.maxResponses as number) ?? 1;
      const existing = await ctx.db
        .query("audienceResponses")
        .withIndex("by_element", (q) => q.eq("elementId", args.elementId))
        .collect();
      const participantResponses = existing.filter(
        (r) => r.participantId === args.participantId,
      );
      if (participantResponses.length >= maxResponses) {
        throw new Error("Maximum number of responses reached");
      }
    }

    return await ctx.db.insert("audienceResponses", {
      elementId: args.elementId,
      participantId: args.participantId,
      participantName: args.participantName,
      value: args.value,
      correct,
      score,
      createdAt: Date.now(),
    });
  },
});


export const getLeaderboard = query({
  args: { presentationId: v.id("presentations") },
  handler: async (ctx, args) => {
    const slides = await ctx.db
      .query("slides")
      .withIndex("by_presentation_order", (q) =>
        q.eq("presentationId", args.presentationId),
      )
      .take(200);

    const quizElementIds: string[] = [];
    for (const slide of slides) {
      const elements = await ctx.db
        .query("slideElements")
        .withIndex("by_slide", (q) => q.eq("slideId", slide._id))
        .take(200);
      for (const el of elements) {
        if (el.type === "quiz") quizElementIds.push(el._id);
      }
    }

    const scores = new Map<
      string,
      { name: string; score: number; correct: number; total: number }
    >();

    for (const elementId of quizElementIds) {
      const responses = await ctx.db
        .query("audienceResponses")
        .withIndex("by_element", (q) => q.eq("elementId", elementId as any))
        .take(500);

      for (const r of responses) {
        const key = r.participantId;
        const existing = scores.get(key) ?? {
          name: r.participantName ?? "Anonymous",
          score: 0,
          correct: 0,
          total: 0,
        };
        existing.total++;
        if (r.correct) existing.correct++;
        existing.score += r.score ?? 0;
        if (r.participantName) existing.name = r.participantName;
        scores.set(key, existing);
      }
    }

    return [...scores.values()]
      .sort((a, b) => b.score - a.score || b.correct - a.correct)
      .slice(0, 50);
  },
});


const PRESENCE_TIMEOUT = 30_000;

export const heartbeat = mutation({
  args: {
    presentationId: v.id("presentations"),
    participantId: v.string(),
    participantName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("participants")
      .withIndex("by_presentation_participant", (q) =>
        q
          .eq("presentationId", args.presentationId)
          .eq("participantId", args.participantId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSeenAt: Date.now(),
        participantName: args.participantName ?? existing.participantName,
      });
    } else {
      await ctx.db.insert("participants", {
        presentationId: args.presentationId,
        participantId: args.participantId,
        participantName: args.participantName,
        lastSeenAt: Date.now(),
      });
    }
  },
});

export const getActiveParticipantCount = query({
  args: { presentationId: v.id("presentations") },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - PRESENCE_TIMEOUT;
    const all = await ctx.db
      .query("participants")
      .withIndex("by_presentation", (q) =>
        q.eq("presentationId", args.presentationId),
      )
      .collect();
    return all.filter((p) => p.lastSeenAt >= cutoff).length;
  },
});
