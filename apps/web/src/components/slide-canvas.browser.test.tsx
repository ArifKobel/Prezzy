import type { ReactElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { DESIGN_H, DESIGN_W, SlideCanvas } from '@/components/slide-canvas'
import { makeElement } from '@/tests/browser/make-element'

const LONG_TEXT =
  '<p>Sales grew across every region this quarter, with the strongest gains in EMEA and a steady recovery in APAC after a slow start to the year.</p>'

const TEXT_WITH_SHORT_LINE = `${LONG_TEXT}<p>Q3 review</p>`

const hosts: HTMLElement[] = []

afterEach(() => {
  for (const host of hosts.splice(0)) host.remove()
})

function renderInHost(ui: ReactElement) {
  const host = document.createElement('div')
  host.style.cssText = `position:absolute;left:0;top:0;width:${DESIGN_W}px;height:${DESIGN_H}px`
  document.body.appendChild(host)
  hosts.push(host)
  render(ui, { container: host })
  return host
}

function slideRoot(host: HTMLElement): HTMLElement {
  const root = host.querySelector<HTMLElement>('div.relative')
  if (!root) throw new Error('slide canvas root not found')
  return root
}

function positionedWrappers(host: HTMLElement): HTMLElement[] {
  return [...slideRoot(host).querySelectorAll<HTMLElement>(':scope > div.absolute')]
}

describe('SlideCanvas inherited text alignment', () => {
  it('keeps slide text left aligned inside a centring <button> ancestor', () => {
    const host = renderInHost(
      <button type="button" style={{ width: DESIGN_W, height: DESIGN_H }}>
        <SlideCanvas
          elements={[
            makeElement({
              id: 'text-1',
              type: 'text',
              x: 10,
              y: 10,
              width: 60,
              height: 20,
              props: { content: TEXT_WITH_SHORT_LINE, heightFitted: true },
            }),
          ]}
        />
      </button>,
    )

    const button = host.querySelector('button')
    expect(button).not.toBeNull()
    expect(getComputedStyle(button!).textAlign).toBe('center')

    const paragraphs = [...host.querySelectorAll('p')]
    expect(paragraphs).toHaveLength(2)
    for (const p of paragraphs) expect(getComputedStyle(p).textAlign).toBe('left')

    const wrapperLeft = positionedWrappers(host)[0].getBoundingClientRect().left
    const shortLine = paragraphs[1].getBoundingClientRect()
    const range = document.createRange()
    range.selectNodeContents(paragraphs[1])
    const lineBox = range.getBoundingClientRect()

    expect(lineBox.width).toBeLessThan(shortLine.width / 2)
    expect(Math.abs(lineBox.left - wrapperLeft)).toBeLessThan(1)
  })
})

describe('SlideCanvas element positioning', () => {
  it('lays out elements at percentage fractions of the 960x540 design surface', () => {
    const specs = [
      { id: 'a', x: 0, y: 0, width: 25, height: 50 },
      { id: 'b', x: 10, y: 20, width: 30, height: 40 },
      { id: 'c', x: 50, y: 50, width: 50, height: 50 },
      { id: 'd', x: 33.5, y: 12.5, width: 12.5, height: 25 },
    ]

    const host = renderInHost(
      <SlideCanvas
        elements={specs.map((s, i) =>
          makeElement({ ...s, type: 'shape', zIndex: i, props: { shapeType: 'rectangle' } }),
        )}
      />,
    )

    const rootRect = slideRoot(host).getBoundingClientRect()
    expect(rootRect.width).toBe(DESIGN_W)
    expect(rootRect.height).toBe(DESIGN_H)

    const wrappers = positionedWrappers(host)
    expect(wrappers).toHaveLength(specs.length)

    specs.forEach((spec, i) => {
      const r = wrappers[i].getBoundingClientRect()
      expect(r.left - rootRect.left).toBeCloseTo((spec.x / 100) * DESIGN_W, 1)
      expect(r.top - rootRect.top).toBeCloseTo((spec.y / 100) * DESIGN_H, 1)
      expect(r.width).toBeCloseTo((spec.width / 100) * DESIGN_W, 1)
      expect(r.height).toBeCloseTo((spec.height / 100) * DESIGN_H, 1)
    })
  })

  it('keeps percentage geometry intact when scaleToFit shrinks the surface', async () => {
    const host = renderInHost(
      <SlideCanvas
        scaleToFit
        className="h-full w-full"
        elements={[
          makeElement({
            id: 'a',
            type: 'shape',
            x: 25,
            y: 25,
            width: 50,
            height: 50,
            props: { shapeType: 'rectangle' },
          }),
        ]}
      />,
    )
    host.style.width = '480px'
    host.style.height = '270px'

    const surface = slideRoot(host)
    await expect
      .poll(() => Math.round(surface.getBoundingClientRect().width))
      .toBe(DESIGN_W / 2)

    const surfaceRect = surface.getBoundingClientRect()
    const shapeRect = positionedWrappers(host)[0].getBoundingClientRect()
    expect(surface.offsetWidth).toBe(DESIGN_W)
    expect(shapeRect.width).toBeCloseTo(surfaceRect.width * 0.5, 1)
    expect(shapeRect.height).toBeCloseTo(surfaceRect.height * 0.5, 1)
    expect(shapeRect.left - surfaceRect.left).toBeCloseTo(surfaceRect.width * 0.25, 1)
    expect(shapeRect.top - surfaceRect.top).toBeCloseTo(surfaceRect.height * 0.25, 1)
  })
})

describe('SlideCanvas text clipping', () => {
  const fitted = makeElement({
    id: 'fitted',
    type: 'text',
    x: 0,
    y: 0,
    width: 20,
    height: 10,
    props: { content: LONG_TEXT, heightFitted: true },
  })
  const unfitted = makeElement({ ...fitted, id: 'unfitted', props: { content: LONG_TEXT } })

  it('pins a heightFitted element to its stored height and hides the overflow', () => {
    const host = renderInHost(<SlideCanvas elements={[fitted]} />)
    const wrapper = positionedWrappers(host)[0]
    const inner = wrapper.firstElementChild as HTMLElement

    expect(wrapper.getBoundingClientRect().height).toBeCloseTo(0.1 * DESIGN_H, 1)
    expect(getComputedStyle(inner).overflow).toBe('hidden')
    expect(inner.clientHeight).toBeCloseTo(0.1 * DESIGN_H, 0)
    expect(inner.scrollHeight).toBeGreaterThan(inner.clientHeight)
  })

  it('grows an element without heightFitted so no content is hidden', () => {
    const host = renderInHost(<SlideCanvas elements={[unfitted]} />)
    const wrapper = positionedWrappers(host)[0]
    const inner = wrapper.firstElementChild as HTMLElement
    const wrapperHeight = wrapper.getBoundingClientRect().height

    expect(wrapperHeight).toBeGreaterThan(0.1 * DESIGN_H + 1)
    expect(inner.scrollHeight).toBe(inner.clientHeight)
    expect(inner.getBoundingClientRect().height).toBeCloseTo(wrapperHeight, 1)
  })
})

describe('SlideCanvas pointer transparency', () => {
  it('does not let rendered slide text swallow pointer hits', () => {
    const host = renderInHost(
      <SlideCanvas
        elements={[
          makeElement({
            id: 'text-1',
            type: 'text',
            x: 10,
            y: 10,
            width: 60,
            height: 20,
            props: { content: LONG_TEXT, heightFitted: true },
          }),
        ]}
      />,
    )

    const paragraph = host.querySelector('p')!
    const inner = paragraph.parentElement as HTMLElement
    expect(getComputedStyle(inner).pointerEvents).toBe('none')

    const box = paragraph.getBoundingClientRect()
    const hit = document.elementFromPoint(box.left + 4, box.top + box.height / 2)
    expect(hit).not.toBe(paragraph)
    expect(hit).not.toBe(inner)
    expect(positionedWrappers(host)[0].contains(hit)).toBe(true)
  })
})
