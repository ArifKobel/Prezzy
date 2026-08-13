import type { ElementProps, ElementType } from "@Prezzy/shared";

export interface DiagnosableElement {
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  props?: ElementProps | null;
}

const common = new Set<keyof ElementProps>(["opacity", "rotation", "flipX", "flipY"]);

const supported: Record<ElementType, Set<keyof ElementProps>> = {
  heading: new Set(["content", "fontSize", "bold", "align", "textColor", "heightFitted"]),
  text: new Set(["content", "fontSize", "bold", "align", "textColor", "heightFitted"]),
  image: new Set(["src", "objectFit", "borderRadius"]),
  shape: new Set(["color", "shapeType", "borderRadius"]),
  quiz: new Set([
    "question",
    "options",
    "correctOption",
    "timerSeconds",
    "timeScoring",
    "accentColor",
    "backgroundColor",
    "textColor",
  ]),
  wordcloud: new Set(["prompt", "maxResponses", "accentColor", "backgroundColor", "textColor"]),
  leaderboard: new Set(["accentColor", "backgroundColor", "textColor"]),
  qrcode: new Set(["accentColor", "backgroundColor", "textColor"]),
};

export function elementWarnings(element: DiagnosableElement): string[] {
  const warnings: string[] = [];
  if (element.x < 0 || element.y < 0 || element.x + element.width > 100 || element.y + element.height > 100) {
    warnings.push("Element extends outside the slide bounds (0-100 percent). It will be clipped.");
  }
  const allowed = supported[element.type];
  for (const key of Object.keys(element.props ?? {}) as Array<keyof ElementProps>) {
    if (!common.has(key) && !allowed.has(key)) warnings.push(`Prop ${key} is ignored for ${element.type} elements.`);
  }
  return warnings;
}

export function warningsForElements(elements: DiagnosableElement[]): string[] {
  return elements.flatMap((element, index) =>
    elementWarnings(element).map((warning) => `Element ${index}: ${warning}`),
  );
}
