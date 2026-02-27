# zod-to-form Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-26

## Active Technologies

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

- 001-zodform: Feature specification and implementation plan created

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
