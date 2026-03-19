# zod-to-form

Schema-driven form generation library for Zod v4. Walks the Zod internal type tree using a processor registry pattern to emit React form components (either at runtime or as generated static `.tsx` files).

## Project Structure

This is a **TypeScript monorepo** (no web frontend) managed with `pnpm` workspaces.

```
packages/
  core/    - @zod-to-form/core  — Zero-dependency schema walker + processor registry
  react/   - @zod-to-form/react — Runtime <ZodForm> renderer (React + react-hook-form)
  cli/     - @zod-to-form/cli   — Build-time code generator (z2f / zod-to-form CLI)
```

## Tech Stack

- **Language:** TypeScript (strict, ESM)
- **Package manager:** pnpm 10.26.1 (workspaces)
- **Build tool:** `tsgo` (`@typescript/native-preview`) — fast native TS compiler
- **Testing:** Vitest (290 tests across 33 test files)
- **Linting/Formatting:** oxlint + oxfmt

## Key Commands

```bash
pnpm install          # Install all workspace dependencies
pnpm run build        # Build all packages (tsgo)
pnpm run test         # Run all tests (vitest)
pnpm run dev          # Watch mode build
pnpm run type-check   # Type check without emit
pnpm run lint         # Lint with oxlint
```

## Workflow

The **Build** workflow runs `pnpm run build && pnpm run test` in console mode, confirming all packages compile and all tests pass.

## Notes

- `packageManager` is pinned to `pnpm@10.26.1` (matching Replit's installed version)
- `tsgo` is available via `node_modules/.bin/tsgo` (installed as `@typescript/native-preview`)
- No database, no secrets, no environment variables required
