# Contract: Query-String Specifier Grammar

**Interface**: the `?z2f` URL fragment the developer writes in import statements
**Consumers**: users' application source code
**Stability**: semver-public; adding new reserved parameter names bumps MINOR

---

## Grammar

```
specifier := <module-path> '?' <query>
query     := 'z2f' | 'z2f' '=' <variant-name>
variant-name := [A-Za-z_][A-Za-z0-9_]*
```

Examples:

| Specifier | Meaning |
|---|---|
| `import { F } from './schemas/signup.ts?z2f'` | Default variant of the signup schema |
| `import { F } from './schemas/user.ts?z2f=create'` | `create` variant of the user schema |
| `import { F } from './schemas/user.ts?z2f=edit'` | `edit` variant of the user schema |
| `import { F } from './schemas/user.ts'` | Plain import — plugin MUST NOT transform this |
| `import { F } from './schemas/user.ts?raw'` | Other query — plugin MUST ignore |
| `import { F } from './schemas/user.ts?z2f&raw'` | Both `z2f` AND `raw` — plugin MUST refuse with `Z2F_VITE_QUERY_COMPOSITION_UNSUPPORTED` error |

## Recognition rules

- The plugin MUST recognize a specifier as `?z2f` if and only if the query portion contains `z2f` as a standalone key, optionally with a `=variant` assignment.
- The plugin MUST NOT recognize `?z2fX` or `?xz2f` or any variant where `z2f` is a substring of a larger identifier.
- The plugin MUST leave unrelated queries (`?url`, `?raw`, `?worker`, etc.) untouched. Any specifier the plugin doesn't recognize MUST cause `resolveId` to return `null` so Vite's other plugins get a chance.
- The plugin MUST refuse to combine `z2f` with other known query flags in the same specifier — that's undefined composition, and the safest failure mode is a clear error.

## Variant name constraints

- MUST match `/^[A-Za-z_][A-Za-z0-9_]*$/` — JavaScript identifier rules. No hyphens, no unicode.
- Reserved internally: names starting with `__rewrite_` are reserved for rewrite mode's synthesized variants. A user-authored `?z2f=__rewrite_foo` MUST be rejected with a clear error.
- The empty variant (`?z2f` with no `=value`) is the default target. Config-level `variants.default` is a legal way to describe its settings, but is not required — the default target falls back to the top-level config.

## Resolution behavior

When `resolveId` matches a `?z2f` specifier:

1. Strip the query, resolve the remaining path via Vite's standard resolver (as if it were a normal import). This honors aliases, tsconfig paths, and `resolve.extensions`.
2. If resolution fails, throw `Z2F_VITE_SCHEMA_NOT_FOUND` with the original specifier in the error message.
3. If the resolved path is outside the Vite `root`, throw `Z2F_VITE_SCHEMA_OUTSIDE_ROOT`. Users MUST NOT compile schemas from `node_modules` via the plugin.
4. Re-attach the query as the resolved id: `<absolutePath>?z2f[=variant]`. This gives each (schema, variant) pair its own stable module id that Vite can graph and HMR.

## `load` behavior

When `load` receives a `?z2f` id:

1. Parse the id back into `{ absolutePath, variant }`.
2. Look up the cache: `CompilationCache.get(schemaFile, variant, currentConfigHash)`. Return the cached `generatedSource` if present.
3. Otherwise:
   - Call `server.ssrLoadModule(absolutePath)` (dev) or `jiti(absolutePath)` (build) to get the schema module namespace.
   - Select the named export via `config.variants[variant]?.exportName ?? config.exportName ?? firstZodExport(namespace)`.
   - Call `generateFormComponent(fields, effectiveConfig)` where `fields = walkSchema(schema, { optimization: effectiveConfig.optimization })`.
   - Store in cache, return the generated source.

## Invalidation semantics

- When any file matched by `HMRInvalidationMap.schemaToImporters` changes, the plugin MUST invalidate every cache entry whose `schemaFile` equals that file's absolute path.
- When the config file changes, the plugin MUST invalidate the entire cache and trigger a dev-server reload of every module whose id matches `?z2f*`.
- When plugin options change (only possible via dev server restart), the cache is wiped completely.

## Type declaration contract for users

The plugin package MUST ship a module-augmentation file that declares ambient types for `*?z2f` imports. Users who add `"types": ["@zod-to-form/vite/client"]` to their `tsconfig.json` MUST get working import resolution in their editor without writing any `.d.ts` files themselves.

The declaration's precision is subject to TypeScript language capabilities — see research note R5 — but SC-005 requires, at minimum, that the import resolves and autocomplete works without hand-authored types.
