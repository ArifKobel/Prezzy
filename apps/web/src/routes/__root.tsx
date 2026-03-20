import { Toaster } from "@Prezzy/ui/components/sonner";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";

import { ThemeProvider } from "@/components/theme-provider";

import appCss from "@/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Prezzy" },
      { name: "description", content: "Prezzy – presentation studio" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
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
