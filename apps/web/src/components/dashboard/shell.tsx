import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLogout, useMe } from "@/lib/api/auth";
import { useCreatePresentation } from "@/lib/api/presentations";

export function DashboardShell({ activePage, children }: {
  activePage: "dashboard" | "presentations" | "settings";
  children: React.ReactNode;
}) {
  const { data: user } = useMe();
  const createPresentation = useCreatePresentation();
  const logout = useLogout();
  const navigate = useNavigate();

  async function handleCreateNew() {
    const created = await createPresentation({ title: "Untitled Presentation" });
    navigate({ to: "/editor/$presentationId", params: { presentationId: created.id } });
  }

  if (user === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <nav className="flex items-center justify-between border-b border-border px-8 py-4">
        <div className="flex items-baseline gap-10">
          <Link to="/dashboard" className="font-display text-lg font-extrabold tracking-tight text-foreground">
            Prezzy<span className="text-primary">.</span>
          </Link>
          <div className="flex items-center gap-6">
            <NavLink to="/dashboard" label="Dashboard" active={activePage === "dashboard"} />
            <NavLink to="/presentations" label="Presentations" active={activePage === "presentations"} />
            <NavLink to="/settings" label="Settings" active={activePage === "settings"} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateNew}
            className="bg-primary px-4 py-2 font-sans text-xs font-bold text-primary-foreground transition-colors hover:bg-primary-dim"
          >
            Create New
          </button>
          <UserMenu name={user?.name} email={user?.email} onSignOut={() => logout()} />
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto px-8 py-10">
        <div className="mx-auto w-full max-w-[1180px]">{children}</div>
      </main>
    </div>
  );
}

function NavLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`pb-0.5 font-sans text-sm font-semibold transition-colors ${
        active
          ? "border-b-2 border-primary text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

function UserMenu({ name, email, onSignOut }: { name?: string; email?: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const initials = (name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 items-center justify-center rounded-full bg-secondary-container font-sans text-[11px] font-bold text-foreground ring-1 ring-border transition-shadow hover:ring-primary"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 border border-border bg-popover p-1.5 shadow-[0_12px_40px_rgb(0_0_0_/_0.35)]">
          <div className="px-3 py-2.5">
            <p className="font-sans text-sm font-bold text-foreground">{name}</p>
            {email && <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">{email}</p>}
          </div>
          <div className="my-1 h-px bg-border" />
          <button
            onClick={() => { setOpen(false); navigate({ to: "/settings" }); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 font-sans text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Settings className="size-3.5" />
            Settings
          </button>
          <button
            onClick={() => { setOpen(false); onSignOut(); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 font-sans text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function formatTimeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
