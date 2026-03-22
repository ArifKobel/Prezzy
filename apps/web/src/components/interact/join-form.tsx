import { User } from "lucide-react";

export function JoinForm({
  name,
  setName,
  onJoin,
}: {
  name: string;
  setName: (name: string) => void;
  onJoin: () => void;
}) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <div className="flex size-16 items-center justify-center rounded-full bg-[#f3f4f3]">
        <User className="size-7 text-[#4e6073]" />
      </div>
      <div className="text-center">
        <h2 className="font-display text-lg font-bold text-[#2f3333]">
          What's your name?
        </h2>
        <p className="mt-1.5 font-sans text-sm text-[#2f3333]/50">
          Enter your name to participate
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) {
            onJoin();
          }
        }}
        className="flex w-full flex-col gap-3"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={30}
          className="w-full rounded-xl bg-white px-4 py-3.5 text-center font-sans text-sm text-[#2f3333] shadow-[0_2px_12px_rgba(47,51,51,0.04)] outline-none placeholder:text-[#2f3333]/25 focus:shadow-[0_2px_16px_rgba(78,96,115,0.12)]"
          autoFocus
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full rounded-xl bg-[linear-gradient(135deg,#4e6073,#425467)] py-3.5 font-sans text-sm font-semibold text-[#f4f8ff] transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
        >
          Join
        </button>
      </form>
    </div>
  );
}
