import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { ContinueCard } from "@/components/dashboard/continue-card";
import { DashboardShell } from "@/components/dashboard/shell";
import { NewDraftCard } from "@/components/dashboard/new-draft-card";
import { PresentationCard } from "@/components/dashboard/presentation-card";
import { meQueryOptions, useMe } from "@/lib/api/auth";
import {
  firstSlideElementsQueryOptions,
  presentationsQueryOptions,
  useCreatePresentation,
  usePresentations,
} from "@/lib/api/presentations";

export const Route = createFileRoute("/dashboard")({
  component: DashboardRoute,
  loader: async ({ context: { queryClient } }) => {
    const [, presentations] = await Promise.all([
      queryClient.ensureQueryData(meQueryOptions),
      queryClient.ensureQueryData(presentationsQueryOptions),
    ]);
    await Promise.all(
      presentations.slice(0, 8).map((p) => queryClient.ensureQueryData(firstSlideElementsQueryOptions(p.id))),
    );
  },
});

function DashboardRoute() {
  return (
    <AuthGuard
      authenticated={<DashboardPage />}
      unauthenticated={<RedirectToHome />}
      loading={
        <div className="flex h-full items-center justify-center">
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
      <div className="flex h-full items-center justify-center">
        <div className="size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  const [mostRecent, ...rest] = presentations;

  async function handleCreateNew() {
    const created = await createPresentation({ title: "Untitled Presentation" });
    navigate({ to: "/editor/$presentationId", params: { presentationId: created.id } });
  }

  return (
    <DashboardShell activePage="dashboard">
      <div>
        <h1 className="font-display text-5xl font-extrabold tracking-tight text-foreground">
          Dashboard<span className="text-primary">.</span>
        </h1>

        {mostRecent && (
          <section className="mt-10">
            <h2 className="mb-4 font-display text-base font-bold text-foreground">Pick up where you left off</h2>
            <ContinueCard presentation={mostRecent} />
          </section>
        )}

        <section className="mt-12">
          <div className="mb-5 flex items-baseline gap-4">
            <h2 className="font-display text-base font-bold text-foreground">
              {mostRecent ? "All presentations" : "Recent presentations"}
            </h2>
            <button
              onClick={() => navigate({ to: "/presentations" })}
              className="font-sans text-xs font-semibold text-primary hover:underline"
            >
              View all
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
