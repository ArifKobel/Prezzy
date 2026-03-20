import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { env } from "@Prezzy/env/web";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { ConvexReactClient } from "convex/react";

import { authClient } from "@/lib/auth-client";
import Loader from "@/components/loader";
import { routeTree } from "@/routeTree.gen";

const convex = new ConvexReactClient(env.VITE_CONVEX_URL);

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: () => <Loader />,
    context: {},
    Wrap: function WrapComponent({ children }: { children: React.ReactNode }) {
      return (
        <ConvexBetterAuthProvider client={convex} authClient={authClient}>
          {children}
        </ConvexBetterAuthProvider>
      );
    },
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
