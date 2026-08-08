import { afterEach, describe, expect, it } from 'vitest'
import { containerScale, selectionRectsInContainer } from '@/lib/editor/selection-rects'

const PARAGRAPH =
  'Sales grew across every region this quarter, with the strongest gains in EMEA and a steady recovery in APAC after a slow start to the year.'

const FONT_SIZE = 14
const LINE_HEIGHT = 20

const mounted: HTMLElement[] = []

afterEach(() => {
  for (const el of mounted.splice(0)) el.remove()
})

function mountScaledText(scale: number) {
  const outer = document.createElement('div')
  outer.style.cssText = `position:absolute;left:40px;top:60px;transform:scale(${scale});transform-origin:top left`
  const container = document.createElement('div')
  container.style.cssText = `position:relative;width:280px;font-family:"Inter Variable",sans-serif;font-size:${FONT_SIZE}px;line-height:${LINE_HEIGHT}px`
  const p = document.createElement('p')
  p.textContent = PARAGRAPH
  p.style.cssText = 'margin:0'
  container.appendChild(p)
  outer.appendChild(container)
  document.body.appendChild(outer)
  mounted.push(outer)
  return { container, p, textNode: p.firstChild as Text }
}

function rangeOver(textNode: Text, start: number, end: number): Range {
  const range = document.createRange()
  range.setStart(textNode, start)
  range.setEnd(textNode, end)
  return range
}

function lineCountOf(p: HTMLElement, scale: number): number {
  return Math.round(p.getBoundingClientRect().height / scale / LINE_HEIGHT)
}

describe('containerScale', () => {
  it('reports 1 for an unscaled container and the CSS scale factor for a scaled one', () => {
    expect(containerScale(mountScaledText(1).container)).toBeCloseTo(1, 5)
    expect(containerScale(mountScaledText(0.8).container)).toBeCloseTo(0.8, 5)
  })
})

describe.each([1, 0.8])('selectionRectsInContainer at scale %s', (scale) => {
  it('covers the selected glyphs and stays inside the line box', () => {
    const { container, textNode } = mountScaledText(scale)
    const range = rangeOver(textNode, 6, 30)
    const rects = selectionRectsInContainer(container, range)

    expect(rects).toHaveLength(1)
    const [rect] = rects
    const viewportRect = range.getBoundingClientRect()

    expect(rect.w).toBeCloseTo(viewportRect.width / scale, 1)
    expect(rect.h).toBeCloseTo(viewportRect.height / scale, 1)
    expect(rect.h).toBeGreaterThanOrEqual(FONT_SIZE)
    expect(rect.h).toBeLessThanOrEqual(LINE_HEIGHT)
    expect(rect.y).toBeGreaterThanOrEqual(-0.5)
    expect(rect.y + rect.h).toBeLessThanOrEqual(LINE_HEIGHT + 0.5)
    expect(rect.w).toBeGreaterThan(FONT_SIZE)
    expect(rect.x).toBeGreaterThan(0)
  })

  it('produces one rect per visual line stepping by the line height', () => {
    const { container, p, textNode } = mountScaledText(scale)
    const lines = lineCountOf(p, scale)
    expect(lines).toBeGreaterThanOrEqual(3)

    const range = rangeOver(textNode, 5, PARAGRAPH.length - 5)
    const rects = selectionRectsInContainer(container, range)

    expect(rects).toHaveLength(lines)
    rects.forEach((r, i) => {
      expect(r.y - rects[0].y).toBeCloseTo(i * LINE_HEIGHT, 1)
      expect(r.h).toBeCloseTo(rects[0].h, 1)
      expect(r.y).toBeGreaterThanOrEqual(i * LINE_HEIGHT - 0.5)
      expect(r.y + r.h).toBeLessThanOrEqual((i + 1) * LINE_HEIGHT + 0.5)
      expect(r.w).toBeGreaterThan(0)
    })

    expect(rects[0].x).toBeGreaterThan(FONT_SIZE)
    expect(rects[1].x).toBeLessThan(1)
    expect(rects.at(-1)!.w).toBeLessThan(rects[1].w)
  })

  it('returns rects that land back on the text once rendered into the container', () => {
    const { container, p, textNode } = mountScaledText(scale)
    const range = rangeOver(textNode, 5, PARAGRAPH.length - 5)
    const rects = selectionRectsInContainer(container, range)

    const overlays = rects.map((r) => {
      const overlay = document.createElement('div')
      overlay.style.cssText = `position:absolute;left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`
      container.appendChild(overlay)
      return overlay
    })

    const expected = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0)
    expect(overlays).toHaveLength(expected.length)

    const pRect = p.getBoundingClientRect()
    overlays.forEach((overlay, i) => {
      const painted = overlay.getBoundingClientRect()
      expect(painted.left).toBeCloseTo(expected[i].left, 1)
      expect(painted.top).toBeCloseTo(expected[i].top, 1)
      expect(painted.width).toBeCloseTo(expected[i].width, 1)
      expect(painted.height).toBeCloseTo(expected[i].height, 1)

      const centerY = painted.top + painted.height / 2 - pRect.top
      expect(centerY).toBeGreaterThan(i * LINE_HEIGHT * scale)
      expect(centerY).toBeLessThan((i + 1) * LINE_HEIGHT * scale)
    })
  })
})

describe('selectionRectsInContainer scale independence', () => {
  it('yields identical local-space rects whether or not the container is CSS scaled', () => {
    const unscaled = mountScaledText(1)
    const scaled = mountScaledText(0.8)
    const a = selectionRectsInContainer(
      unscaled.container,
      rangeOver(unscaled.textNode, 5, PARAGRAPH.length - 5),
    )
    const b = selectionRectsInContainer(
      scaled.container,
      rangeOver(scaled.textNode, 5, PARAGRAPH.length - 5),
    )

    expect(a.length).toBeGreaterThan(1)
    expect(b).toHaveLength(a.length)
    a.forEach((rect, i) => {
      expect(b[i].x).toBeCloseTo(rect.x, 1)
      expect(b[i].y).toBeCloseTo(rect.y, 1)
      expect(b[i].w).toBeCloseTo(rect.w, 1)
      expect(b[i].h).toBeCloseTo(rect.h, 1)
    })
  })

  it('drops the zero-width rect of a collapsed caret range', () => {
    const { container, textNode } = mountScaledText(1)
    expect(selectionRectsInContainer(container, rangeOver(textNode, 12, 12))).toHaveLength(0)
  })
})
