import { describe, expect, it } from "vitest";
import { elementWarnings } from "@/deck-actions/element-diagnostics";
import { layoutElements, type SlideLayout } from "@/deck-actions/slide-layouts";

const LAYOUTS: SlideLayout[] = ["title", "bullets", "cards-grid", "stats-row", "compare-2col", "quote"];

describe("element diagnostics", () => {
  it("reports ignored props and slide overflow", () => {
    expect(
      elementWarnings({
        type: "shape",
        x: 90,
        y: 10,
        width: 20,
        height: 20,
        props: { backgroundColor: "accent", color: "surface" },
      }),
    ).toEqual([
      "Element extends outside the slide bounds (0-100 percent). It will be clipped.",
      "Prop backgroundColor is ignored for shape elements.",
    ]);
  });

  it("accepts props shared by every element type", () => {
    expect(
      elementWarnings({ type: "image", x: 0, y: 0, width: 10, height: 10, props: { opacity: 50, rotation: 90 } }),
    ).toEqual([]);
  });

  it("treats a stored element without props as clean", () => {
    expect(elementWarnings({ type: "text", x: 0, y: 0, width: 10, height: 10, props: null })).toEqual([]);
  });
});

describe("semantic slide layouts", () => {
  it.each(LAYOUTS)("creates bounded %s content using native text props and theme tokens", (layout) => {
    const elements = layoutElements({
      layout,
      title: "A title",
      kicker: "A kicker",
      subtitle: "A subtitle",
      quote: "A quote",
      attribution: "A person",
      items: [
        { title: "One", subtitle: "First", body: "Body one" },
        { title: "Two", subtitle: "Second", body: "Body two" },
        { title: "Three", subtitle: "Third", body: "Body three" },
        { title: "Four", subtitle: "Fourth", body: "Body four" },
      ],
    });

    expect(elements.length).toBeGreaterThan(0);
    for (const element of elements) {
      expect(element.x).toBeGreaterThanOrEqual(0);
      expect(element.y).toBeGreaterThanOrEqual(0);
      expect(element.x + element.width).toBeLessThanOrEqual(100);
      expect(element.y + element.height).toBeLessThanOrEqual(100);
    }
    expect(elements.some((element) => element.props?.fontSize !== undefined)).toBe(true);
    expect(
      elements.some((element) =>
        ["surface", "accent", "heading", "muted"].includes(element.props?.color ?? element.props?.textColor ?? ""),
      ),
    ).toBe(true);
  });

  it.each(LAYOUTS)("never emits a prop the %s renderer would ignore", (layout) => {
    const elements = layoutElements({
      layout,
      title: "A title",
      kicker: "A kicker",
      subtitle: "A subtitle",
      quote: "A quote",
      attribution: "A person",
      items: [{ title: "One", subtitle: "First", body: "Body one" }],
    });
    expect(elements.flatMap((element) => elementWarnings(element))).toEqual([]);
  });

  it("escapes user content into the rich-text body", () => {
    const [heading] = layoutElements({ layout: "title", title: '<script>alert("x")</script>' });
    expect(heading.props?.content).toBe("<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</p>");
  });

  it("omits optional blocks that were not provided", () => {
    expect(layoutElements({ layout: "title", title: "Only a title" })).toHaveLength(1);
    expect(layoutElements({ layout: "quote", title: "T", quote: "Q" })).toHaveLength(1);
  });
});
