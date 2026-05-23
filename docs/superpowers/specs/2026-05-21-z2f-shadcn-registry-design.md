# Design: zod-to-form shadcn Registry (`@zod-to-form`)

**Date:** 2026-05-21 (revised 2026-05-23)
**Status:** Approved (design); pending spec review → implementation plan
**Namespace:** `@zod-to-form` (permanent — the install command users type)

## Goal

Make zod-to-form installable via the shadcn CLI (`npx shadcn add @zod-to-form/...`)
and listable in the shadcn directory (https://ui.shadcn.com/docs/directory). The
registry seeds a working starter (sample Zod schema + a `z2f.config.ts`) and points
users to `z2f init` for real per-project wiring and to the playground for visual
iteration.

## Non-goals

- Generating a config wired to the user's *actual* components. **Verified against the
  shadcn docs:** when the CLI resolves a registry item, the server receives only the
  item `{name}`, the `{style}` placeholder (if the URL template uses it), and any
  static `params`/`headers` the user hand-wrote. It transmits **no** project files —
  not `components.json`, not aliases, not schemas. So server-side per-user config
  generation is impossible. Deep wiring is `z2f init`'s job (it runs locally with
  filesystem access). The registry ships a sensible sample only.
- Replacing the existing consumer-side proxy (`/api/shadcn/*`), which forwards to
  ui.shadcn.com and community registries for the playground. That stays as-is.
- Per-field component items. We ship starter blocks, not nine field wrappers.

## Key decisions (and why)

1. **Static registry files, no Worker.**
   Because no per-user input ever reaches the server (see Non-goals), every item's
   output is fully precomputable at build time. A dynamic server would emit identical
   bytes on every request, so it buys nothing. We generate static files at build time
   and serve them from the existing Cloudflare Pages deploy. This removes the Worker,
   the `mode` query param, the Workers-runtime risk, new secrets, and the (currently
   red) Worker deploy CI from scope.

2. **Three statically-named items, one per consumption mode.**
   The three z2f consumption modes are genuinely different installables, so each is
   its own named item under the `@zod-to-form` namespace:
   - `@zod-to-form/starter-react` — runtime `<ZodForm>` renderer
   - `@zod-to-form/starter-codegen` — build-time generated component (owned)
   - `@zod-to-form/starter-vite` — Vite plugin integration

   Mode is selected by the install command (`add @zod-to-form/starter-codegen`),
   which is more discoverable than a hidden `components.json` param. All three ship at
   launch.

3. **Items inline file `content` (the universal shadcn contract).**
   Empirical review of real registries (@nuqs, @formcn, @nessra-ui, @shadcnhooks)
   confirms every item inlines full file source in `files[].content`; the CLI writes
   that to disk. We follow this — no `path`-only items.

4. **`starter-react` = thin owned glue + npm dep (the dominant pattern).**
   nuqs adapters and @nessra-ui's `form` ship thin *owned* files that `import` the npm
   package and list it in `dependencies`; they don't copy library source into
   `files[]`. `starter-react` follows this. `starter-codegen` is the rarer "own the
   whole generated `.tsx`, no runtime dep" model (@shadcnhooks-style).

5. **Config generation runs at BUILD time, reusing `init`/`buildConfigSource`.**
   The `z2f.config.ts` shipped in items is produced by the same `buildConfigSource`
   (from `@zod-to-form/codegen`) that `z2f init` uses — run once during
   `registry:build`, not per request. This is the concrete "leverage init," and it
   keeps the registry from drifting from z2f's real config format. Because it runs in
   Node at build time, there is no Workers-runtime concern.

6. **Files target shadcn aliases for correct placement.**
   Item `files[].target` uses shadcn alias placeholders (`@/components/...`, etc.),
   which the CLI resolves to the user's configured dirs locally. The sample config
   targets the conventional `@/components/zod-form-components` path — the same default
   `init`'s `inferComponentModulePath` uses — so it works for convention-following
   shadcn projects without knowing their real aliases.

## Architecture

```
Source (in repo)                Build (Node, build time)        Served (Pages CDN)
─────────────────               ────────────────────────        ──────────────────
apps/docs/registry/             pnpm registry:build         →   apps/docs/static/r/
  sample/schema.ts                ├─ buildConfigSource()          registry.json
  (templates per mode)            │   → z2f.config.ts             starter-react.json
                                  ├─ codegen → generated.tsx      starter-codegen.json
                                  └─ shadcn build                 starter-vite.json
                                      → schema-valid item JSON   (committed; served at
                                                                  zod.toform.dev/r/*)

Consumer:  npx shadcn add @zod-to-form/starter-codegen
           → GET https://zod.toform.dev/r/starter-codegen.json  (static)
```

- **Hosting:** Docusaurus serves `static/` at the site root, so files in
  `apps/docs/static/r/` are served at `zod.toform.dev/r/*`. No changes to
  `build-combined.mts` needed (it already publishes the docs build, including
  `static/`).
- **No new infra, no secrets, no Worker.** Ships with the existing docs/Pages deploy.

## Registry items

### `registry.json` (index)
Served at `/r/registry.json`. Conforms to `https://ui.shadcn.com/schema/registry.json`.
Fields: `$schema`, `name` (`@zod-to-form`), `homepage` (`https://zod.toform.dev`),
`items: [ starter-react, starter-codegen, starter-vite ]`.

### Common to all three items (`type: registry:block`)
- `description`: contains tokens users search for — "zod", "react hook form", "form",
  "schema", "validation", "codegen".
- `registryDependencies`: shadcn primitives the sample maps to — `input`, `select`,
  `checkbox`, `label`, `button` (exact set finalized against the sample schema).
- `files[].target`: shadcn alias placeholders for correct local placement.
- `docs`: instructs the user to (1) run `npx @zod-to-form/cli init` to regenerate
  `z2f.config.ts` wired to their components, and (2) visit `zod.toform.dev/play/` to
  design/iterate the schema.

### Per-item output

| item | files[] (inlined content) | dependencies |
|---|---|---|
| `starter-react` | `schema.ts`, `z2f.config.ts` (buildConfigSource), thin `zod-form.tsx` mounting `<ZodForm>` | `@zod-to-form/react`, `zod`, `react-hook-form`, `@hookform/resolvers` |
| `starter-codegen` | `schema.ts`, `z2f.config.ts`, generated `generated-form.tsx` (owned) | `zod`, `react-hook-form`, `@hookform/resolvers` (no `@zod-to-form/react` runtime dep) |
| `starter-vite` | `schema.ts`, `z2f.config.ts`, a `?z2f` usage example | `@zod-to-form/vite` (dev), `zod`, `react-hook-form`, `@hookform/resolvers` |

## Source layout & build

- Sample sources live in `apps/docs/registry/` (sample `schema.ts`, per-mode template
  fragments). Reviewable and testable in the repo.
- A `registry:build` script (Node) generates the three item JSONs + `registry.json`
  into `apps/docs/static/r/`:
  - runs `buildConfigSource` for the shared `z2f.config.ts`,
  - runs codegen for `starter-codegen`'s `generated-form.tsx`,
  - assembles per-item `files[]`/deps and emits schema-valid JSON (prefer the official
    `shadcn build` so the output format tracks the current schema).
- Generated output is committed so the served bytes are reviewable in PRs.
- Wired into the docs build (or a pre-build step) so a stale registry can't ship.

## Directory submission (follow-on, after registry is live)

1. Confirm `/r/registry.json` + each `starter-*.json` return schema-valid JSON, and a
   real `npx shadcn add https://zod.toform.dev/r/starter-react.json` (and the others)
   works against a fresh Next.js + shadcn project (smoke test).
2. Add a 6-field entry to `shadcn-ui/ui` → `apps/v4/registry/directory.json`
   (`name`, `homepage`, `url`, `description`, `author`, `logo`), run
   `pnpm registry:build`, open PR `feat(registry): add @zod-to-form`.
3. Provide an SVG `logo` using `var(--foreground)`/`var(--background)` (convention).

### Competitive context (directory, as of 2026-05-23)
Form-related registries already listed: **@formcn** (click-to-build forms),
**@nessra-ui** (TanStack Form integration), **@wandry-ui** (Inertia form elements),
**@tailwind-builder** (AI-generated forms/tables/charts), **@flowkit-ui** (combobox).
None are Zod-schema-driven codegen. z2f's differentiator — "your Zod schema is the
source of truth; generate or render the form" — should lead the `description`.

## Testing

- **Build-script tests** (vitest): `registry:build` emits schema-valid `registry.json`
  + each `starter-*.json`; correct `dependencies`/`registryDependencies`/`docs` per
  item; config content matches `buildConfigSource` output.
- **Schema conformance:** validate output against the `registry.json` /
  `registry-item.json` JSON Schemas.
- **End-to-end smoke:** `npx shadcn add` against a throwaway Next.js + shadcn app for
  each of the three items; confirm files land at the aliased paths and the sample form
  renders.

## Scope for launch

- All three items (`starter-react`, `starter-codegen`, `starter-vite`) + the directory
  submission follow-on.

## Open questions / risks

- Final `registryDependencies` set depends on the chosen sample schema's field types.
- Confirm `shadcn build` (or our generator) produces directory-acceptable JSON; settle
  via the smoke test before submitting.
- Decide whether generated `/r/*` files are committed (reviewable) or generated in the
  Pages build only. Leaning committed.
