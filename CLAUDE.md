# zod-to-form Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-20

## Active Technologies
- TypeScript 5.x (strict mode) + Zod v4 (peer), React 18+ (peer), React Hook Form 7+ (peer), commander, jiti, prettier, chokidar (CLI direct) (refactor/001-1-componentconfig-config)
- N/A (library/CLI tool, no persistence) (refactor/001-1-componentconfig-config)
- Browser localStorage (playground session persistence) (claude/add-z2f-playground-Cfds4)
- TypeScript 5.x (strict mode) + React 18+, CodeMirror 6, Zod v4, React Hook Form 7+, @zod-to-form/core, @zod-to-form/react, fflate (new — zip for export) (004-studio-layout-redesign)
- TypeScript 5.x (strict mode) + Zod v4 (peer), React 18+ (peer), React Hook Form 7+ (peer), @hookform/resolvers (005-api-surface-cleanup)
- N/A (library) (005-api-surface-cleanup)
- TypeScript 5.x with strict mode + Zod v4 (peer), React 18+ (peer), React Hook Form 7+ (peer), @hookform/resolvers (peer — conditional after optimization) (006-validation-optimization)
- N/A — plugin is stateless between sessions; in-memory compilation cache only (007-vite-codegen-plugin)
- TypeScript 5.x (existing playground is a Vite + React app) + Vite (build), React 18+, CodeMirror 6 (existing playground deps — no new deps added) (008-deploy-playground)
- N/A (static SPA; session state in localStorage — no server) (008-deploy-playground)

- TypeScript 5.x (strict mode)
- Zod v4 (v4.0.0+) — `_zod` substrate API
- React 18+ with React Hook Form 7+
- @hookform/resolvers (zodResolver)
- Vitest for testing
- pnpm workspaces monorepo
- oxlint / oxfmt for linting and formatting
- commander, jiti, prettier, chokidar (CLI package)

## Project Structure

```text
packages/
├── core/     # @zod-to-form/core — schema walker & processors (zero deps, zod peer)
│             #   ./loader subpath — Node-only schema/config loader (jiti optional peer)
├── react/    # @zod-to-form/react — runtime <ZodForm> renderer (peer deps only)
├── codegen/  # @zod-to-form/codegen — TSX form component generator
├── cli/      # @zod-to-form/cli — build-time codegen CLI
└── vite/     # @zod-to-form/vite — Vite plugin (?z2f imports + generate mode + tree-shake)

specs/
└── <feature>/  # Feature specification, plan, and design artifacts (one dir per feature)
```

## Commands

```bash
pnpm test              # Run all tests (vitest)
pnpm run type-check    # TypeScript strict mode check
pnpm run lint          # oxlint
pnpm run format        # oxfmt
pnpm run build         # Build all packages
pnpm run dev           # Dev mode (parallel)
```

## Code Style

- TypeScript strict mode — no `any`, no `as` casts without justification
- Test-first development (TDD red-green-refactor)
- Conventional commits
- Zero unnecessary dependencies (Constitution Principle IV)
- Accessibility by default (Constitution Principle VII)

## Key Patterns

- Processor registry pattern: dispatch by `def.type` to registered processors
- FormField[] intermediate representation shared by runtime and codegen
- Metadata precedence: form registry → global registry → inferred defaults

## Recent Changes
- 008-deploy-playground: Added TypeScript 5.x (existing playground is a Vite + React app) + Vite (build), React 18+, CodeMirror 6 (existing playground deps — no new deps added)
- 007-vite-codegen-plugin: New `@zod-to-form/vite` package shipping the Vite plugin (query mode `?z2f`, generate mode, config auto-discovery + watch, resolver tree-shake). `@zod-to-form/core/loader` subpath added (jiti as optional peer); `@zod-to-form/cli/loader` is now a thin re-export. CodegenConfig + canonicalizeConfig moved to core.
- 006-validation-optimization: Added TypeScript 5.x with strict mode + Zod v4 (peer), React 18+ (peer), React Hook Form 7+ (peer), @hookform/resolvers (peer — conditional after optimization)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
