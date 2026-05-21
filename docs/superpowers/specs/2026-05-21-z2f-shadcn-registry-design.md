# Design: zod-to-form shadcn Registry (`@zod-to-form`)

**Date:** 2026-05-21
**Status:** Approved (design); pending spec review → implementation plan
**Namespace:** `@zod-to-form` (permanent — the install command users type)

## Goal

Make zod-to-form installable via the shadcn CLI (`npx shadcn add @zod-to-form/...`)
and listable in the shadcn directory (https://ui.shadcn.com/docs/directory). The
registry seeds a working starter (sample Zod schema + a `z2f.config.ts` generated
by the same code path as `z2f init`) and points users to `z2f init` for real
per-project wiring and to the playground for visual iteration.

## Non-goals

- Generating a config wired to the user's *actual* components. The registry server
  never sees the consumer's `components.json` aliases or component sources, so it
  cannot do deep wiring. That is `z2f init`'s job (it runs locally with filesystem
  access). The registry ships a sensible sample only.
- Replacing or changing the existing consumer-side proxy (`/api/shadcn/*`), which
  forwards to ui.shadcn.com and community registries for the playground. That stays
  as-is. This registry is a separate concern (publishing z2f's own items).
- Per-field component items. We ship a starter block, not nine individual field
  wrappers.

## Key decisions (and why)

1. **Dynamic registry served by a Worker, not static files.**
   The consumption mode (`react` / `codegen` / `vite`) is exposed as a shadcn
   `params` value, which arrives as a query string (`?mode=react`). Only a dynamic
   server can branch its output on that param; a static CDN file ignores query
   strings. See "Mode parameter" below.

2. **Items inline file `content` (the universal shadcn contract).**
   Empirical review of real registries (@nuqs, @formcn, @nessra-ui, @shadcnhooks)
   confirms every item inlines full file source in `files[].content`; the CLI writes
   that to disk. We follow this — no `path`-only items.

3. **Default mode is `react`: thin owned glue files + npm dependency.**
   The dominant pattern for library-backed registries (nuqs adapters, @nessra-ui
   `form`) is to ship thin *owned* files that `import` the npm package and list the
   package in `dependencies` — they do NOT copy the library source into `files[]`.
   `mode=react` follows this exactly. `mode=codegen` is the rarer "own the whole
   generated `.tsx`, no runtime dep" model (@shadcnhooks-style) offered as opt-in.

4. **Config generation reuses `init`'s `buildConfigSource`.**
   The `z2f.config.ts` shipped in items is produced by the same `buildConfigSource`
   (from `@zod-to-form/codegen`) that `z2f init` uses, so the registry can never
   drift from z2f's real config format. This is the concrete meaning of "leverage
   init."

## Architecture

```
Consumer components.json                Worker (dynamic)                 z2f packages
────────────────────────                ────────────────                 ────────────
"registries": {                         GET /r/{name}.json?mode=react    @zod-to-form/codegen
  "@zod-to-form": {                        ├─ mode=react   → block w/       buildConfigSource()
    "url": ".../r/{name}.json",            │   thin <ZodForm> usage          (shared generator)
    "params": { "mode": "react" }          │   + schema + config
  }                                         ├─ mode=codegen → block w/
}                                           │   generated .tsx (owned)
                                            └─ mode=vite    → schema +
npx shadcn add @zod-to-form/starter             config + plugin docs
   → GET .../r/starter.json?mode=react
```

- **Route:** the Worker serves `zod.toform.dev/r/*`. Cloudflare Worker routes take
  precedence over Pages for matching path patterns, so `/r/*` is handled by the
  Worker while the rest of `zod.toform.dev` stays on Pages (docs + `/play/`).
- **Worker placement:** add a `/r/*` route + a dedicated handler module to the
  existing `apps/shadcn-proxy/` Worker (it already owns a route on this zone). The
  publish concern (`registry/*.ts`) is kept in separate modules from the proxy
  concern (`registries.ts` / `search.ts` / `resolve.ts`) so the two don't tangle.
- **No new secrets beyond what the Worker already needs.** Deploy uses the same
  `wrangler deploy` path the team runs manually today. (CI auto-deploy of the
  Worker remains a separate, pre-existing gap — missing `CLOUDFLARE_*` secrets —
  out of scope here.)

## Registry items

### `registry.json` (index)
Served at `/r/registry.json`. Conforms to `https://ui.shadcn.com/schema/registry.json`.
Fields: `$schema`, `name` (`@zod-to-form`), `homepage` (`https://zod.toform.dev`),
`items: [ starter ]`.

### `starter` item (`registry:block`)
Served at `/r/starter.json?mode=…`. Searchable `description` containing the tokens
users type: "zod", "react hook form", "form", "schema", "validation", "codegen".

Common to all modes:
- `registryDependencies`: shadcn primitives the sample maps to — `input`, `select`,
  `checkbox`, `label`, `button` (exact set finalized against the sample schema).
- `docs`: instructs the user to (1) run `npx @zod-to-form/cli init` to regenerate
  `z2f.config.ts` wired to their components, and (2) visit `zod.toform.dev/play/` to
  design/iterate the schema.

Per-mode output:

| mode | files[] (inlined content) | dependencies |
|---|---|---|
| `react` (default) | `schema.ts` (sample), `z2f.config.ts` (via buildConfigSource), thin `zod-form.tsx` mounting `<ZodForm>` | `@zod-to-form/react`, `zod`, `react-hook-form`, `@hookform/resolvers` |
| `codegen` | `schema.ts`, `z2f.config.ts`, generated `generated-form.tsx` (owned) | `zod`, `react-hook-form`, `@hookform/resolvers` (no `@zod-to-form/react` runtime dep) |
| `vite` | `schema.ts`, `z2f.config.ts`; `docs` covers adding the `@zod-to-form/vite` plugin + `?z2f` import | `@zod-to-form/vite` (dev), `zod`, `react-hook-form`, `@hookform/resolvers` |

- **Default when `mode` absent** (e.g. directory-driven installs with no params):
  serve `mode=react`.
- **Invalid `mode`:** fall back to `react` (don't error — keep installs working).

## Mode parameter

- Consumers opt into a non-default mode via `params` in their `components.json`
  registry config: `"params": { "mode": "codegen" }` → query `?mode=codegen`.
- The shadcn **directory entry** carries a single static `url`
  (`https://zod.toform.dev/r/{name}.json`) with no params — discovery installs hit
  the `react` default. Params are an opt-in power feature, documented in z2f's docs.

## Source layout & build

- Sample source (`schema.ts` and any fixed template fragments) lives in the repo
  (e.g. `apps/shadcn-proxy/registry/` or a shared fixtures dir) so the served output
  is reviewable and testable.
- The Worker composes each item JSON at request time: reads the sample schema,
  calls `buildConfigSource` for the `z2f.config.ts`, assembles the per-mode
  `files[]` + deps, returns shadcn-schema-conformant JSON.
- `buildConfigSource` is imported from `@zod-to-form/codegen`; verify it runs in the
  Workers runtime (no Node-only APIs). If it has Node deps, precompute the config
  variants at build time and bundle them.

## Directory submission (follow-on, after registry is live)

1. Confirm `/r/registry.json` and `/r/starter.json` return schema-valid JSON, and a
   real `npx shadcn add https://zod.toform.dev/r/starter.json` works against a fresh
   Next.js + shadcn project (smoke test).
2. Add a 6-field entry to `shadcn-ui/ui` → `apps/v4/registry/directory.json`
   (`name`, `homepage`, `url`, `description`, `author`, `logo`), run
   `pnpm registry:build`, open PR `feat(registry): add @zod-to-form`.
3. Provide an SVG `logo` using `var(--foreground)`/`var(--background)` (directory
   convention).

## Testing

- **Worker unit tests** (vitest, existing harness in `apps/shadcn-proxy/tests/`):
  each mode returns schema-valid JSON; absent/invalid `mode` falls back to `react`;
  `dependencies`/`registryDependencies` correct per mode; `docs` present.
- **Schema conformance:** validate output against `registry.json` /
  `registry-item.json` JSON Schemas.
- **End-to-end smoke:** `npx shadcn add` against a throwaway Next.js + shadcn app for
  each mode; confirm files land and the sample form renders.

## Scope for launch

- `react` (default) + `codegen` modes, plus the directory submission follow-on.
- `vite` mode: the branching is built to accommodate it; ship as a fast follow-up
  unless explicitly pulled into launch.

## Open questions / risks

- `buildConfigSource` Workers-runtime compatibility (see Source layout). Mitigation:
  precompute + bundle config variants if it can't run in the Worker.
- `/r/*` Worker-route vs Pages precedence — confirm in a deploy preview before
  submitting to the directory.
- Final `registryDependencies` set depends on the chosen sample schema's field types.
