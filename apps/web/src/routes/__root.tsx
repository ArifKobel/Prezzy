import { Toaster } from "@Prezzy/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";

import { ThemeProvider } from "@/components/theme-provider";

import appCss from "@/styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Prezzy: interactive presentations with live audience participation" },
      {
        name: "description",
        content:
          "Prezzy is a web app for building presentations and running them live. Your audience joins from their phones to answer quizzes and word clouds in real time.",
      },
      { name: "application-name", content: "Prezzy" },
      { property: "og:site_name", content: "Prezzy" },
      { property: "og:title", content: "Prezzy" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://prezzy.kobel.click/" },
      {
        property: "og:description",
        content:
          "Prezzy is a web app for building presentations and running them live. Your audience joins from their phones to answer quizzes and word clouds in real time.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
      storageKey="vite-ui-theme"
    >
      <div className="h-svh">
        <Outlet />
      </div>
      <Toaster richColors />
    </ThemeProvider>
  );
}
