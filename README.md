# Prezzy

Prezzy is a web app for building and presenting interactive slide decks. Slides are edited on a drag-and-drop canvas, and during a presentation the audience can join via QR code to answer live quizzes and word clouds from their phones.

## Features

- Slide editor with text, images, shapes, layout presets, undo/redo and per-presentation themes (colors + fonts)
- Live quizzes with timers, scoring and a leaderboard
- Word clouds built from audience answers in real time
- Presenter mode with fullscreen slides and live response counts
- Audience join flow via QR code / join code, no account needed

## Stack

- React with TanStack Router/Start, Tailwind CSS
- Convex as backend (data + realtime subscriptions)
- Better-Auth for authentication
- pnpm workspaces + Turborepo

## Setup

```bash
pnpm install
pnpm run dev:setup   # creates/links the Convex project, follow the prompts
```

Copy the environment variables from `packages/backend/.env.local` into `apps/web/.env`, then:

```bash
pnpm run dev
```

The app runs on http://localhost:3000.

## Repo layout

```
apps/web              frontend (routes, editor, presenter, audience views)
packages/backend      Convex functions and schema
packages/ui           shared UI components and design notes
packages/env          typed env handling
packages/config       shared tsconfig
```

## Scripts

- `pnpm run dev` - run everything in dev mode
- `pnpm run dev:web` - frontend only
- `pnpm run build` - build all packages
- `pnpm run check-types` - type checking
