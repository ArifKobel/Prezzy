export interface LocalRect {
  x: number
  y: number
  w: number
  h: number
}

export function containerScale(container: HTMLElement): number {
  const cr = container.getBoundingClientRect()
  const scale = container.offsetWidth > 0 ? cr.width / container.offsetWidth : 1
  return scale > 0 ? scale : 1
}

export function selectionRectsInContainer(
  container: HTMLElement,
  range: Range,
): LocalRect[] {
  const cr = container.getBoundingClientRect()
  const s = containerScale(container)
  return [...range.getClientRects()]
    .filter((r) => r.width > 0 && r.height > 0)
    .map((r) => ({
      x: (r.left - cr.left) / s,
      y: (r.top - cr.top) / s,
      w: r.width / s,
      h: r.height / s,
    }))
}
