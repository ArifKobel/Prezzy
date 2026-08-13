import type { NewElement, SlideElementInput, ThemePatch } from "@Prezzy/editor-doc";
import type { ElementProps } from "@Prezzy/shared";
import * as z from "zod/v4";

export const THEME_TOKENS = ["bg", "surface", "text", "muted", "heading", "accent"] as const;

const tokenList = THEME_TOKENS.join(", ");

export const uuid = z.string().uuid();

export const elementType = z.enum([
  "heading",
  "text",
  "image",
  "shape",
  "quiz",
  "wordcloud",
  "leaderboard",
  "qrcode",
]);

export const elementProps = z.object({
  content: z
    .string()
    .describe("Rich-text HTML. Plain text must be wrapped in <p>. Inline CSS is supported for advanced formatting.")
    .optional(),
  fontSize: z.number().min(8).max(96).describe("Text size in pixels on the canonical 960x540 slide.").optional(),
  bold: z.boolean().describe("Bold heading or text without requiring HTML.").optional(),
  align: z.enum(["left", "center", "right"]).describe("Heading or text alignment.").optional(),
  src: z.string().optional(),
  color: z.string().describe(`Shape fill. Accepts a CSS color or theme token: ${tokenList}.`).optional(),
  objectFit: z.string().optional(),
  borderRadius: z.number().optional(),
  opacity: z.number().optional(),
  rotation: z.number().optional(),
  flipX: z.boolean().optional(),
  flipY: z.boolean().optional(),
  shapeType: z.string().optional(),
  question: z.string().optional(),
  options: z.array(z.string()).optional(),
  correctOption: z.number().int().optional(),
  timerSeconds: z.number().optional(),
  timeScoring: z.boolean().optional(),
  accentColor: z
    .string()
    .describe("Accent override for interactive elements. Accepts a CSS color or theme token.")
    .optional(),
  backgroundColor: z.string().describe("Background override for interactive elements only.").optional(),
  textColor: z.string().describe(`Text color. Accepts a CSS color or theme token: ${tokenList}.`).optional(),
  prompt: z.string().optional(),
  maxResponses: z.number().int().optional(),
  heightFitted: z.boolean().optional(),
}) satisfies z.ZodType<ElementProps>;

export const geometry = {
  x: z.number().describe("Left position as percent of slide width, normally 0-100."),
  y: z.number().describe("Top position as percent of slide height, normally 0-100."),
  width: z.number().positive().describe("Width as percent of slide width. Slides are 16:9 and render at 960x540."),
  height: z.number().positive().describe("Height as percent of slide height. Slides are 16:9 and render at 960x540."),
};

export const geometrySchema = z.object(geometry);

export const position = z.object({ x: geometry.x, y: geometry.y });

export const slideElementInput = z.object({
  type: elementType,
  ...geometry,
  zIndex: z
    .number()
    .int()
    .min(0)
    .describe("Zero-based stacking position within this slide. The returned zIndex is authoritative.")
    .optional(),
  props: elementProps.optional(),
}) satisfies z.ZodType<SlideElementInput>;

export const newElement = slideElementInput.extend({ slideId: uuid }) satisfies z.ZodType<NewElement>;

export const slideLayout = z.enum(["title", "bullets", "cards-grid", "stats-row", "compare-2col", "quote"]);

export const layoutItem = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  body: z.string().optional(),
});

const nullableString = z.string().nullable().optional();

export const themePatch = z.object({
  base: nullableString,
  overrides: z
    .object({
      bg: z.string().optional(),
      surface: z.string().optional(),
      text: z.string().optional(),
      muted: z.string().optional(),
      heading: z.string().optional(),
      accent: z.string().optional(),
      fontHeading: z.string().optional(),
      fontBody: z.string().optional(),
      radius: z.number().optional(),
    })
    .nullable()
    .optional(),
  primaryColor: nullableString,
  secondaryColor: nullableString,
  backgroundColor: nullableString,
  surfaceColor: nullableString,
  textColor: nullableString,
  headingFont: nullableString,
  bodyFont: nullableString,
}) satisfies z.ZodType<ThemePatch>;

export const reorderAction = z.enum(["front", "forward", "backward", "back"]);

export const presentationTitle = z.string().trim().min(1).max(200);
