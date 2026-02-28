# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- `@zod-to-form/cli`: `zodform generate` command with `--schema`, `--export`, `--out`, `--name` flags
- `@zod-to-form/cli`: `--server-action` flag to co-generate a Next.js server action
- `@zod-to-form/cli`: `--watch` flag for continuous regeneration on schema changes
- GitHub Actions OIDC publishing workflow (`release.yml`, `changeset.yml`)
- AI agent collaboration instructions (`AGENTS.md`, `CLAUDE.md`)
- Full test suite: 110 tests across 24 files

### Changed
- Package scope renamed from `@zodform/*` to `@zod-to-form/*` (npm scope `@zodform` was taken)
- Version bumped from `0.0.0` to `0.2.0` across all packages
- CI workflows updated for OIDC, `master` branch, and correct pnpm publish command

### Fixed
- `release.yml`: removed `registry-url` from `actions/setup-node` (was silently breaking OIDC)
- `release.yml`: added `npm install -g npm@latest` (OIDC requires npm ≥ 11.5.1)
- None

### Security
- None

## [0.1.0] - 2025-12-19

### Added
- Initial release
- TypeScript project template
- Basic project structure
