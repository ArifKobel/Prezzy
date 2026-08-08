# Prezzy

Prezzy is a web app for building and presenting interactive slide decks. Slides are edited on a drag-and-drop canvas, and during a presentation the audience can join via QR code to answer live quizzes and word clouds from their phones.

## Features

- Slide editor with text, images, shapes, layout presets, undo/redo and per-presentation themes (colors + fonts)
- Live quizzes with timers, scoring and a leaderboard
- Word clouds built from audience answers in real time
- Presenter mode with fullscreen slides and live response counts
- Audience join flow via QR code / join code, no account needed

## Stack

- React with TanStack Router/Start and TanStack Query, Tailwind CSS
- NestJS API with Drizzle ORM on Postgres
- socket.io for live updates during presentations
- pnpm workspaces + Turborepo

## Setup

```bash
pnpm install
pnpm run db:up      # starts Postgres via docker compose
pnpm run db:push    # creates the tables
pnpm run dev        # web on :3000, api on :3001
```

Environment files: `apps/api/.env` (database url, jwt secret, port, web origin) and `apps/web/.env` (`VITE_API_URL`). Both ship with working defaults for local development, see the `.env.example` files.

## Repo layout

```
apps/web              frontend (routes, editor, presenter, audience views)
apps/api              nestjs api (rest + websockets, drizzle schema)
packages/shared       types shared between web and api
packages/ui           shared UI components and design notes
packages/env          typed env handling
packages/config       shared tsconfig
```

## Scripts

- `pnpm run dev` - run web and api in dev mode
- `pnpm run dev:web` / `pnpm run dev:api` - only one of them
- `pnpm run db:up` / `pnpm run db:down` - start or stop the Postgres container
- `pnpm run db:push` - sync the Drizzle schema to the database
- `pnpm run build` - build all packages
- `pnpm run check-types` - type checking
