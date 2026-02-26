# Project Baseline Specification

**Generated**: 2026-02-26
**Baseline Commit**: a6466ca25840af55610329c5631ce9c2d5b66f9a
**Purpose**: Establish context for all future specifications and modifications

## Executive Summary

zodforms is a schema-driven form generation library for Zod v4. It walks
Zod's internal type tree using the same processor registry pattern as
`z.toJSONSchema()`, but emits React form components instead of JSON Schema
nodes. The library supports two modes: **runtime rendering** (a drop-in
`<ZodForm>` component) and **build-time code generation** (static `.tsx`
output via CLI). The project is structured as a pnpm monorepo with three
planned packages: `core` (type tree walker and processors), `react`
(runtime renderer), and `cli` (build-time codegen).

At baseline, the project is freshly initialized from a TypeScript monorepo
template. No application code exists yet — only the monorepo scaffold,
tooling configuration, and project constitution.

## Project Structure

### Directory Layout
```
zodforms/
├── .changeset/              # Changeset release management config
├── .claude/                 # Claude Code agent skills and commands
│   ├── agents/              # Spec-kit agent definitions
│   ├── commands/            # Agent command definitions
│   └── skills/              # Claude-specific skill files
├── .codex/                  # Codex agent configuration
├── .gemini/                 # Gemini agent skills and commands
├── .github/                 # GitHub Actions workflows
│   ├── workflows/           # CI, release, security, labels, CodeQL
│   └── ISSUE_TEMPLATE/      # Issue templates
├── .specify/                # Spec-kit configuration
│   ├── extensions/          # Workflow templates (baseline, bugfix, etc.)
│   ├── memory/              # Constitution and project memory
│   ├── scripts/             # Bash automation scripts
│   └── templates/           # Spec, plan, tasks, and checklist templates
├── .vscode/                 # VS Code settings and extensions
├── docs/                    # Project documentation
├── packages/                # Monorepo packages (empty at baseline)
├── scripts/                 # Project setup and utility scripts
├── specs/                   # Specification artifacts
│   └── history/             # Baseline and state tracking
├── src/                     # Root source (placeholder only)
│   └── index.ts             # Placeholder hello() function
├── package.json             # Root monorepo config
├── pnpm-workspace.yaml      # pnpm workspace definition
├── tsconfig.json            # Root TypeScript configuration
├── vitest.config.ts         # Test configuration
├── vitest.benchmark.config.ts # Benchmark configuration
├── oxlintrc.json            # Linter configuration
├── .oxfmtrc.json            # Formatter configuration
├── Dockerfile               # Multi-stage Docker build (template)
├── AGENTS.md                # Multi-agent collaboration guide
├── CONTRIBUTING.md          # Contribution guidelines
├── SECURITY.md              # Security policy
└── README.md                # Project overview
```

### Key Components

At baseline, the repository is a scaffolded monorepo with no application
packages yet. The key structural components are:

- **Monorepo root** (`package.json`, `pnpm-workspace.yaml`): Defines the
  workspace with `packages/*` glob. All dev tooling lives at root level.
- **TypeScript config** (`tsconfig.json`): Strict mode enabled with
  `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, composite builds,
  and path aliases for `@/*` pointing to package sources.
- **Testing** (`vitest.config.ts`): Configured for `packages/**/src` and
  `packages/**/test` with V8 coverage at 80% line/function thresholds.
- **Linting/Formatting** (`oxlintrc.json`, `.oxfmtrc.json`): oxlint with
  `no-explicit-any` (warn), `no-unused-vars` (error),
  `consistent-type-imports` (error). oxfmt with semicolons, single quotes,
  2-space indent, no trailing commas.
- **Git hooks** (`simple-git-hooks` + `lint-staged`): Pre-commit runs
  oxfmt and oxlint --fix on staged files, plus `pnpm run type-check`.
- **Spec-kit** (`.specify/`): Full workflow infrastructure for
  specification-driven development including constitution, templates,
  and extension workflows.
- **Multi-agent support**: Configurations for Claude (`.claude/`),
  Gemini (`.gemini/`), and Codex (`.codex/`) agents with shared
  spec-kit skill definitions.

## Architecture

### System Overview

The planned architecture follows a three-package monorepo design that
mirrors Zod v4's own `toJSONSchema()` internal architecture:

```
zodform/core    →  Type tree walker + processor registry → FormField[]
zodform/react   →  FormField[] → React elements (runtime)
zodform/cli     →  FormField[] → .tsx source code (build-time)
```

At baseline, none of these packages exist yet. The monorepo scaffold
is ready for package creation.

### Technology Stack
- **Language(s)**: TypeScript 5.9+ (strict mode, ESNext target, NodeNext modules)
- **Framework(s)**: React 18+ (planned), React Hook Form 7+ (planned), shadcn/ui (planned)
- **Database**: N/A (this is a client-side form library)
- **Infrastructure**: pnpm 10+ workspaces, Node.js 20+, GitHub Actions CI/CD

### Design Patterns

The project constitution mandates the following patterns:

1. **Processor Registry Pattern**: A `Record<string, FormProcessor>` map
   where each Zod `def.type` has a dedicated handler that reads schema
   internals and writes to a `FormField` descriptor. This mirrors
   `zod/v4/core/json-schema-processors.ts`.

2. **Intermediate Representation**: The `FormField` interface serves as
   the single IR between Zod schema introspection and output rendering.
   Both runtime and codegen consume the same IR.

3. **Pluggable Component Map**: A `ComponentMap` abstraction allows
   swapping UI libraries (shadcn/ui, MUI, Mantine) without touching
   the core walker or processor logic.

4. **Dual Registry Metadata**: Form metadata is sourced from two Zod v4
   registries: `z.globalRegistry` for standard metadata (`.meta()`,
   `.describe()`) and a custom `z.registry<FormMeta>()` for
   form-specific overrides.

## Core Functionality

### Primary Features

At baseline, no application features are implemented. The planned
features (from the project specification) are:

1. **Core Type Tree Walker** — Recursive schema traversal via
   `schema._zod.def` dispatching to processors by type
2. **Form Processor Registry** — 18+ processors covering all Zod types
   (string, number, boolean, date, enum, file, object, array, union, etc.)
3. **Runtime Renderer** — `<ZodForm>` React component for drop-in form
   generation from a Zod schema
4. **Build-Time Code Generator** — CLI tool (`npx zodform`) that emits
   static `.tsx` form components
5. **Metadata Resolution** — Reading form hints from Zod v4's native
   registry system
6. **Custom Component Maps** — Pluggable UI library support

### User Workflows

1. **Runtime Form Rendering**: Developer imports `<ZodForm>`, passes a
   Zod schema and `onSubmit` handler, gets a fully validated form
2. **Build-Time Code Generation**: Developer runs `npx zodform --schema`
   to generate an explicit `.tsx` form component with no runtime
   dependency on zodforms
3. **Metadata Annotation**: Developer uses `z.registry<FormMeta>()` and
   `.meta()` to customize field rendering (labels, types, ordering)

## Data Model

### Core Entities

The planned data model consists of:

- **FormField**: IR descriptor with key, component name, props, label,
  description, placeholder, required flag, constraints, options, children,
  and array item template
- **FormProcessor**: Function signature
  `(schema, ctx, field, params) => void` that reads Zod internals
  and populates a FormField
- **FormProcessorContext**: Traversal state including processor registry,
  metadata registries, Seen map for cycle detection, and config options
- **FormMeta**: Shape for form-specific registry data: fieldType, order,
  hidden, gridColumn, render callback
- **ComponentMap**: Record mapping component names (Input, Select, etc.)
  to React component implementations

### Relationships

```
Zod Schema → core walker (process + processors) → FormField[]
FormField[] ← FormMeta (from z.registry) + GlobalMeta (from .meta())
FormField[] → React elements (runtime via ComponentMap)
FormField[] → .tsx source code (build-time via code emitter)
```

## External Dependencies

### Third-party Libraries

**Root devDependencies (at baseline):**

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.9.3 | TypeScript compiler |
| `vitest` | ^4.0.16 | Test runner |
| `@vitest/coverage-v8` | ^4.0.16 | Code coverage |
| `@vitest/ui` | ^4.0.16 | Test UI |
| `oxlint` | ^1.36.0 | Linter |
| `oxfmt` | ^0.21.0 | Formatter |
| `@changesets/cli` | ^2.29.8 | Release management |
| `simple-git-hooks` | ^2.13.1 | Git hooks |
| `lint-staged` | ^16.2.7 | Staged file linting |
| `@types/node` | ^25.0.3 | Node.js types |

**Planned package dependencies (not yet installed):**

- `zod` (v4+) — peer dependency for core
- `react`, `react-dom` (18+) — peer for react package
- `react-hook-form` (7+) — peer for react package
- `@hookform/resolvers` — peer for react package
- `jiti` — CLI dynamic import
- `commander` — CLI argument parsing
- `prettier` — CLI code formatting
- `chokidar` — CLI file watching

### External Services

- **GitHub Actions** — CI/CD (lint, test, build, coverage, security audit)
- **Codecov** — Coverage reporting (configured in CI workflow)
- **Renovate** — Automated dependency updates (`renovate.json`)

## Build and Deployment

### Build Process

- **Build command**: `pnpm run build` (runs `pnpm -r run build` across
  all workspace packages)
- **Type checking**: `pnpm run type-check` (runs per-package `tsc`)
- **Output**: Each package will emit to its own `dist/` directory
- **Bundle size tracking**: size-limit configured (needs updating for
  zodform packages; currently references old template packages)

### Testing Strategy

- **Framework**: Vitest with V8 coverage provider
- **Test locations**: `packages/**/test/**/*.test.ts` and
  `packages/**/src/**/*.test.ts`
- **Coverage thresholds**: 80% lines, 80% functions, 75% branches,
  80% statements
- **CI matrix**: Node.js 20.x and 24.x on Ubuntu
- **Coverage uploads**: Codecov on Node 20.x runs
- **Benchmark config**: `vitest.benchmark.config.ts` exists for
  performance benchmarking

### Deployment Process

- **Release management**: Changesets (`@changesets/cli`) with public
  access and patch-level internal dependency updates
- **CI pipeline**: GitHub Actions runs type-check → lint → format-check
  → build → test → coverage → security audit → bundle size check
- **Docker**: Multi-stage Dockerfile exists (template; needs updating
  for zodform package structure)
- **Security**: CodeQL analysis and `pnpm audit` in CI

## Configuration

### Environment Variables

From `.env.example`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `NODE_ENV` | `development` | Runtime environment |
| `LOG_LEVEL` | `info` | Logging verbosity |
| `CONTEXT7_API_KEY` | (empty) | Optional Context7 MCP server key |

### Feature Flags

No feature flags are configured at baseline.

## Known Issues and Technical Debt

### Current Limitations

1. **No application code exists** — The project is a freshly initialized
   scaffold with only a placeholder `src/index.ts`
2. **Dockerfile references old template packages** — Still references
   `packages/core` and `packages/utils` from the template; needs
   updating when zodform packages are created
3. **`.size-limit.json` references old packages** — References
   `@company/core` and `@company/utils` from the template
4. **CI workflow triggers** — Set to `master` and `develop` branches;
   may need updating for the project's actual branching strategy
5. **Changeset baseBranch** — Set to `main` but CI triggers are on
   `master`; potential mismatch

### Technical Debt

1. **Template artifacts** — Several files retain template-era references
   (Dockerfile, `.size-limit.json`, some GitHub workflow configs) that
   need updating to reflect zodform's actual package structure
2. **Missing package scaffolds** — The three planned packages
   (`core`, `react`, `cli`) need to be created with proper
   `package.json`, `tsconfig.json`, and source structure
3. **No `.editorconfig`** — AGENTS.md references `.editorconfig` but
   the file does not exist; formatting is handled by `.oxfmtrc.json`

## Future Considerations

### Planned Improvements

1. **Package creation** — Scaffold `packages/core`, `packages/react`,
   and `packages/cli` with proper TypeScript configs and dependencies
2. **Zod v4 integration** — Add `zod@^4.0.0` as peer dependency and
   implement the type tree walker based on `_zod` internals
3. **React Hook Form integration** — Wire `zodResolver` and implement
   the `<ZodForm>` component with shadcn/ui defaults
4. **CLI implementation** — Build the `npx zodform` codegen tool with
   `jiti` for dynamic schema loading
5. **Documentation** — API docs via typedoc (`typedoc.json` exists),
   usage guides, migration guide from AutoForm

### Scalability Concerns

1. **Processor extensibility** — The processor registry must support
   user-defined processors for custom Zod types without forking
2. **Component map flexibility** — Must support UI library swapping
   without touching core logic
3. **Schema complexity** — Large schemas with deep nesting, recursive
   types (`z.lazy()`), and discriminated unions need performance
   consideration in the walker
4. **Generated code quality** — CLI output must remain readable and
   maintainable as schemas grow in complexity

---
*Baseline spec created using `/speckit.baseline` workflow - See .specify/extensions/workflows/baseline/*
