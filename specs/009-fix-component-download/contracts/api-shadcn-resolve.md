# Contract: `POST /api/shadcn/resolve`

Same-origin proxy. Implemented by:
- Dev: Vite middleware (`apps/playground/vite.config.ts` — `shadcnRegistryPlugin`).
- Prod: Standalone Cloudflare Worker at `apps/shadcn-proxy/` (`src/resolve.ts`), bound to the Route `zod.toform.dev/api/shadcn/*`. Deployed independently via `pnpm --filter @zod-to-form/shadcn-proxy deploy` (or the `deploy-shadcn-proxy` CI workflow).

This contract describes the surface the client consumes. The Worker handler
code was migrated from the previous (unused) `apps/playground/cf-functions/`
tree during this feature; the wire format is unchanged.

## Request

```http
POST /api/shadcn/resolve
Content-Type: application/json

{
  "items": ["button", "checkbox", "select"]
}
```

Rules:
- `items`: array of strings, length in `[1, 20]`.
- Bare names (e.g. `"button"`) default to the `@shadcn` registry.
- Prefixed names (e.g. `"@foo/bar"`) target a registered community registry — not used by this client but accepted by the endpoint.
- Body size ≤ 64 KiB (enforced by the prod Function).

## Response (success)

```http
200 OK
Content-Type: application/json

{
  "files": [
    {
      "path": "registry/new-york-v4/ui/button.tsx",
      "type": "registry:ui",
      "content": "...TSX source..."
    }
    // ...one entry per file across all resolved items + their registryDependencies
  ],
  "dependencies": [ "class-variance-authority", "..." ],
  "devDependencies": [],
  "cssVars": { }
}
```

Guarantees consumed by the client:
- `files` is present and is an array (possibly empty).
- Each `files[i].path` ends in a recognizable extension (`.tsx`, `.ts`, `.jsx`, `.js`) when the file is a source module. Other file types may appear and are ignored by the client.
- `content` is a string for source modules the client needs; `null` or absent for binary/non-source entries.

## Response (error)

```http
4xx/5xx
Content-Type: application/json

{ "error": "human-readable message" }
```

Error cases the client handles:
- `400` — malformed body (shouldn't occur client-side; treated as a bug).
- `413` — body too large (shouldn't occur; `items.length` is ≤ 7 in core path).
- `5xx` — upstream registry failure; client returns cached data + surfaces the error message.
- Network failure — client returns cached data + `["network error"]`.

## Client usage (this feature)

- Core pre-fetch: one POST with `items = ["button","checkbox","input","label","select","switch","textarea"]`.
- On-demand: one POST with `items = <missing names>` when a schema requests components not already in cache.
