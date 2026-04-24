# Quickstart — Verify the Component-Download Fix

## Local dev

```bash
pnpm install
pnpm --filter @zod-to-form/playground dev
# → http://localhost:5000
```

Expected:
1. First load: DevTools Network shows a single `POST /api/shadcn/resolve` returning 200 with the batched file list.
2. Preview renders shadcn-styled controls for any bundled example.
3. Reload: no `resolve` request (served from localStorage cache).
4. `localStorage.getItem('z2f-shadcn-registry-cache')` has `version: 2`.

## Simulated failure

In DevTools, block `**/api/shadcn/resolve` under Network. Reload.

Expected:
- A visible notice indicates component rendering is degraded.
- Editor, config, and code output remain usable (US2 acceptance).

## Worker deploy (prod)

One-time setup:
1. `cd apps/shadcn-proxy && pnpm install`
2. `npx wrangler login` (or set `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` env vars).
3. `pnpm --filter @zod-to-form/shadcn-proxy deploy` (runs `wrangler deploy`).
4. Confirm the Route `zod.toform.dev/api/shadcn/*` shows up under the Worker in the CF dashboard.

Verify Route is live (no browser needed):
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://zod.toform.dev/api/shadcn/registries
# Expect: 200

curl -s -X POST -H "Content-Type: application/json" \
  -d '{"items":["button"]}' \
  https://zod.toform.dev/api/shadcn/resolve | head -c 200
# Expect: JSON starting with {"files":[...
```

## Production smoke (after client deploy)

1. Visit `https://zod.toform.dev/play/` on a cache-clean browser profile.
2. DevTools Network: one `POST /api/shadcn/resolve` → 200, no direct requests to `ui.shadcn.com`.
3. Preview renders shadcn-styled controls end-to-end.
4. Reload: no additional `resolve` request.

## Tests

```bash
pnpm --filter @zod-to-form/playground test
```

The new `tests/shadcn-registry.test.ts` covers:
- Happy path: mock `fetch` → 200 with sample `files` → returns expected `sources` keys, writes cache.
- Warm cache: pre-populated localStorage → `fetch` is never called.
- Version mismatch: old `version: 1` entry → treated as miss.
- Server 500: returns `{ sources: cachedOrEmpty, errors: [msg] }`.
- Network throw: same graceful return.
- On-demand: second call with extra names issues a POST containing only the missing items.
