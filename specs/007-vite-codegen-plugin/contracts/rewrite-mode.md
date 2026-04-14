# Contract: Rewrite Mode

**Interface**: the runtime `<ZodForm>` JSX surface that rewrite mode matches, and the transformed source the plugin produces
**Consumers**: users' source code authored for `@zod-to-form/react`'s runtime renderer
**Stability**: semver-public; changes to match criteria or replacement shape bump MINOR

---

## Activation

Rewrite mode is OFF by default (FR-024). It activates when the user passes `{ rewriteZodForm: true }` to the plugin factory. When active, the plugin's `transform` hook processes files that:

1. Match at least one pattern in `options.rewriteInclude` (default: `['**/*.{ts,tsx,js,jsx}']`)
2. Do NOT match any pattern in `options.rewriteExclude` (always includes `node_modules` and `dist`)
3. Contain the literal substring `'ZodForm'` (cheap early-exit — see research R3)

Files that fail any check are returned unchanged in O(1) time.

## Match criteria

A `<ZodForm>` JSX element qualifies for rewriting if and only if ALL of the following hold:

| Check | Rule |
|---|---|
| Element name | `openingElement.name.name === 'ZodForm'` (no namespaces, no member access) |
| Import origin | `ZodForm` is imported from the literal specifier `'@zod-to-form/react'` (no wildcard, no aliased re-exports) |
| Schema prop present | The element has a JSX attribute `schema` |
| Schema value shape | `schema={identifier}` — a `JSXExpressionContainer` wrapping a single `Identifier` node |
| Binding resolves | `path.scope.getBinding(identifier.name)` returns a binding whose originating `ImportDeclaration` source path resolves (via Vite's resolver) to a file inside the Vite `root` |
| Binding is the schema itself | The imported binding is NOT an alias chain through multiple re-exports — one hop only in v1 |

If ANY check fails, the element is left unchanged and a DEBUG-level diagnostic is emitted naming the file, line, column, and failure reason (FR-022). No warning, no error — rewrite mode is silently advisory for sites it can't handle.

## Replacement shape

For each matched `RewriteSite`, the plugin generates a unique local identifier (e.g., `_z2fGeneratedForm_1`) and performs three edits:

1. **Append an import** near the top of the source file (after existing `import` statements):

    ```tsx
    import { Form as _z2fGeneratedForm_1 } from '<originalSchemaPath>?z2f=__rewrite_1';
    ```

2. **Replace the opening tag**:

    ```tsx
    // Before
    <ZodForm schema={signupSchema} onSubmit={handleSubmit} defaultValues={initial} />
    // After
    <_z2fGeneratedForm_1 onSubmit={handleSubmit} defaultValues={initial} />
    ```

    Specifically: the `schema` attribute is removed, `ZodForm` is replaced with the generated identifier, and ALL other attributes and children are preserved verbatim.

3. **Replace the closing tag** (if present — the element may be self-closing) with the new identifier.

## Prop preservation contract

- Every prop passed to `<ZodForm>` except `schema` MUST appear on the generated component, in the same order, with the same expression.
- Children (unusual for `<ZodForm>` but legal) MUST be preserved verbatim.
- JSX spread attributes MUST be preserved as-is, even though this means the generated component receives props the original might not have recognized. Any mismatch is the user's responsibility and surfaces as a normal TypeScript type error at compile time.
- If the original `<ZodForm>` was self-closing, the replacement MUST also be self-closing.
- Whitespace, trailing commas, and comments inside the JSX element MUST be preserved by `magic-string`'s surgical edits.

## Variant name for rewrite sites

Rewrite sites produce synthesized variants of the form `__rewrite_<n>` where `<n>` is a counter scoped to the source file. Different source files use independent counters — `App.tsx` may produce `__rewrite_1`, `__rewrite_2`; `Dashboard.tsx` starts over at `__rewrite_1`.

This matters for the cache key: two different source files may rewrite the same schema with effectively the same config, and they MUST share a cache entry. The cache key is `(schemaFile, effectiveVariantConfigHash)`, not `(sourceFile, __rewrite_N)`. The `__rewrite_` name is a display-only label; the cache deduplicates automatically.

## Interaction with query-mode imports

- A project MAY use both query-mode (`?z2f`) and rewrite mode simultaneously.
- Rewrite mode MUST NOT transform files that only contain `?z2f` imports (the substring check `'ZodForm'` naturally excludes them).
- Rewrite mode MUST NOT touch a file that contains `<ZodForm>` JSX AND a `?z2f` import — both mechanisms coexist, and each import/element is handled by its own path.

## Excluded constructs (silently skipped)

Rewrite mode MUST silently skip (with DEBUG diagnostics) all of these:

| Construct | Example | Reason |
|---|---|---|
| Dynamic schema | `<ZodForm schema={schemas[key]} />` | Cannot statically resolve identifier |
| Conditional schema | `<ZodForm schema={flag ? a : b} />` | Two possible schemas — ambiguous |
| Inline schema | `<ZodForm schema={z.object({...})} />` | Not an identifier; inlining would require running Zod at scan time |
| Destructured import | `const { ZodForm: MyForm } = ...; <MyForm ... />` | Aliased element name; not matched |
| Namespace import | `import * as z2f from '@zod-to-form/react'; <z2f.ZodForm ... />` | Member-expression element name; not matched |
| Re-exported `ZodForm` | `import { ZodForm } from './local-wrapper'` | Origin check fails |
| Schema from `node_modules` | `import { s } from 'some-lib'; <ZodForm schema={s} />` | Schema file outside Vite root |

For each skipped site, the plugin emits one DEBUG log line per site containing the file, line, column, and the matched reason from the table above. No aggregation — each skipped site gets its own line so users running `debug` level can audit them.

## Sourcemap contract

The `transform` hook MUST return a sourcemap generated by `magic-string` with `hires: true`. This ensures:

- Browser DevTools show original source lines when debugging rewritten files
- Stack traces from the generated component attribute to the original `<ZodForm>` call site, not the synthesized identifier
- Vite's error overlay displays the correct file:line when a downstream error references the rewritten region

## Idempotency

Running rewrite mode on an already-rewritten source file (e.g., during HMR after a non-schema edit) MUST produce identical output bytes and sourcemap, not an increasing chain of edits. The substring check `'ZodForm'` on the rewritten output naturally ensures no further rewrites occur (because `ZodForm` is removed by rewriting), but even if it did, the transform MUST be a no-op on its own output.

## Diagnostic API

Skipped sites emit DEBUG logs through the plugin's logger. The logger MUST also expose these diagnostics through a build-end summary at `logLevel === 'info'` or higher:

```
[@zod-to-form/vite] Rewrite mode processed 42 files, rewrote 38 call sites, skipped 4:
  src/App.tsx:22:5 — schema prop is dynamic (JSXExpressionContainer not an Identifier)
  src/Admin.tsx:8:3 — schema identifier resolves to node_modules package '@acme/schemas'
  src/Page.tsx:14:5 — ZodForm import origin is './local-wrapper', not '@zod-to-form/react'
  src/Page.tsx:31:5 — schema identifier resolves to a non-Zod export
```

This summary is the contract for how users discover why a given site wasn't rewritten.
