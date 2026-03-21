import type { Id } from "@Prezzy/backend/convex/_generated/dataModel";
import { cn } from "@Prezzy/ui/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { LiveQuizElement, type QuizPhase } from "@/components/live-quiz";
import {
  resolveElementStyle,
  type PresentationTheme,
} from "@/lib/quiz-constants";
import { TextElement } from "@/components/elements/text-element";
import { ImageElement } from "@/components/elements/image-element";
import { ShapeElement } from "@/components/elements/shape-element";
import { QuizElement } from "@/components/elements/quiz-element";
import { WordCloudElement } from "@/components/elements/word-cloud-element";
import { LeaderboardElement } from "@/components/elements/leaderboard-element";
import { QRCodeElement } from "@/components/elements/qr-code-element";

export { QuizElement, WordCloudElement, LeaderboardElement, QRCodeElement };

export const DESIGN_W = 960;
export const DESIGN_H = 540;

const LIST_CLS = "[&_ul]:list-disc [&_ul]:list-inside [&_ol]:list-decimal [&_ol]:list-inside [&_li]:pl-0.5 [&_li>p]:inline";

export const HEADING_CLS =
  "h-full w-full overflow-hidden max-w-none font-display text-foreground leading-snug " +
  `[&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold [&_p]:text-xl ${LIST_CLS}`;

export const TEXT_CLS =
  "h-full w-full overflow-hidden max-w-none font-sans text-foreground leading-normal " +
  `[&_p]:text-sm ${LIST_CLS}`;

export const SHAPE_TYPES = [
  { id: "rectangle", label: "Rectangle" },
  { id: "circle", label: "Circle" },
  { id: "triangle", label: "Triangle" },
  { id: "diamond", label: "Diamond" },
  { id: "star", label: "Star" },
  { id: "arrow-right", label: "Arrow" },
  { id: "hexagon", label: "Hexagon" },
  { id: "pill", label: "Pill" },
] as const;

export type ShapeTypeId = (typeof SHAPE_TYPES)[number]["id"];

export function shapeClipPath(shapeType: string): string | undefined {
  switch (shapeType) {
    case "circle":
      return "ellipse(50% 50% at 50% 50%)";
    case "triangle":
      return "polygon(50% 0%, 0% 100%, 100% 100%)";
    case "diamond":
      return "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
    case "star":
      return "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";
    case "arrow-right":
      return "polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)";
    case "hexagon":
      return "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
    case "pill":
      return undefined;
    default:
      return undefined;
  }
}

export function elementTransform(props?: Record<string, any> | null): string | undefined {
  const parts: string[] = [];
  const rotation = props?.rotation ?? 0;
  const flipX = props?.flipX ?? false;
  const flipY = props?.flipY ?? false;
  if (rotation) parts.push(`rotate(${rotation}deg)`);
  if (flipX) parts.push("scaleX(-1)");
  if (flipY) parts.push("scaleY(-1)");
  return parts.length > 0 ? parts.join(" ") : undefined;
}

export interface SlideElement {
  _id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  props?: Record<string, any> | null;
}

export interface ElementResponses {
  [elementId: string]: Array<{ value: string; participantId: string }>;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  correct: number;
  total: number;
}

interface SlideCanvasProps {
  elements: SlideElement[];
  className?: string;
  showPlaceholders?: boolean;
  scaleToFit?: boolean;
  responses?: ElementResponses;
  leaderboard?: LeaderboardEntry[];
  presentationId?: Id<"presentations">;
  quizPhase?: QuizPhase;
  quizStartedAt?: number;
  onQuizTimerEnd?: () => void;
  onQuizQuestionEnd?: () => void;
  participantCount?: number;
  theme?: PresentationTheme | null;
}

export function SlideCanvas({
  elements,
  className,
  showPlaceholders = false,
  scaleToFit = false,
  responses,
  leaderboard,
  presentationId,
  quizPhase,
  quizStartedAt,
  onQuizTimerEnd,
  onQuizQuestionEnd,
  participantCount,
  theme,
}: SlideCanvasProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    if (!scaleToFit) return;
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setFitScale(Math.min(width / DESIGN_W, height / DESIGN_H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [scaleToFit]);

  const sorted = useMemo(
    () => [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)),
    [elements],
  );

  const inner = (
    <>
      {sorted.map((el) => {
        const content = el.props?.content ?? "";
        const isHeading = el.type === "heading";
        const isText = el.type === "text";
        const transform = elementTransform(el.props);

        return (
          <div
            key={el._id}
            className="absolute"
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.width}%`,
              ...(isHeading || isText
                ? { minHeight: `${el.height}%` }
                : { height: `${el.height}%` }),
              zIndex: el.zIndex ?? 0,
              transform,
            }}
          >
            {(isHeading || isText) && (
              <TextElement
                isHeading={isHeading}
                content={content}
                opacity={el.props?.opacity}
                showPlaceholder={showPlaceholders}
              />
            )}

            {el.type === "image" && (
              <ImageElement
                src={el.props?.src}
                objectFit={el.props?.objectFit}
                borderRadius={el.props?.borderRadius}
                opacity={el.props?.opacity}
              />
            )}

            {el.type === "shape" && (
              <ShapeElement
                shapeType={el.props?.shapeType}
                color={el.props?.color}
                borderRadius={el.props?.borderRadius}
                opacity={el.props?.opacity}
              />
            )}

            {el.type === "quiz" && presentationId && quizPhase && (
              <LiveQuizElement
                elementId={el._id as Id<"slideElements">}
                question={el.props?.question || "Your question here"}
                options={el.props?.options ?? ["Option A", "Option B"]}
                correctOption={el.props?.correctOption as number | undefined}
                timerSeconds={(el.props?.timerSeconds as number) ?? 20}
                timeScoring={(el.props?.timeScoring as boolean) ?? true}
                phase={quizPhase}
                startedAt={quizStartedAt ?? 0}
                participantCount={participantCount}
                onTimerEnd={onQuizTimerEnd}
                onQuestionEnd={onQuizQuestionEnd}
                style={resolveElementStyle(el.props, theme)}
              />
            )}
            {el.type === "quiz" && !presentationId && (
              <QuizElement el={el} theme={theme} />
            )}

            {el.type === "wordcloud" && (
              <WordCloudElement el={el} responses={responses?.[el._id]} showPlaceholder={showPlaceholders} theme={theme} />
            )}

            {el.type === "leaderboard" && (
              <LeaderboardElement leaderboard={leaderboard} showPlaceholder={showPlaceholders} style={resolveElementStyle(el.props, theme)} />
            )}

            {el.type === "qrcode" && (
              <QRCodeElement presentationId={presentationId} showPlaceholder={showPlaceholders} style={resolveElementStyle(el.props, theme)} />
            )}
          </div>
        );
      })}
    </>
  );

  const themeVars: React.CSSProperties = useMemo(() => {
    const vars: Record<string, string> = {};
    if (theme?.primaryColor) {
      vars["--color-primary"] = theme.primaryColor;
      vars["--color-primary-dim"] = theme.primaryColor;
    }
    if (theme?.secondaryColor) {
      vars["--color-secondary"] = theme.secondaryColor;
      vars["--color-secondary-container"] = theme.secondaryColor;
    }
    if (theme?.backgroundColor) {
      vars["backgroundColor"] = theme.backgroundColor;
    }
    if (theme?.textColor) {
      vars["--color-foreground"] = theme.textColor;
    }
    return vars as React.CSSProperties;
  }, [theme]);

  const hasThemeBg = !!theme?.backgroundColor;

  if (!scaleToFit) {
    return (
      <div className={cn("relative h-full w-full overflow-hidden", !hasThemeBg && "bg-card", className)} style={themeVars}>
        {inner}
      </div>
    );
  }

  return (
    <div ref={outerRef} className={cn("flex items-center justify-center overflow-hidden", className)}>
      <div
        className={cn("relative", !hasThemeBg && "bg-card")}
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${fitScale})`,
          transformOrigin: "center",
          flexShrink: 0,
          ...themeVars,
        }}
      >
        {inner}
      </div>
    </div>
  );
}
