# Development & Release Process

## Branch model

- `develop` — integration branch. All feature/fix work merges here first.
- `master` — release branch. Kept in sync with `develop` via a standing "Sync develop into master" PR.

Work happens on short-lived branches off `develop`, merged via PR. Once `develop` is in a good state, the develop→master PR is merged to promote it.

## Packages

This is a changesets-managed monorepo:

- `@zod-to-form/core`
- `@zod-to-form/react`
- `@zod-to-form/vite`
- `@zod-to-form/codegen`
- `@zod-to-form/cli`

`apps/docs` is the Docusaurus site (`https://zod.toform.dev`) and is not published.

## Adding a changeset

Any user-facing change (bug fix, feature, breaking change) to one or more packages needs a changeset:

```bash
pnpm changeset
```

Select the affected package(s) and bump type, write a real summary, commit the generated `.changeset/*.md` alongside your change. `updateInternalDependencies` handling means a bump to `core` will cascade a patch to anything depending on it.

If you forget, the "Auto-generate Changeset" workflow (`.github/workflows/changeset.yml`) will synthesize one from your commit messages when your PR opens/updates — but a hand-written changeset with a real summary is always better for the CHANGELOG.

## Release automation (fully automatic once a changeset lands)

The `Release` workflow (`.github/workflows/release.yml`) runs on every push to `develop` or `master`. When it finds pending changesets, it:

1. Opens or updates a **"chore: version packages"** PR from `changeset-release/<branch>` targeting that same branch. This PR contains the version bumps + CHANGELOG updates across all affected packages — don't edit it by hand, just let it accumulate changesets.
2. Attempts to enable GitHub's native auto-merge on that PR (needs "Allow auto-merge" on in repo settings — if it's off, the PR just sits there and needs a manual merge).
3. When that Version Packages PR merges, the *next* run of the Release workflow (triggered by that merge) runs `pnpm changeset:publish`, which publishes every bumped package to npm with provenance (`NPM_CONFIG_PROVENANCE: true`).

So: merge your PR to `develop` → Version Packages PR appears → merge it (or let auto-merge do it) → packages publish. No manual `npm publish` ever.

The `Release` job uses **Node 22** specifically — keep this in sync if you copy the workflow to another repo; a stale Node version here is a real way to break the docs build (typedoc/vitepress) without CI (which runs on 24.x/26.x) ever noticing.

## CI

`.github/workflows/ci.yml` runs the matrix (Node 24.x, 26.x): install, build, type-check, test, lint. `CodeQL` and `Dependency Security Audit` run as separate checks on the same PR.

If CodeQL flags something and you're confident it's a false positive, dismiss it from the repo's Security → Code scanning tab with a specific reason — don't silence it in code just to turn the check green.

## Local commands

```bash
pnpm install --frozen-lockfile   # match CI exactly
pnpm build
pnpm test
pnpm type-check
pnpm lint
```

## `pnpm-workspace.yaml` gotchas specific to this repo

- **`minimumReleaseAgeExclude`**, not a blanket `minimumReleaseAge: 0`. This repo pins specific `pkg@version` entries (currently `@skillit/*`, `jose`, `typedoc-plugin-skillit`, `@napi-rs/wasm-runtime`, `@cloudflare/workers-types`) rather than disabling the release-age policy entirely. When one of these gets bumped, add the *new* version string to the exclude list rather than leaving the stale one — pnpm matches on exact `pkg@version`.
- **`apps/docs`'s `typescript` devDependency is deliberately pinned to `^6.0.3`**, not the workspace's TS7. `typedoc` has no TS7 support yet. `pnpm update --latest` will happily clobber this pin back to `^7.x` — always check this file after running `-L` across the workspace.
- **Security `overrides`** in this file (webpack, serialize-javascript, ws@8, uuid) exist to patch specific CVEs in Docusaurus's own dependency tree. Each has a comment explaining which CVE and which version fixes it — drop the override once Docusaurus itself bumps past the vulnerable range, not before.

`pnpm run <script>` / `pnpm --filter <pkg> <script>` re-verify the lockfile against pnpm's release-age policy even with a fresh install — that's why the exclude list above matters even for local dev, not just CI.

If a git hook (pre-commit/pre-push) is getting in the way of something you've already verified manually, bypass it with `SKIP_SIMPLE_GIT_HOOKS=1` rather than `--no-verify` — it's the hook's own documented escape hatch and shows up explicitly in its output.

## Current gap: branch protection

Branch protection on `master`/`develop` is currently **disabled** (as of 2026-07-30) — the auto-changeset bot's `GITHUB_TOKEN` couldn't push past it (only `RELEASE_TOKEN`, a real user PAT, can), and GitHub's newer Rulesets don't support bot bypass on personal (non-org) repos either. If you re-enable protection, expect the `Auto-generate Changeset` workflow to start failing again unless you also switch it to use `RELEASE_TOKEN` (or an equivalent PAT/GitHub App) instead of the default `GITHUB_TOKEN`.
