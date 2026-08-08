import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { ContinueCard } from "@/components/dashboard/continue-card";
import { DashboardShell, getGreeting } from "@/components/dashboard/shell";
import { NewDraftCard } from "@/components/dashboard/new-draft-card";
import { PresentationCard } from "@/components/dashboard/presentation-card";
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
  const [mostRecent, ...rest] = presentations;

  async function handleCreateNew() {
    const created = await createPresentation({ title: "Untitled Presentation" });
    navigate({ to: "/editor/$presentationId", params: { presentationId: created.id } });
  }

  return (
    <DashboardShell activePage="dashboard">
      <div className="mx-auto max-w-[1180px]">
        <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60">
          {greeting}, {firstName.toUpperCase() || "THERE"}
        </p>
        <h1 className="mt-1 font-display text-[2rem] font-bold tracking-tight text-foreground">
          Your Creative <span className="italic text-primary">Workshop</span>
        </h1>

        {mostRecent && (
          <section className="mt-8">
            <h2 className="mb-3 font-display text-base font-semibold text-foreground">Pick up where you left off</h2>
            <ContinueCard presentation={mostRecent} />
          </section>
        )}

        <section className="mt-10">
          <div className="mb-4 flex items-baseline gap-3">
            <h2 className="font-display text-base font-semibold text-foreground">
              {mostRecent ? "All Presentations" : "Recent Presentations"}
            </h2>
            <button
              onClick={() => navigate({ to: "/presentations" })}
              className="font-sans text-[11px] font-medium uppercase tracking-wider text-primary hover:underline"
            >
              View Gallery
            </button>
          </div>
          <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rest.slice(0, 7).map((p) => (
              <PresentationCard key={p.id} presentation={p} />
            ))}
            <NewDraftCard onClick={handleCreateNew} />
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
