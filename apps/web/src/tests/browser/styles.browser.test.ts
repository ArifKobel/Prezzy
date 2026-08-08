import { afterEach, describe, expect, it } from 'vitest'

const mounted: HTMLElement[] = []

afterEach(() => {
  for (const el of mounted.splice(0)) el.remove()
})

function mount(className: string): HTMLElement {
  const el = document.createElement('div')
  el.className = className
  document.body.appendChild(el)
  mounted.push(el)
  return el
}

describe('browser test stylesheet', () => {
  it('applies Tailwind utilities generated from the app sources', () => {
    const el = mount('absolute overflow-hidden text-left pointer-events-none')
    const style = getComputedStyle(el)
    expect(style.position).toBe('absolute')
    expect(style.overflow).toBe('hidden')
    expect(style.textAlign).toBe('left')
    expect(style.pointerEvents).toBe('none')
  })

  it('exposes the design tokens from the shared globals.css', () => {
    const root = getComputedStyle(document.documentElement)
    expect(root.getPropertyValue('--color-primary').trim()).not.toBe('')
    expect(root.getPropertyValue('--font-sans')).toContain('Inter Variable')
    expect(root.getPropertyValue('--font-display')).toContain('Manrope Variable')
  })

  it('loads the self-hosted variable fonts so text metrics are real', () => {
    expect(document.fonts.check('400 14px "Inter Variable"')).toBe(true)
    expect(document.fonts.check('700 48px "Manrope Variable"')).toBe(true)
  })

  it('renders body text with the loaded Inter face rather than a fallback', () => {
    const el = mount('font-sans text-sm')
    el.textContent = 'metrics'
    expect(getComputedStyle(el).fontFamily).toContain('Inter Variable')
    expect(el.getBoundingClientRect().height).toBeGreaterThan(0)
  })
})
