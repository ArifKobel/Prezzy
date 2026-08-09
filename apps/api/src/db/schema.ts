import {
  bigint,
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import type { ElementProps, ElementType, PresentationTheme, QuizPhase } from "@/shared";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const presentations = pgTable("presentations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  joinCode: text("join_code").unique(),
  liveSlideId: uuid("live_slide_id"),
  quizElementId: uuid("quiz_element_id"),
  quizPhase: text("quiz_phase").$type<QuizPhase>(),
  quizStartedAt: bigint("quiz_started_at", { mode: "number" }),
  theme: jsonb("theme").$type<PresentationTheme>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const slides = pgTable("slides", {
  id: uuid("id").primaryKey().defaultRandom(),
  presentationId: uuid("presentation_id")
    .notNull()
    .references(() => presentations.id, { onDelete: "cascade" }),
  order: doublePrecision("order").notNull(),
  title: text("title"),
  bg: text("bg"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const slideElements = pgTable("slide_elements", {
  id: uuid("id").primaryKey().defaultRandom(),
  slideId: uuid("slide_id")
    .notNull()
    .references(() => slides.id, { onDelete: "cascade" }),
  type: text("type").$type<ElementType>().notNull(),
  x: doublePrecision("x").notNull(),
  y: doublePrecision("y").notNull(),
  width: doublePrecision("width").notNull(),
  height: doublePrecision("height").notNull(),
  zIndex: integer("z_index"),
  props: jsonb("props").$type<ElementProps>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const participants = pgTable(
  "participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    presentationId: uuid("presentation_id")
      .notNull()
      .references(() => presentations.id, { onDelete: "cascade" }),
    participantId: text("participant_id").notNull(),
    participantName: text("participant_name"),
    lastSeenAt: bigint("last_seen_at", { mode: "number" }).notNull(),
  },
  (table) => [unique("participants_presentation_participant_key").on(table.presentationId, table.participantId)],
);

export const audienceResponses = pgTable("audience_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  elementId: uuid("element_id")
    .notNull()
    .references(() => slideElements.id, { onDelete: "cascade" }),
  participantId: text("participant_id").notNull(),
  participantName: text("participant_name"),
  value: text("value").notNull(),
  correct: boolean("correct"),
  score: integer("score"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export type UserRow = typeof users.$inferSelect;
export type PresentationRow = typeof presentations.$inferSelect;
export type SlideRow = typeof slides.$inferSelect;
export type SlideElementRow = typeof slideElements.$inferSelect;
export type ParticipantRow = typeof participants.$inferSelect;
export type AudienceResponseRow = typeof audienceResponses.$inferSelect;
