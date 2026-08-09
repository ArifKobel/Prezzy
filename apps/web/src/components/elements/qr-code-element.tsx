import { QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { usePresentation } from "@/lib/api/presentations";
import type { ElementStyle } from "@/lib/quiz-constants";

export function QRCodeElement({
  presentationId,
  showPlaceholder,
  style,
}: {
  presentationId?: string;
  showPlaceholder?: boolean;
  style?: ElementStyle;
}) {
  const { data: presentation } = usePresentation(presentationId ?? null);
  const joinCode = presentation?.joinCode ?? null;
  const joinUrl = joinCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/interact/${joinCode}`
    : null;

  const isLive = !!presentationId && !!joinUrl;
  const text = style?.textColor || "#1b1e22";

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-[0.9em]"
      style={{ backgroundColor: style?.backgroundColor, borderRadius: "var(--slide-radius)" }}
    >
      <div
        className="flex aspect-square h-[72%] max-w-full items-center justify-center overflow-hidden rounded-[var(--slide-radius)] bg-white p-[0.7em]"
        style={{ border: "1px solid var(--slide-surface)" }}
      >
        {isLive ? (
          <QRCodeSVG
            value={joinUrl}
            size={256}
            bgColor="#ffffff"
            fgColor="#1b1e22"
            level="M"
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <QrCode className="size-[70%] text-[#1b1e22] opacity-20" strokeWidth={1} />
        )}
      </div>
      {(isLive || showPlaceholder) && (
        <p
          className="text-[1.3em] font-bold tracking-[0.25em] [font-family:var(--slide-font-heading)]"
          style={{ color: text }}
        >
          {isLive ? joinCode : "ABC123"}
        </p>
      )}
    </div>
  );
}
