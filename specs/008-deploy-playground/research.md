# Research: Deploy Playground

## Decision 1: Subpath vs Subdomain

- **Decision**: Serve playground at `zod.toform.dev/playground` (subpath)
- **Rationale**: Same CF Pages project as docs — simpler DNS, single deploy pipeline, shared build
- **Alternatives considered**: Separate subdomain (playground.toform.dev) — rejected because it requires a second CF Pages project and separate build/deploy pipeline

## Decision 2: Build Orchestration

- **Decision**: Single build script that outputs both apps to one directory
- **Rationale**: CF Pages supports one output directory per project. Combining docs + playground into `apps/docs/build/` with playground nested at `build/playground/` is the simplest approach
- **Alternatives considered**: Multi-project CF Pages setup — rejected (overkill, harder to maintain); Docusaurus plugin to embed playground — rejected (different build tools, would require complex webpack/Vite interop)

## Decision 3: Vite Base Path

- **Decision**: Set `base: '/playground/'` conditionally when `CF_PAGES=1`
- **Rationale**: Vite's `base` option prefixes all asset URLs. Without it, the playground would try to load assets from `/` instead of `/playground/`. Conditional check keeps local dev (`base: '/'`) working unchanged
- **Alternatives considered**: Always set base to `/playground/` — rejected (breaks local dev); use relative paths (`base: './'`) — works but less predictable with SPA routing

## Decision 4: SPA Routing on Subpath

- **Decision**: Include a `_redirects` file in the playground output for CF Pages SPA fallback
- **Rationale**: The playground is an SPA — any client-side route under `/playground/` must serve `index.html`. CF Pages uses `_redirects` or `_headers` files for this. A rule like `/playground/* /playground/index.html 200` handles it
- **Alternatives considered**: CF Pages functions — overkill for a static redirect; hash-based routing — works but uglier URLs
