# Deploy

Läuft auf Coolify. Drei Ressourcen im selben Projekt, dann teilen sie sich das Netzwerk.

**Postgres**: one-click Service, fertig.

**api**: Dockerfile `apps/api/Dockerfile`, Build-Context ist der Repo-Root, Port 3001.
Env: `DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN` (die Web-URL), `PUBLIC_URL` (die eigene URL).
Wenn `PUBLIC_URL` mit https anfängt, wird das Session-Cookie automatisch Secure.
Volume auf `/app/apps/api/uploads` mounten, sonst sind die Uploads nach jedem Deploy weg.
Beim Start läuft `drizzle-kit push`, Schema ist also immer aktuell.
Die API ist stateful (offene Yjs-Dokumente liegen im Prozessspeicher): genau eine Instanz betreiben, nicht horizontal skalieren.

**web**: Dockerfile `apps/web/Dockerfile`, Context Repo-Root, Port 3000.
Achtung: `VITE_API_URL` ist ein **Build-Arg**, kein Runtime-Env. Wird beim Build ins Bundle gebacken.

Cookies funktionieren über die Subdomains ohne Extra-Konfig (gleiche Site, SameSite=Lax).
Websockets gehen durch den Proxy einfach durch.

Lokal testen:

```
docker build -f apps/api/Dockerfile .
docker build -f apps/web/Dockerfile --build-arg VITE_API_URL=http://localhost:3001 .
```
