import { Link, useNavigate } from "@tanstack/react-router";
import {
  FolderOpen, LayoutDashboard, LayoutTemplate, LogOut, Plus, Settings,
} from "lucide-react";
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
  const firstName = user?.name?.split(" ")[0] ?? "";

  async function handleCreateNew() {
    const created = await createPresentation({ title: "Untitled Presentation" });
    navigate({ to: "/editor/$presentationId", params: { presentationId: created.id } });
  }

  if (user === undefined) {
    return (
      <div className="flex h-full items-center justify-center bg-surface">
        <div className="size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      <nav className="flex items-center justify-between bg-surface/80 px-6 py-3 backdrop-blur-[20px]">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="" className="size-6" />
            <span className="font-display text-sm font-semibold tracking-tight text-foreground">Prezzy</span>
          </Link>
          <div className="flex items-center gap-1">
            <NavLink to="/dashboard" label="Dashboard" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 rounded-md bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-dim))] px-4 py-1.5 font-sans text-xs font-medium text-primary-foreground shadow-[0_4px_12px_rgb(34_87_74_/_0.25)] transition-all hover:scale-[1.02] active:scale-[0.99]"
          >
            Create New
          </button>
          <UserMenu name={user?.name} email={user?.email} onSignOut={() => logout()} />
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-56 shrink-0 flex-col justify-between bg-surface-container-low p-4">
          <div>
            <div className="mb-6 flex items-center gap-3 rounded-lg px-2 py-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-secondary-container text-primary">
                <LayoutTemplate className="size-4" />
              </div>
              <div>
                <p className="font-sans text-xs font-semibold text-foreground">{firstName || "My"} Workspace</p>
                <p className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground/60">Personal</p>
              </div>
            </div>

            <SidebarSection label="Main">
              <SidebarLink to="/dashboard" icon={<LayoutDashboard className="size-4" />} label="Dashboard" active={activePage === "dashboard"} />
            </SidebarSection>
            <SidebarSection label="Library">
              <SidebarLink to="/presentations" icon={<FolderOpen className="size-4" />} label="My Presentations" active={activePage === "presentations"} />
            </SidebarSection>
            <SidebarSection label="Management">
              <SidebarLink to="/settings" icon={<Settings className="size-4" />} label="Settings" active={activePage === "settings"} />
            </SidebarSection>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-1.5 rounded-md border border-outline-variant/20 bg-surface-container-lowest px-4 py-2 font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground transition-all hover:bg-surface-container hover:text-foreground"
          >
            <Plus className="size-3.5" /> New Project
          </button>
        </aside>

        <main className="flex-1 overflow-y-auto px-10 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}


function NavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="px-3 py-1 font-sans text-sm text-muted-foreground transition-colors hover:text-foreground"
      activeProps={{ className: "border-b-2 border-primary font-medium text-foreground" }}
    >
      {label}
    </Link>
  );
}

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="mb-1.5 px-2 font-sans text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/50">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarLink({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active?: boolean }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate({ to })}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 font-sans text-sm transition-colors ${
        active
          ? "bg-surface-container-lowest font-medium text-foreground shadow-[0_2px_8px_rgb(35_31_28_/_0.04)]"
          : "text-muted-foreground hover:bg-surface-container hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
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
        className="flex size-8 items-center justify-center rounded-full bg-secondary-container font-sans text-[11px] font-semibold text-primary ring-2 ring-primary/10 transition-all hover:ring-primary/30"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl bg-surface-container-lowest p-1.5 shadow-[0_12px_40px_rgb(35_31_28_/_0.12)]">
          <div className="px-3 py-2.5">
            <p className="font-sans text-sm font-medium text-foreground">{name}</p>
            {email && <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">{email}</p>}
          </div>
          <div className="my-1 h-px bg-outline-variant/15" />
          <button
            onClick={() => { setOpen(false); navigate({ to: "/settings" }); }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-sans text-sm text-muted-foreground transition-colors hover:bg-surface-container hover:text-foreground"
          >
            <Settings className="size-3.5" />
            Settings
          </button>
          <button
            onClick={() => { setOpen(false); onSignOut(); }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-sans text-sm text-destructive transition-colors hover:bg-destructive/8"
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

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
