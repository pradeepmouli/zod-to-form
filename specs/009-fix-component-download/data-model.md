# Phase 1 — Data Model

Client-side entities only. No server-side persistence.

## `FetchResult`

Public return type of `fetchShadcnSources()`.

| Field     | Type                       | Notes                                                                 |
| --------- | -------------------------- | --------------------------------------------------------------------- |
| `sources` | `Record<string, string>`   | Map of module-resolution key (e.g. `"ui/checkbox"`) → raw TSX source. |
| `errors`  | `string[]`                 | Human-readable failures. Empty on full success.                       |

Invariants:
- `sources` is never `null`; on total failure it is the empty object.
- `errors.length === 0` implies at least the core component set is present in `sources`.

## `CacheEntry` (localStorage payload)

Stored at key `z2f-shadcn-registry-cache`.

| Field       | Type                     | Notes                                                      |
| ----------- | ------------------------ | ---------------------------------------------------------- |
| `version`   | `number`                 | Current: `2` (bumped from `1` due to transport change).    |
| `timestamp` | `number`                 | `Date.now()` at save time. Entries > 24h old are ignored.  |
| `sources`   | `Record<string, string>` | Same shape as `FetchResult.sources`.                       |

Invariants:
- A read that fails `version` or TTL check returns `null` (cache miss).
- Writes are best-effort (`try/catch`); localStorage-full / disabled modes silently degrade to no-cache.

## `ResolveRequestBody` (wire format, outbound)

Sent to `POST /api/shadcn/resolve`.

| Field   | Type       | Notes                                                                 |
| ------- | ---------- | --------------------------------------------------------------------- |
| `items` | `string[]` | Component names, e.g. `["button", "checkbox"]`. `@shadcn/` prefix is the default when bare. Max 20 per contract. |

## `ResolveResponseBody` (wire format, inbound)

Received from `POST /api/shadcn/resolve`.

| Field             | Type                                     | Notes                                                         |
| ----------------- | ---------------------------------------- | ------------------------------------------------------------- |
| `files`           | `{ path: string; type?: string; content: string \| null }[]` | Flattened file list across all resolved items. Content is plain TSX/TS source. |
| `dependencies`    | `string[]`                               | Runtime deps aggregated across items (informational).         |
| `devDependencies` | `string[]`                               | Dev deps aggregated (informational).                          |
| `cssVars`         | `Record<string, Record<string, string>>` | Theme tokens (unused by the current client).                  |

## Transformation

The client maps `ResolveResponseBody.files` → `sources` map:

```
files
  .filter(f => /\.(tsx?|jsx?)$/.test(f.path) && typeof f.content === 'string')
  .reduce((acc, f) => {
    const key = f.path
      .replace(/^registry\/[^/]+\//, '')
      .replace(/^src\//, '')
      .replace(/\.(tsx?|jsx?)$/, '');
    acc[key] = f.content!;
    return acc;
  }, {})
```

This matches the existing key scheme so `component-compiler.ts` continues
to resolve `ui/checkbox`, `ui/button`, etc.

## State transitions

```
┌──────────────┐   cache hit (valid, fresh)
│ fetch()      │ ──────────────────────────► return { sources: cached, errors: [] }
│ caller       │
└──────┬───────┘
       │ cache miss or expired
       ▼
┌──────────────────┐   2xx ► sources merged, cache saved
│ POST /api/       │ ─────────────────────────────────► return { sources, errors: [] }
│ shadcn/resolve   │
└──────┬───────────┘
       │ non-2xx or network error
       ▼
return { sources: cachedOrEmpty, errors: [msg] }
```
