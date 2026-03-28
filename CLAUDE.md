# zod-to-form Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-26

## Active Technologies
- TypeScript 5.x (strict mode) + Zod v4 (peer), React 18+ (peer), React Hook Form 7+ (peer), commander, jiti, prettier, chokidar (CLI direct) (refactor/001-1-componentconfig-config)
- N/A (library/CLI tool, no persistence) (refactor/001-1-componentconfig-config)
- Browser localStorage (playground session persistence) (claude/add-z2f-playground-Cfds4)
- TypeScript 5.x (strict mode) + React 18+, CodeMirror 6, Zod v4, React Hook Form 7+, @zod-to-form/core, @zod-to-form/react, fflate (new — zip for export) (004-studio-layout-redesign)
- TypeScript 5.x (strict mode) + Zod v4 (peer), React 18+ (peer), React Hook Form 7+ (peer), @hookform/resolvers (005-api-surface-cleanup)
- N/A (library) (005-api-surface-cleanup)
- TypeScript 5.x with strict mode + Zod v4 (peer), React 18+ (peer), React Hook Form 7+ (peer), @hookform/resolvers (peer — conditional after optimization) (006-validation-optimization)

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
├── react/    # @zod-to-form/react — runtime <ZodForm> renderer (peer deps only)
└── cli/      # @zod-to-form/cli — build-time codegen CLI

specs/
└── 001-zodform/  # Feature specification, plan, and design artifacts
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
- 006-validation-optimization: Added TypeScript 5.x with strict mode + Zod v4 (peer), React 18+ (peer), React Hook Form 7+ (peer), @hookform/resolvers (peer — conditional after optimization)
- 005-api-surface-cleanup: Added TypeScript 5.x (strict mode) + Zod v4 (peer), React 18+ (peer), React Hook Form 7+ (peer), @hookform/resolvers
- 004-studio-layout-redesign: Added TypeScript 5.x (strict mode) + React 18+, CodeMirror 6, Zod v4, React Hook Form 7+, @zod-to-form/core, @zod-to-form/react, fflate (new — zip for export)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
