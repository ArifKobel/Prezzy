import type { ElementProps, SlideElement } from '@Prezzy/shared'

export function makeElement(
  overrides: Partial<SlideElement> & { id: string; type: SlideElement['type'] },
): SlideElement {
  const { props, ...rest } = overrides
  return {
    slideId: 'slide-1',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    zIndex: 0,
    createdAt: 0,
    ...rest,
    props: (props ?? null) as ElementProps | null,
  }
}
