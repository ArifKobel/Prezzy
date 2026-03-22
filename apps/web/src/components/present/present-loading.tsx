export function PresentLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <p className="font-sans text-sm text-white/50">Loading...</p>
    </div>
  );
}
