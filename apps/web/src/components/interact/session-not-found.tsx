export function SessionNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="font-display text-lg font-bold text-[#2f3333]">
        Session not found
      </p>
      <p className="font-sans text-sm text-[#2f3333]/50">
        Check the code and try again.
      </p>
      <a
        href="/interact"
        className="mt-1 rounded-xl bg-[linear-gradient(135deg,#4e6073,#425467)] px-6 py-2.5 font-sans text-sm font-semibold text-[#f4f8ff] transition-transform hover:scale-[1.02]"
      >
        Try another code
      </a>
    </div>
  );
}
