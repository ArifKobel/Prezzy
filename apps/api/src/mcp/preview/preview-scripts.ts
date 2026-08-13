interface PreviewImage {
  complete: boolean;
  addEventListener: (event: string, listener: () => void, options: { once: boolean }) => void;
}

interface PreviewElement {
  dataset: { slideElementId?: string; slideElementType?: string };
  firstElementChild: { scrollHeight: number; clientHeight: number; scrollWidth: number; clientWidth: number } | null;
}

interface PreviewDocument {
  fonts: { ready: Promise<unknown> };
  images: Iterable<PreviewImage>;
  querySelectorAll: (selector: string) => Iterable<PreviewElement>;
}

declare const document: PreviewDocument;

export async function waitForAssets(): Promise<void> {
  await document.fonts.ready;
  await Promise.all(
    [...document.images].map((image) =>
      image.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          }),
    ),
  );
}

export function clippedTextWarnings(): string[] {
  const selector = '[data-slide-element-type="heading"], [data-slide-element-type="text"]';
  return [...document.querySelectorAll(selector)].flatMap((element) => {
    const content = element.firstElementChild;
    if (!content) return [];
    const clipped =
      content.scrollHeight > content.clientHeight + 1 || content.scrollWidth > content.clientWidth + 1;
    return clipped ? [`Element ${element.dataset.slideElementId ?? "unknown"} text is clipped by its box.`] : [];
  });
}
