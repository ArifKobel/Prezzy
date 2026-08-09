import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import start from "./dist/server/server.js";

const port = Number(process.env.PORT ?? 3000);

const app = new Hono();
app.use("*", serveStatic({ root: "./dist/client" }));
app.all("*", (c) => start.fetch(c.req.raw));

serve({ fetch: app.fetch, port }, () => {
  console.log(`web listening on :${port}`);
});
