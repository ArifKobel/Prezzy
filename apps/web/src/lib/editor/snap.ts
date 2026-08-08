const SNAP_T = 1.2;
const MIN_VISIBLE = 5;

export type Geo = { x: number; y: number; width: number; height: number };

export function boundRange(size: number): { min: number; max: number } {
  const keep = Math.min(size * 0.25, MIN_VISIBLE);
  return { min: keep - size, max: 100 - keep };
}

export function boundPos(value: number, size: number): number {
  const { min, max } = boundRange(size);
  return Math.min(Math.max(value, min), max);
}

export function clampGroupDelta(
  items: Array<{ startX: number; startY: number; width: number; height: number }>,
  dx: number,
  dy: number,
): { dx: number; dy: number } {
  let minDX = -Infinity, maxDX = Infinity;
  let minDY = -Infinity, maxDY = Infinity;

  for (const item of items) {
    const bx = boundRange(item.width);
    const by = boundRange(item.height);
    minDX = Math.max(minDX, bx.min - item.startX);
    maxDX = Math.min(maxDX, bx.max - item.startX);
    minDY = Math.max(minDY, by.min - item.startY);
    maxDY = Math.min(maxDY, by.max - item.startY);
  }

  return {
    dx: Math.min(Math.max(dx, minDX), maxDX),
    dy: Math.min(Math.max(dy, minDY), maxDY),
  };
}
type SnapResult = { x: number; y: number; vLines: number[]; hLines: number[] };
export function snapPos(
  rawX: number, rawY: number, w: number, h: number,
  movingIds: Set<string>,
  allEls: Array<{ id: string } & Geo> | undefined,
): SnapResult {
  const xSnaps: [number, number][] = [
    [0, 0], [50 - w / 2, 50], [100 - w, 100],
  ];
  const ySnaps: [number, number][] = [
    [0, 0], [50 - h / 2, 50], [100 - h, 100],
  ];

  allEls?.forEach((g) => {
    if (movingIds.has(g.id)) return;
    const r = g.x + g.width, b = g.y + g.height;
    const cx = g.x + g.width / 2, cy = g.y + g.height / 2;
    xSnaps.push([g.x, g.x], [r - w, r], [cx - w / 2, cx], [r, r], [g.x - w, g.x]);
    ySnaps.push([g.y, g.y], [b - h, b], [cy - h / 2, cy], [b, b], [g.y - h, g.y]);
  });

  let bestX = rawX, minDX = SNAP_T;
  const vLines: number[] = [];
  for (const [target, line] of xSnaps) {
    const d = Math.abs(rawX - target);
    if (d < minDX) { minDX = d; bestX = target; vLines.length = 0; vLines.push(line); }
    else if (d < minDX + 0.01 && d < SNAP_T) vLines.push(line);
  }

  let bestY = rawY, minDY = SNAP_T;
  const hLines: number[] = [];
  for (const [target, line] of ySnaps) {
    const d = Math.abs(rawY - target);
    if (d < minDY) { minDY = d; bestY = target; hLines.length = 0; hLines.push(line); }
    else if (d < minDY + 0.01 && d < SNAP_T) hLines.push(line);
  }

  return {
    x: bestX,
    y: bestY,
    vLines: [...new Set(vLines)],
    hLines: [...new Set(hLines)],
  };
}
