import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { FileUp, LayoutTemplate } from "lucide-react";
import { DashboardShell, getGreeting } from "@/components/dashboard/shell";
import { NewDraftCard } from "@/components/dashboard/new-draft-card";
import { PresentationCard } from "@/components/dashboard/presentation-card";
import { QuickStartCard } from "@/components/dashboard/quick-start-card";
import { useMe } from "@/lib/api/auth";
import { useCreatePresentation, usePresentations } from "@/lib/api/presentations";

export const Route = createFileRoute("/dashboard")({
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <AuthGuard
      authenticated={<DashboardPage />}
      unauthenticated={<RedirectToHome />}
      loading={
        <div className="flex h-full items-center justify-center bg-surface">
          <div className="size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      }
    />
  );
}

function RedirectToHome() {
  const navigate = useNavigate();
  navigate({ to: "/" });
  return null;
}

function DashboardPage() {
  const { data: user } = useMe();
  const { data: presentations } = usePresentations();
  const createPresentation = useCreatePresentation();
  const navigate = useNavigate();

  if (user === undefined || presentations === undefined) {
    return (
      <div className="flex h-full items-center justify-center bg-surface">
        <div className="size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  const greeting = getGreeting();
  const firstName = user?.name?.split(" ")[0] ?? "";

  async function handleCreateNew() {
    const created = await createPresentation({ title: "Untitled Presentation" });
    navigate({ to: "/editor/$presentationId", params: { presentationId: created.id } });
  }

  return (
    <DashboardShell activePage="dashboard">
      <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60">
        {greeting}, {firstName.toUpperCase() || "THERE"}
      </p>
      <h1 className="mt-1 font-display text-[2rem] font-bold tracking-tight text-foreground">
        Your Creative <span className="italic text-primary">Workshop</span>
      </h1>

      <div className="mt-10 flex gap-10">
        <div className="w-72 shrink-0 space-y-8">
          <section>
            <h2 className="mb-4 font-display text-base font-semibold text-foreground">Quick Start</h2>
            <div className="space-y-2.5">
              <QuickStartCard icon={<LayoutTemplate className="size-4" />} title="From Template" desc="Browse curated layouts" />
              <QuickStartCard icon={<FileUp className="size-4" />} title="Import PDF/PPTX" desc="Convert existing slides" />
            </div>
          </section>
          <section>
            <h2 className="mb-4 font-display text-base font-semibold text-foreground">Shared with Me</h2>
            <div className="rounded-xl bg-surface-container-lowest p-4">
              <p className="font-sans text-xs text-muted-foreground/50">No shared presentations yet</p>
            </div>
          </section>
        </div>

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-foreground">Recent Presentations</h2>
            <button
              onClick={() => navigate({ to: "/presentations" })}
              className="font-sans text-[11px] font-medium uppercase tracking-wider text-primary hover:underline"
            >
              View Gallery
            </button>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {presentations?.slice(0, 5).map((p) => (
              <PresentationCard key={p.id} presentation={p} />
            ))}
            <NewDraftCard onClick={handleCreateNew} />
          </div>
        </div>
      </div>

    </DashboardShell>
  );
}
