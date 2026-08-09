import { contrastOn } from "@/lib/quiz-constants";

export function SessionNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-lg font-extrabold" style={{ fontFamily: "var(--slide-font-heading)", color: "var(--slide-heading)" }}>
        Session not found
      </p>
      <p className="text-sm" style={{ color: "var(--slide-muted)" }}>
        Check the code and try again.
      </p>
      <a
        href="/interact"
        className="mt-1 px-6 py-2.5 text-sm font-bold"
        style={{
          backgroundColor: "var(--slide-accent)",
          color: contrastOn("#3b5bdb"),
          borderRadius: "var(--slide-radius)",
        }}
      >
        Try another code
      </a>
    </div>
  );
}
