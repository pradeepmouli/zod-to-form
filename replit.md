# zod-to-form

Schema-driven form generation library for Zod v4. Walks the Zod internal type tree using a processor registry pattern to emit React form components (either at runtime or as generated static `.tsx` files).

## Project Structure

This is a **TypeScript monorepo** managed with `pnpm` workspaces.

```
packages/
  core/    - @zod-to-form/core  — Zero-dependency schema walker + processor registry
  react/   - @zod-to-form/react — Runtime <ZodForm> renderer (React + react-hook-form)
  cli/     - @zod-to-form/cli   — Build-time code generator (z2f / zod-to-form CLI)
apps/
  playground/ - @zod-to-form/playground — Z2F Studio interactive browser playground
```

## Tech Stack

- **Language:** TypeScript (strict, ESM)
- **Package manager:** pnpm 10.26.1 (workspaces)
- **Build tool:** `tsgo` (`@typescript/native-preview`) for packages; Vite for playground
- **Testing:** Vitest (320 tests across 38 test files)
- **Linting/Formatting:** oxlint + oxfmt
- **Playground:** React 19, CodeMirror 6, Tailwind CSS 4, Sucrase, lz-string

## Key Commands

```bash
pnpm install          # Install all workspace dependencies
pnpm run build        # Build all packages + playground
pnpm run test         # Run all tests (vitest)
pnpm run dev          # Watch mode build
pnpm run type-check   # Type check without emit
pnpm run lint         # Lint with oxlint
```

### Playground-specific

```bash
pnpm --filter @zod-to-form/playground dev      # Dev server on port 5000
pnpm --filter @zod-to-form/playground build    # Production build (static SPA)
pnpm --filter @zod-to-form/playground test     # Unit tests (30 tests)
```

## Workflows

- **Build** — runs `pnpm run build && pnpm run test` (all packages + playground)
- **Start application** — runs playground dev server on port 5000

## Z2F Studio (Playground)

Interactive browser-based playground where developers write Zod v4 schemas in a CodeMirror editor and see live `<ZodForm>` previews.

### Features
- **Live editing**: Write Zod schemas → form updates in real-time (300ms debounce)
- **Component maps**: Switch between Default and shadcn/ui component maps
- **IR Inspector**: Tree view of generated FormField[] intermediate representation
- **Examples gallery**: 7 curated example schemas (basic, advanced, patterns)
- **Config import/export**: Import/export z2f.config.json files
- **Share via URL**: lz-string compressed state in URL hash
- **Responsive layout**: Split-pane on desktop, tabbed on mobile
- **Form submission**: Submit forms and see validated data or errors
- **localStorage persistence**: Editor state persists across sessions

### Architecture
- Web Worker evaluation pipeline: transpile (Sucrase) → evaluate (sandboxed `new Function()`) → walkSchema → FormField[]
- Import rejection in both transpile and evaluate stages
- Auto-return wrapping for last expression in user code
- Controlled scope: `z`, `zod`, `core` (defineConfig, registerDeep, registerFlat)

## Notes

- `packageManager` is pinned to `pnpm@10.26.1` (matching Replit's installed version)
- `tsgo` is available via `node_modules/.bin/tsgo` (installed as `@typescript/native-preview`)
- No database, no secrets, no environment variables required
