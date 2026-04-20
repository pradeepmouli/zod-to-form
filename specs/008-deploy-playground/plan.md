# Implementation Plan: Deploy Playground

**Branch**: `008-deploy-playground` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-deploy-playground/spec.md`

## Summary

Deploy the existing playground application (`apps/playground/`) to `zod.toform.dev/playground` as a subpath of the existing Cloudflare Pages docs site. The build pipeline must produce both the Docusaurus docs and the Vite playground in a single output directory, deploy automatically on push to master, and update docs site navigation to link to the live playground.

## Technical Context

**Language/Version**: TypeScript 5.x (existing playground is a Vite + React app)
**Primary Dependencies**: Vite (build), React 18+, CodeMirror 6 (existing playground deps — no new deps added)
**Storage**: N/A (static SPA; session state in localStorage — no server)
**Testing**: Vitest (existing playground test suite)
**Target Platform**: Cloudflare Pages (existing deployment for zod.toform.dev)
**Project Type**: Static site deployment (infrastructure/CI change, not a library feature)
**Performance Goals**: Page load under 3 seconds on broadband
**Constraints**: Single CF Pages project serves both docs and playground; playground at /playground subpath
**Scale/Scope**: Public static site on CDN — scales automatically

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Zod-Native Architecture | N/A | No schema processing in this feature |
| II. Processor Registry Pattern | N/A | No walker changes |
| III. Dual-Mode Output | N/A | No output mode changes |
| IV. Zero Unnecessary Dependencies | PASS | No new dependencies added — this is a build/deploy configuration change |
| V. Test-First Development | PASS | Existing playground tests validate build correctness; deployment verified by URL check |
| VI. Type Safety First | N/A | No new TypeScript code beyond config |
| VII. Accessibility by Default | N/A | Playground accessibility is pre-existing (not changed by deployment) |

**Gate result**: PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/008-deploy-playground/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── spec.md              # Feature specification
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
apps/
├── docs/                  # Docusaurus docs site (existing)
│   ├── docusaurus.config.ts  # Update nav links
│   └── src/pages/index.tsx   # Remove "coming soon" badge
├── playground/            # Vite playground app (existing)
│   ├── vite.config.ts    # Set base: '/playground/' for subpath deployment
│   └── dist/             # Build output
scripts/
└── build-site.sh         # NEW: combined build script for CF Pages
```

**Structure Decision**: No new packages or directories. The change is a build orchestration script that combines both app outputs into a single directory for CF Pages, plus config tweaks for subpath serving.

## Architecture

### Build Pipeline

The Cloudflare Pages build command runs a script that:
1. Installs dependencies (`pnpm install --frozen-lockfile`)
2. Builds all packages (`pnpm run build`)
3. Builds docs (`pnpm --filter @zod-to-form/docs build`)
4. Builds playground (`pnpm --filter @zod-to-form/playground build`)
5. Copies playground dist into docs output at `apps/docs/build/playground/`

The final output directory for CF Pages remains `apps/docs/build` — now containing both the Docusaurus site and the playground under `/playground/`.

### Subpath Configuration

The playground Vite config must set `base: '/playground/'` so all asset paths are correct when served from the subpath. This is conditional — only during the CF Pages build (detected via `CF_PAGES` env var), so local dev (`pnpm dev`) remains unaffected.

### Navigation Updates

- `docusaurus.config.ts`: Update navbar Playground link from external placeholder to `/playground/`
- `apps/docs/src/pages/index.tsx`: Remove "coming soon" badge, make Playground button a live link to `/playground/`

## Phases

### Phase 1: Build Configuration
- Add `base` configuration to playground's vite.config.ts (conditional on CF_PAGES)
- Create combined build script
- Update CF Pages build command to use the combined script

### Phase 2: Documentation Navigation
- Update docusaurus.config.ts navbar link
- Update landing page — remove "coming soon", link to /playground/

### Phase 3: Verification
- Push to master, verify deployment
- Confirm playground loads at zod.toform.dev/playground
- Confirm docs site nav links work
