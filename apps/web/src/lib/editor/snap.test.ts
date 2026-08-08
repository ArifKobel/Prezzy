import { describe, expect, it } from "vitest";
import { boundPos, clampGroupDelta } from "@/lib/editor/snap";

const sizes = [1, 2, 3, 5, 10, 20, 40, 60, 90];

describe("boundPos", () => {
  it.each(sizes)("lets an element of size %s cross the top or left edge", (size) => {
    expect(boundPos(-1000, size)).toBeLessThan(0);
  });

  it.each(sizes)("lets an element of size %s cross the bottom or right edge", (size) => {
    expect(boundPos(1000, size)).toBeGreaterThan(100 - size);
  });

  it.each(sizes)("always keeps part of an element of size %s on the slide", (size) => {
    const atStart = boundPos(-1000, size);
    expect(atStart + size).toBeGreaterThan(0);
    expect(boundPos(1000, size)).toBeLessThan(100);
  });

  it.each(sizes)("lets at least half of an element of size %s hang over", (size) => {
    expect(boundPos(-1000, size)).toBeLessThanOrEqual(-size / 2);
  });

  it("does not move a position that is inside the slide", () => {
    expect(boundPos(30, 20)).toBe(30);
    expect(boundPos(0, 20)).toBe(0);
  });

  it("is symmetric between the two edges", () => {
    for (const size of sizes) {
      const overflowStart = -boundPos(-1000, size);
      const overflowEnd = boundPos(1000, size) - (100 - size);
      expect(overflowEnd).toBeCloseTo(overflowStart, 10);
    }
  });
});

describe("clampGroupDelta", () => {
  const group = [
    { startX: 10, startY: 10, width: 30, height: 8 },
    { startX: 60, startY: 40, width: 12, height: 3 },
    { startX: 25, startY: 70, width: 50, height: 20 },
  ];

  const applied = (dx: number, dy: number) => {
    const delta = clampGroupDelta(group, dx, dy);
    return group.map((item) => ({ x: item.startX + delta.dx, y: item.startY + delta.dy }));
  };

  const directions: Array<[string, number, number]> = [
    ["up", 0, -1000],
    ["down", 0, 1000],
    ["left", -1000, 0],
    ["right", 1000, 0],
    ["up-left", -1000, -1000],
    ["down-right", 1000, 1000],
  ];

  it.each(directions)("keeps relative positions when dragged far %s", (_name, dx, dy) => {
    const moved = applied(dx, dy);
    for (let i = 1; i < group.length; i++) {
      expect(moved[i].x - moved[0].x).toBeCloseTo(group[i].startX - group[0].startX, 10);
      expect(moved[i].y - moved[0].y).toBeCloseTo(group[i].startY - group[0].startY, 10);
    }
  });

  it.each(directions)("keeps every member on the slide when dragged far %s", (_name, dx, dy) => {
    const moved = applied(dx, dy);
    moved.forEach((pos, i) => {
      expect(pos.x + group[i].width).toBeGreaterThan(0);
      expect(pos.y + group[i].height).toBeGreaterThan(0);
      expect(pos.x).toBeLessThan(100);
      expect(pos.y).toBeLessThan(100);
    });
  });

  it("stops the whole group as soon as one member reaches its limit", () => {
    const far = applied(-1000, 0);
    const farther = applied(-2000, 0);
    expect(farther[0].x).toBeCloseTo(far[0].x, 10);
  });

  it("passes a delta through untouched while everyone stays inside", () => {
    expect(clampGroupDelta(group, 5, 5)).toEqual({ dx: 5, dy: 5 });
  });

  it("behaves like the single bound for a group of one", () => {
    const single = [{ startX: 10, startY: 10, width: 30, height: 8 }];
    const delta = clampGroupDelta(single, -1000, -1000);
    expect(10 + delta.dx).toBeCloseTo(boundPos(-1000, 30), 10);
    expect(10 + delta.dy).toBeCloseTo(boundPos(-1000, 8), 10);
  });

  it("never returns a delta that moves a group which cannot move", () => {
    const wide = [{ startX: 0, startY: 0, width: 100, height: 100 }];
    const delta = clampGroupDelta(wide, 0, 0);
    expect(delta).toEqual({ dx: 0, dy: 0 });
  });
});
