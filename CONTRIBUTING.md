# Contributing

## Setup

See the [README](README.md) for prerequisites, environment files and the local setup (`pnpm install`, `pnpm run db:up`, `pnpm run db:push`, `pnpm run dev`).

## Workflow

1. Branch off `main`.
2. Make your changes. New logic gets a test next to the code it covers.
3. Run the checks before pushing:

```bash
pnpm run lint
pnpm run check-types
pnpm run test
```

4. Open a pull request against `main`. CI runs the same checks plus a build and must pass.

## Commit convention

Commits follow [Conventional Commits](https://www.conventionalcommits.org):

```
<type>(<scope>): <subject>
```

- **type**: one of `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci`
- **scope**: optional, the workspace package or area (`web`, `api`, `shared`, `ui`, `editor`, `collab`)
- **subject**: lowercase, imperative, no trailing period

Examples:

```
feat(editor): add snap lines while dragging elements
fix(collab): log join failures instead of swallowing them
docs: add contributing guide
chore: bump drizzle to 0.44
```

Keep commits focused: one logical change per commit. A body is only needed when the why is not obvious from the diff.

## Code style

- Biome handles formatting and linting (`pnpm run lint`), no manual style debates
- No code comments explaining what code does; write code that explains itself
- Reuse what exists in the workspace before adding new dependencies
