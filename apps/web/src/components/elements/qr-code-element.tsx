import { QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { usePresentation } from "@/lib/api/presentations";
import { alpha, type ElementStyle } from "@/lib/quiz-constants";

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
  const bg = style?.backgroundColor || "#f6f2ea";
  const text = style?.textColor || "#231f1c";
  const accentHex = style?.accentColor || "#22574a";
  const textMuted = alpha(text, 0.4);
  const textSub = alpha(text, 0.5);
  const textFaint = alpha(text, 0.35);
  const surfaceMuted = alpha(text, 0.04);

  return (
    <div className="flex h-full w-full items-stretch overflow-hidden rounded-[var(--slide-radius)]" style={{ backgroundColor: bg }}>
      <div className="flex w-[45%] flex-col justify-center pl-[8%] pr-[4%]">
        <p className="mb-[3%] font-sans text-[0.35em] font-medium uppercase tracking-[0.05em]" style={{ color: textMuted }}>
          Interactive Session
        </p>
        <p className="mb-[5%] [font-family:var(--slide-font-heading)] text-[1.1em] font-bold leading-[1.15] tracking-[-0.02em]" style={{ color: text }}>
          Join the
          <br />
          presentation
        </p>
        <p className="mb-[8%] font-sans text-[0.4em] leading-relaxed" style={{ color: textSub }}>
          Scan the QR code or enter the session code below.
        </p>

        {(isLive || showPlaceholder) && (
          <>
            <p className="mb-[2%] font-sans text-[0.3em] font-medium uppercase tracking-[0.05em]" style={{ color: textFaint }}>
              Visit
            </p>
            <p className="mb-[6%] font-sans text-[0.45em] font-medium" style={{ color: accentHex }}>
              {isLive
                ? `${window.location.origin}/interact`
                : "yoursite.com/interact"}
            </p>
            <p className="mb-[2%] font-sans text-[0.3em] font-medium uppercase tracking-[0.05em]" style={{ color: textFaint }}>
              Session Code
            </p>
            <p className="[font-family:var(--slide-font-heading)] text-[1.2em] font-bold tracking-[0.25em]" style={{ color: text }}>
              {isLive ? joinCode : "A B C D E F"}
            </p>
          </>
        )}
      </div>

      <div className="flex w-[55%] items-center justify-center" style={{ backgroundColor: surfaceMuted }}>
        {isLive ? (
          <div className="rounded-2xl bg-white p-[8%] shadow-[0_12px_40px_rgb(35_31_28_/_0.06)]">
            <QRCodeSVG
              value={joinUrl}
              size={200}
              bgColor="#ffffff"
              fgColor={text}
              level="M"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-[8%] text-[#231f1c]/20">
            <QrCode className="size-[40%]" strokeWidth={1} />
            <p className="font-sans text-[0.4em] text-[#231f1c]/30">
              QR code appears during presentation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
