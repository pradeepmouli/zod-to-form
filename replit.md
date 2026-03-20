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
- **Testing:** Vitest (357 tests across 42 test files)
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
pnpm --filter @zod-to-form/playground test     # Unit tests (62 tests)
```

## Workflows

- **Build** — runs `pnpm run build && pnpm run test` (all packages + playground)
- **Start application** — runs playground dev server on port 5000

## Z2F Studio (Playground)

Interactive browser-based playground where developers write Zod v4 schemas in a CodeMirror editor and see live `<ZodForm>` previews.

### Features
- **Live editing**: Write Zod schemas → form updates in real-time (300ms debounce)
- **Component maps**: Switch between Default and shadcn/ui component maps
- **Runtime component compilation**: Fetch real shadcn/ui components from the registry, compile them at runtime (Sucrase + module sandbox), and use them in the live preview
- **Code tab**: Context-aware code generation — plain HTML+RHF when using Default map, ZodForm-based with custom component imports when using shadcn/custom components
- **IR Inspector**: Tree view of generated FormField[] intermediate representation
- **Examples gallery**: 7 curated example schemas (basic, advanced, patterns)
- **Config import/export**: Import/export z2f.config.json files
- **Share via URL**: lz-string compressed state in URL hash
- **Responsive layout**: Split-pane on desktop, tabbed on mobile
- **Form submission**: Submit forms and see validated data or errors
- **localStorage persistence**: Editor state persists across sessions

### Design
- **Color palette**: Navy glassmorphism theme (`--bg-base: #121821`, `--bg-surface: #181F2A`, `--bg-elevated: #1E2636`, `--accent-violet: #F97316` orange)
- **Branding**: zod-to-form logo (pink polygon + form card), Outfit font for title, "zod" teal + "form" pink
- **Glass classes**: `.glass-surface`, `.glass-panel`, `.btn-glass`, `.btn-accent`, `.input-glass`, `.modal-panel`
- **Typography**: DM Sans (UI text) + JetBrains Mono (code/editor) via Google Fonts
- **CSS**: Custom properties in globals.css, Tailwind CSS 4 utilities, `@theme` block with shadcn/ui color tokens (input, ring, muted-foreground, destructive, etc.)

### Architecture
- Web Worker evaluation pipeline: transpile (Sucrase) → evaluate (sandboxed `new Function()`) → walkSchema → FormField[]
- Import rejection in both transpile and evaluate stages
- Auto-return wrapping for last expression in user code
- Controlled scope: `z`, `zod`, `core` (defineConfig, registerDeep, registerFlat)
- Sandbox globals shadowed: `self`, `globalThis`, `fetch`, `XMLHttpRequest`, `navigator`, `WebSocket`, `EventSource`
- Component compiler: Sucrase (TSX→CJS) + module map (React, Radix UI, CVA, Lucide, cn) + `new Function` sandbox

### Bundled Radix UI packages (for runtime component compilation)
- `@radix-ui/react-checkbox`, `@radix-ui/react-switch`, `@radix-ui/react-select`
- `@radix-ui/react-label`, `@radix-ui/react-slot`, `@radix-ui/react-radio-group`
- Also bundled: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`

## Notes

- `packageManager` is pinned to `pnpm@10.26.1` (matching Replit's installed version)
- `tsgo` is available via `node_modules/.bin/tsgo` (installed as `@typescript/native-preview`)
- No database, no secrets, no environment variables required
