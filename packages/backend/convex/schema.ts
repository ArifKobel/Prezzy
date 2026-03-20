import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  presentations: defineTable({
    title: v.string(),
    userId: v.optional(v.string()),
    joinCode: v.optional(v.string()),
    liveSlideId: v.optional(v.id("slides")),
    quizState: v.optional(
      v.object({
        elementId: v.id("slideElements"),
        phase: v.union(
          v.literal("question"),
          v.literal("answering"),
          v.literal("results"),
        ),
        startedAt: v.number(),
      }),
    ),
    theme: v.optional(
      v.object({
        primaryColor: v.optional(v.string()),
        secondaryColor: v.optional(v.string()),
        backgroundColor: v.optional(v.string()),
        surfaceColor: v.optional(v.string()),
        textColor: v.optional(v.string()),
        headingFont: v.optional(v.string()),
        bodyFont: v.optional(v.string()),
      }),
    ),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_joinCode", ["joinCode"]),

  slides: defineTable({
    presentationId: v.id("presentations"),
    order: v.number(),
    title: v.optional(v.string()),
    type: v.optional(v.string()),
    content: v.optional(v.any()),
  }).index("by_presentation_order", ["presentationId", "order"]),

  slideElements: defineTable({
    slideId: v.id("slides"),
    zIndex: v.optional(v.number()),
    type: v.union(
      v.literal("heading"),
      v.literal("text"),
      v.literal("image"),
      v.literal("shape"),
      v.literal("quiz"),
      v.literal("wordcloud"),
      v.literal("leaderboard"),
      v.literal("qrcode"),
    ),
    x: v.number(),
    y: v.number(),
    width: v.number(),
    height: v.number(),
    props: v.optional(
      v.object({
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
      }),
    ),
  }).index("by_slide", ["slideId"]),

  participants: defineTable({
    presentationId: v.id("presentations"),
    participantId: v.string(),
    participantName: v.optional(v.string()),
    lastSeenAt: v.number(),
  })
    .index("by_presentation", ["presentationId"])
    .index("by_presentation_participant", ["presentationId", "participantId"]),

  audienceResponses: defineTable({
    elementId: v.optional(v.id("slideElements")),
    activityId: v.optional(v.any()),
    participantId: v.string(),
    participantName: v.optional(v.string()),
    value: v.string(),
    correct: v.optional(v.boolean()),
    score: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_element", ["elementId"]),
});
