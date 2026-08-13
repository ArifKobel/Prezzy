import type { SlideElementInput } from "@Prezzy/editor-doc";

export type SlideLayout = "title" | "bullets" | "cards-grid" | "stats-row" | "compare-2col" | "quote";

export interface LayoutItem {
  title: string;
  subtitle?: string;
  body?: string;
}

export interface LayoutContent {
  layout: SlideLayout;
  title: string;
  kicker?: string;
  subtitle?: string;
  items?: LayoutItem[];
  quote?: string;
  attribution?: string;
}

const MARGIN = 7;
const CONTENT_WIDTH = 100 - MARGIN * 2;
const BODY_TOP = 31;
const GUTTER = 2;

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

interface TextBox {
  type: "heading" | "text";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  bold?: boolean;
  align?: "left" | "center" | "right";
  textColor?: string;
}

const text = ({ type, content, x, y, width, height, fontSize, ...style }: TextBox): SlideElementInput => ({
  type,
  x,
  y,
  width,
  height,
  props: { content: `<p>${escapeHtml(content)}</p>`, fontSize, heightFitted: true, ...style },
});

const shape = (x: number, y: number, width: number, height: number): SlideElementInput => ({
  type: "shape",
  x,
  y,
  width,
  height,
  props: { color: "surface", borderRadius: 12 },
});

const sectionHeading = (content: LayoutContent): SlideElementInput[] => [
  ...(content.kicker
    ? [
        text({
          type: "text",
          content: content.kicker.toUpperCase(),
          x: MARGIN,
          y: 7,
          width: CONTENT_WIDTH,
          height: 5,
          fontSize: 12,
          bold: true,
          textColor: "accent",
        }),
      ]
    : []),
  text({
    type: "heading",
    content: content.title,
    x: MARGIN,
    y: 13,
    width: CONTENT_WIDTH,
    height: 14,
    fontSize: 38,
    bold: true,
    textColor: "heading",
  }),
];

const layouts: Record<SlideLayout, (content: LayoutContent) => SlideElementInput[]> = {
  title: (content) => [
    ...(content.kicker
      ? [
          text({
            type: "text",
            content: content.kicker.toUpperCase(),
            x: 10,
            y: 28,
            width: 80,
            height: 5,
            fontSize: 14,
            bold: true,
            align: "center",
            textColor: "accent",
          }),
        ]
      : []),
    text({
      type: "heading",
      content: content.title,
      x: 10,
      y: 36,
      width: 80,
      height: 18,
      fontSize: 48,
      bold: true,
      align: "center",
      textColor: "heading",
    }),
    ...(content.subtitle
      ? [
          text({
            type: "text",
            content: content.subtitle,
            x: 18,
            y: 58,
            width: 64,
            height: 12,
            fontSize: 20,
            align: "center",
            textColor: "muted",
          }),
        ]
      : []),
  ],

  bullets: (content) => [
    ...sectionHeading(content),
    ...(content.items ?? []).slice(0, 6).flatMap((item, index) => {
      const y = BODY_TOP + index * 10;
      return [
        shape(8, y, 2, 2),
        text({
          type: "text",
          content: item.title,
          x: 12,
          y: y - 2.5,
          width: 78,
          height: 7,
          fontSize: 22,
          bold: true,
        }),
        ...(item.body
          ? [
              text({
                type: "text",
                content: item.body,
                x: 12,
                y: y + 3,
                width: 78,
                height: 5,
                fontSize: 14,
                textColor: "muted",
              }),
            ]
          : []),
      ];
    }),
  ],

  "cards-grid": (content) => [
    ...sectionHeading(content),
    ...(content.items ?? []).slice(0, 4).flatMap((item, index) => {
      const x = MARGIN + (index % 2) * 44;
      const y = BODY_TOP + Math.floor(index / 2) * 30;
      return [
        shape(x, y, 42, 26),
        text({
          type: "heading",
          content: item.title,
          x: x + 3,
          y: y + 3,
          width: 36,
          height: 6,
          fontSize: 20,
          bold: true,
        }),
        ...(item.subtitle
          ? [
              text({
                type: "text",
                content: item.subtitle,
                x: x + 3,
                y: y + 10,
                width: 36,
                height: 4,
                fontSize: 12,
                bold: true,
                textColor: "accent",
              }),
            ]
          : []),
        ...(item.body
          ? [
              text({
                type: "text",
                content: item.body,
                x: x + 3,
                y: y + 15,
                width: 36,
                height: 8,
                fontSize: 13,
                textColor: "muted",
              }),
            ]
          : []),
      ];
    }),
  ],

  "stats-row": (content) => {
    const stats = (content.items ?? []).slice(0, 4);
    const width = (CONTENT_WIDTH - Math.max(0, stats.length - 1) * GUTTER) / Math.max(1, stats.length);
    return [
      ...sectionHeading(content),
      ...stats.flatMap((item, index) => {
        const x = MARGIN + index * (width + GUTTER);
        return [
          shape(x, 37, width, 35),
          text({
            type: "heading",
            content: item.title,
            x: x + 2,
            y: 43,
            width: width - 4,
            height: 10,
            fontSize: 34,
            bold: true,
            align: "center",
            textColor: "accent",
          }),
          text({
            type: "text",
            content: item.subtitle ?? item.body ?? "",
            x: x + 2,
            y: 57,
            width: width - 4,
            height: 8,
            fontSize: 14,
            align: "center",
            textColor: "muted",
          }),
        ];
      }),
    ];
  },

  "compare-2col": (content) => [
    ...sectionHeading(content),
    ...(content.items ?? []).slice(0, 2).flatMap((item, index) => {
      const x = MARGIN + index * 44;
      return [
        shape(x, BODY_TOP, 42, 56),
        text({
          type: "heading",
          content: item.title,
          x: x + 4,
          y: 36,
          width: 34,
          height: 8,
          fontSize: 24,
          bold: true,
          textColor: index === 0 ? "heading" : "accent",
        }),
        ...(item.subtitle
          ? [
              text({
                type: "text",
                content: item.subtitle,
                x: x + 4,
                y: 47,
                width: 34,
                height: 5,
                fontSize: 13,
                bold: true,
                textColor: "muted",
              }),
            ]
          : []),
        text({
          type: "text",
          content: item.body ?? "",
          x: x + 4,
          y: 56,
          width: 34,
          height: 24,
          fontSize: 16,
        }),
      ];
    }),
  ],

  quote: (content) => [
    ...(content.kicker
      ? [
          text({
            type: "text",
            content: content.kicker.toUpperCase(),
            x: 12,
            y: 20,
            width: 76,
            height: 5,
            fontSize: 13,
            bold: true,
            align: "center",
            textColor: "accent",
          }),
        ]
      : []),
    text({
      type: "heading",
      content: content.quote ?? content.title,
      x: 12,
      y: 29,
      width: 76,
      height: 30,
      fontSize: 36,
      bold: true,
      align: "center",
      textColor: "heading",
    }),
    ...(content.attribution
      ? [
          text({
            type: "text",
            content: content.attribution,
            x: 20,
            y: 66,
            width: 60,
            height: 6,
            fontSize: 16,
            align: "center",
            textColor: "muted",
          }),
        ]
      : []),
  ],
};

export const layoutElements = (content: LayoutContent): SlideElementInput[] => layouts[content.layout](content);
