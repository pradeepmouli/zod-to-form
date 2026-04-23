# @zod-to-form/shadcn-proxy

Cloudflare Worker that proxies the shadcn/ui registry API so the zod-to-form
playground can fetch component sources from a same-origin path.

Bound to the Route `zod.toform.dev/api/shadcn/*`. In local playground dev the
same paths are served by the Vite middleware in
`apps/playground/vite.config.ts` (`shadcnRegistryPlugin`) — the Worker is only
used in production.

## Endpoints

- `GET  /api/shadcn/registries` — list of community registries (from `ui.shadcn.com/r/registries.json`).
- `GET  /api/shadcn/search?registry=@shadcn&q=...` — search an indexed registry.
- `POST /api/shadcn/resolve` body `{ items: string[] }` — batched, recursive resolve of registry items + their `registryDependencies`.

Bodies and limits (per-request): max 20 items, 64 KiB body, 100 upstream fetches, depth 5.

## Develop

```bash
pnpm --filter @zod-to-form/shadcn-proxy dev       # wrangler dev — local Worker
pnpm --filter @zod-to-form/shadcn-proxy test      # vitest unit tests for handlers
pnpm --filter @zod-to-form/shadcn-proxy type-check
```

## Deploy

```bash
pnpm --filter @zod-to-form/shadcn-proxy deploy
```

Requires `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` in env (or a prior
`wrangler login`). The CI workflow at
`.github/workflows/deploy-shadcn-proxy.yml` runs this automatically on push to
`master` when `apps/shadcn-proxy/**` changes.
