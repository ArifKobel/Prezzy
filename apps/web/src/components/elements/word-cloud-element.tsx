import type { ResolvedSlideTheme } from "@Prezzy/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { deriveCloudPalette, resolveElementStyle } from "@/lib/quiz-constants";
import type { SlideElement } from "@/components/slide-canvas";

const DEFAULT_CLOUD_PALETTE = ["#22574a", "#a48246", "#6d3622", "#518fb8", "#44315e", "#4e7956", "#8e5775", "#8e8780"];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

interface PlacedWord {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  rotation: number;
  opacity: number;
}

function layoutCloud(
  words: Array<{ text: string; count: number }>,
  width: number,
  height: number,
  palette: string[] = DEFAULT_CLOUD_PALETTE,
): PlacedWord[] {
  if (words.length === 0 || width === 0 || height === 0) return [];

  const maxCount = words[0].count;
  const scale = Math.min(width, height);
  const minFont = Math.max(11, scale * 0.035);
  const maxFont = scale * 0.15;
  const placed: Array<{ x: number; y: number; w: number; h: number }> = [];
  const result: PlacedWord[] = [];

  const cx = width / 2;
  const cy = height / 2;
  const aspect = width / height;

  for (const { text, count } of words.slice(0, 50)) {
    const weight = maxCount > 1 ? count / maxCount : 1;
    const fontSize = minFont + Math.pow(weight, 0.7) * (maxFont - minFont);
    const h = hashStr(text);
    const color = palette[h % palette.length];
    const opacity = 0.55 + weight * 0.45;

    const charW = fontSize * 0.6;
    const boxW = text.length * charW + fontSize * 0.15;
    const boxH = fontSize * 1.15;

    let found = false;
    let px = 0;
    let py = 0;

    for (let step = 0; step < 800; step++) {
      const angle = step * 0.2;
      const radius = step * scale * 0.0015;
      const tx = cx + Math.cos(angle) * radius * aspect - boxW / 2;
      const ty = cy + Math.sin(angle) * radius - boxH / 2;

      if (tx < 4 || ty < 4 || tx + boxW > width - 4 || ty + boxH > height - 4) continue;

      let collides = false;
      for (const p of placed) {
        if (tx < p.x + p.w + 1 && tx + boxW + 1 > p.x && ty < p.y + p.h && ty + boxH > p.y) {
          collides = true;
          break;
        }
      }

      if (!collides) {
        px = tx;
        py = ty;
        found = true;
        break;
      }
    }

    if (found) {
      placed.push({ x: px, y: py, w: boxW, h: boxH });
      result.push({
        text,
        x: px + boxW / 2,
        y: py + boxH / 2,
        fontSize,
        color,
        rotation: 0,
        opacity,
      });
    }
  }

  return result;
}

export function WordCloudElement({
  el,
  responses,
  showPlaceholder,
  theme,
}: {
  el: SlideElement;
  responses?: Array<{ value: string }>;
  showPlaceholder?: boolean;
  theme?: ResolvedSlideTheme | null;
}) {
  const s = resolveElementStyle(el.props, theme);
  const cloudPalette = s.accentColor ? deriveCloudPalette(s.accentColor) : DEFAULT_CLOUD_PALETTE;
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const words = useMemo(() => {
    const counts = new Map<string, number>();
    if (responses) {
      for (const r of responses) {
        const w = r.value.toLowerCase().trim();
        if (w) counts.set(w, (counts.get(w) ?? 0) + 1);
      }
    }
    if (counts.size === 0 && showPlaceholder) {
      return [
        { text: "ideas", count: 8 },
        { text: "creative", count: 6 },
        { text: "innovation", count: 5 },
        { text: "teamwork", count: 4 },
        { text: "growth", count: 3 },
        { text: "design", count: 3 },
        { text: "future", count: 2 },
        { text: "collaborate", count: 2 },
        { text: "inspire", count: 2 },
        { text: "build", count: 1 },
      ];
    }
    return [...counts.entries()]
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count);
  }, [responses, showPlaceholder]);

  const placedWords = useMemo(
    () => layoutCloud(words, size.w, size.h, cloudPalette),
    [words, size.w, size.h, cloudPalette],
  );

  const hasWords = words.length > 0;

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden p-[3%]"
      style={{ backgroundColor: s.backgroundColor, borderRadius: "var(--slide-radius)" }}
    >
      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        {hasWords && placedWords.length > 0 ? (
          placedWords.map((w) => (
            <span
              key={w.text}
              className="absolute whitespace-nowrap font-bold leading-none [font-family:var(--slide-font-heading)]"
              style={{
                left: w.x,
                top: w.y,
                fontSize: w.fontSize,
                color: w.color,
                opacity: w.opacity,
                transform: `translate(-50%, -50%)${w.rotation ? ` rotate(${w.rotation}deg)` : ""}`,
              }}
            >
              {w.text}
            </span>
          ))
        ) : !hasWords ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[0.5em] opacity-40 [color:var(--slide-muted)]">
              Waiting for responses...
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
