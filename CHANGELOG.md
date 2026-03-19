# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2026-03-19

### Changed
- **Breaking:** Unified `fieldType` and `component` into a single `component` property across all packages. Config files and registry metadata that used `fieldType` should now use `component` instead.

### Added
- Speckit review extensions and tooling config

## [0.5.0] - 2026-03-17

### Added
- `@zod-to-form/cli`: `runInit` now supports explicit `--components` and `--schemas` paths for typed imports

### Changed
- **Breaking:** Removed all deprecated type aliases and functions
- Simplified CLI codegen by removing unused section handling
- Updated CLI codegen tests to reflect current rendering behavior

## [0.4.2] - 2026-03-16

### Changed
- Refactored code structure for improved readability and maintainability
- CI: broadened pull_request trigger, excluded `sub**` branches

## [0.4.1] - 2026-03-14

### Fixed
- Normalized section config keys and typed empty `Map` return

### Changed
- Deduplicated `normalizeFieldKey` and section collection, removed unsafe casts

## [0.4.0] - 2026-03-13

### Added
- `@zod-to-form/core`: Section field grouping — group fields into named section components via `section` config
- `@zod-to-form/cli`: Auto-detect controlled components in `init` command
- `zod-to-form` skill for `npx skills add`

### Fixed
- Section grouping, node types, and component resolution
- Escaped backslashes in `renderLiteralProp` to resolve CodeQL alerts
- Replaced dynamic imports in FieldRenderer and SectionRenderer with pre-imported components to resolve CodeQL alerts

## [0.3.0] - 2026-03-12

### Added
- **Core:**
  - `controlled` and `propMap` on `ComponentEntry` for marking components as controlled
  - `propMap` on `FieldConfig` for per-field prop mapping overrides
  - `formProvider` on `ConfigDefaults`
  - `StripIndexSignature` utility type export
  - `getEmptyDefault()` for schema-inferred type-safe empty values

- **CLI:**
  - `<Controller>` pattern generation for `controlled: true` components with `propMap` support
  - `const form = useForm(...)` then destructure pattern (enables FormProvider and reset)
  - `<FormProvider {...form}>` wrapping when `formProvider: true` or `mode: 'auto-save'`
  - `defaultValues` and `values` props for external data population
  - Imports `StripIndexSignature` from `@zod-to-form/core` instead of inlining
  - `getEmptyDefault()` for type-safe array append defaults

- **React:**
  - `useController` support for controlled components in `FieldRenderer`
  - `propMap` application (component-level + per-field override) to remap RHF field props
  - `values` prop pass-through to `useForm({ values })` in `useZodForm`
  - Shared `getEmptyDefault()` for array append defaults

## [0.2.7] - 2026-03-10

### Fixed
- Verified release pipeline with patch changeset
- Removed `registry-url` from `actions/setup-node` to unblock OIDC publishing
- Removed `prepublishOnly` hooks that fail in CI with tsgo
- Avoided YAML document separator in workflow script

### Changed
- Standardized CI job name, updated to Node 24.x
- Replaced auto-approve with Copilot-driven dependency triage

## [0.2.6] - 2026-03-09

### Changed
- CI/CD automation pipeline testing and standardization
- Switched to `changesets/action@v1` with OIDC publishing
- Updated `@changesets/changelog-github` to 0.6.0

## [0.2.5] - 2026-03-09

### Changed
- Patch release for changeset automation testing

## [0.2.4] - 2026-03-09

### Changed
- Patch release for changeset automation testing

## [0.2.0] - 2026-02-26

### Added
- `@zod-to-form/core`: Schema walker using Zod v4 `_zod` substrate API (processor registry pattern)
- `@zod-to-form/core`: Processors for all Zod types — string, number, boolean, date, enum, literal, file, object, array, tuple, union, discriminatedUnion, intersection, nullable, optional, default, pipe, readonly, lazy (cycle-safe)
- `@zod-to-form/core`: `FormField[]` intermediate representation shared by runtime and CLI
- `@zod-to-form/react`: `<ZodForm>` runtime renderer backed by React Hook Form + zodResolver
- `@zod-to-form/react`: Metadata registry support via Zod v4 `.meta()` and `z.registry()`
- `@zod-to-form/react`: shadcn/ui component map (`@zod-to-form/react/shadcn`)
- `@zod-to-form/react`: Nested object fieldsets, array repeaters (add/remove with min/max guards)
- `@zod-to-form/react`: Discriminated union select with per-variant field reveal
- `@zod-to-form/cli`: `z2f generate` command with `--schema`, `--export`, `--out`, `--name` flags
- `@zod-to-form/cli`: `--server-action` flag to co-generate a Next.js server action
- `@zod-to-form/cli`: `--watch` flag for continuous regeneration on schema changes
- GitHub Actions OIDC publishing workflow
- Full test suite: 110 tests across 24 files

### Changed
- Package scope renamed from `@zodform/*` to `@zod-to-form/*`
- Version bumped from `0.0.0` to `0.2.0` across all packages

### Fixed
- `release.yml`: removed `registry-url` from `actions/setup-node` (was silently breaking OIDC)

## [0.1.0] - 2025-12-19

### Added
- Initial release
- TypeScript project template
- Basic project structure
