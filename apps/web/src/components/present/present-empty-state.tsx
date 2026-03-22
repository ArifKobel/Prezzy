export function PresentEmptyState({
  message,
  onExit,
}: {
  message: string;
  onExit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-black">
      <p className="font-sans text-sm text-white/50">{message}</p>
      <button
        onClick={onExit}
        className="rounded-md bg-white/10 px-4 py-2 font-sans text-sm text-white/70 transition-colors hover:bg-white/20"
      >
        Back to Editor
      </button>
    </div>
  );
}
