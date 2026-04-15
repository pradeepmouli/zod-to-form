# Research — Vite Plugin for Codegen

**Branch**: `007-vite-codegen-plugin`
**Date**: 2026-04-14
**Scope**: Resolve the five technical unknowns from the plan's Technical Context so implementation can begin without open questions.

All NEEDS CLARIFICATION items from the spec were resolved in `/speckit.clarify`. The research items below are about *how to implement what the spec already says*, not about what to build.

---

## R1 — Vite plugin lifecycle hooks for query-string mode

### Decision

Implement the `?z2f` query-string transform using the `resolveId` + `load` + `handleHotUpdate` hooks on a plugin with `enforce: 'pre'`. Do NOT use the `transform` hook for query-string mode.

- `resolveId(source, importer)`: when `source` ends in `?z2f` (or `?z2f=<variant>`), normalize the path and return a resolved id of the form `<absolute>/<schemaFile>?z2f[=variant]`. Letting Vite see a distinct id per (schema, variant) is what lets the dep optimizer and HMR graph treat each generated form as a separate module.
- `load(id)`: when `id` matches the `?z2f` pattern, strip the query, import the schema module programmatically (via `this.load(...)` or a fresh module instance), run `generateFormComponent`, and return the generated `.tsx` source as the module body. Mark the module as having a dependency on the underlying schema file so Vite's HMR graph knows what to invalidate.
- `handleHotUpdate(ctx)`: when `ctx.file` matches a watched schema file, walk the module graph to find all `?z2f*` modules whose `_schemaFile` equals `ctx.file`, evict them from the compilation cache, and return the list of affected modules so Vite can re-emit HMR updates.

### Rationale

- `resolveId` is the only place Vite lets you invent new module ids that aren't backed by real files on disk. Query suffixes are Vite's canonical convention for "same file, different module" (see built-in `?url`, `?raw`, `?worker`). Using this pattern means zero fights with the dep optimizer, sourcemap tooling, and IDE plugins that already understand the query convention.
- `load` is correct because we're *producing* module content, not *transforming* existing content. Using `transform` would require a placeholder file to exist on disk and would confuse Vite's module graph.
- `enforce: 'pre'` ensures the plugin runs before `@vitejs/plugin-react`'s TSX transform, so our emitted source goes through React's JSX compiler normally — we don't need to re-implement JSX → JS transformation.
- `handleHotUpdate` gives surgical control. The default behavior (full-module reload) would cascade through the entire module graph every time any schema changed; instead we walk the graph once and return only the virtual modules that actually depend on the changed file.

### Alternatives considered

- **`transform` hook on a placeholder module**: rejected because we'd need to write a placeholder file or configure the dep optimizer to ignore `?z2f` ids; both fight Vite rather than extending it.
- **Custom file extension** (e.g., `.z2fform.tsx`): rejected because it would require users to author a new kind of file rather than annotating existing Zod schemas. Also confuses TypeScript language services.
- **Build-only mode** (skip dev server entirely): rejected — the HMR story is the largest win in Story 1.

---

## R2 — Programmatic schema and config module loading

### Decision

The plugin loads TWO kinds of TypeScript/JavaScript modules at runtime: user-authored Zod schemas (during `load` for query mode and during `transform` for generate mode), and the `z2f.config.ts` file (during `configResolved` and on config-file-changed HMR events). Both use a single mechanism — Vite's own module loaders — so the plugin has no `jiti` dependency and no direct dependency on `@zod-to-form/cli`.

**Dev mode (`vite dev`)**:

- Schema files: `server.ssrLoadModule(absolutePath)` on the dev server instance. The plugin captures the server reference in `configureServer` and calls it inside `load` / `transform`.
- Config file: same — `server.ssrLoadModule(configPath)` the first time the plugin needs the config, and again whenever `handleHotUpdate` fires for the config file.

**Build mode (`vite build`)**:

- Schema files: delegate to Rollup's `this.load({ id: absolutePath })` inside the plugin's `load` hook. Rollup returns a module info object whose transformed code the plugin can evaluate.
- Config file: Vite resolves and evaluates the config during its own `configResolved` lifecycle by running an internal build of the config file using `loadConfigFromFile`-style logic (Vite exposes this helper). The plugin piggybacks on this — it registers a `config` hook that receives the already-loaded user config through `configResolved`, and reads the `z2f.config.ts` either by calling Vite's `createViteRuntime` API or by using `new Function`-style evaluation on the `this.load` result.

Either path returns a module namespace whose named exports are either Zod schemas (for schema files) or the config object (for `z2f.config.ts`). The plugin then:

- For schemas: selects the export whose name matches the configured default (or the explicit variant mapping in `z2f.config.ts`), verifies that `schema._zod` is present (structural check for "is this a Zod v4 schema"), and hands it to `generateFormComponent`.
- For configs: validates that the default export matches the `CodegenConfig` shape imported from `@zod-to-form/core`, runs `canonicalizeConfig(result)` to produce the cache-key hash, and stores the resolved config in the plugin's `configState`.

### Rationale

- `ssrLoadModule` respects Vite's transform pipeline, so the schema or config file goes through Vite's TS transpile and any other plugins that process `.ts` files. This means the plugin works correctly even if the file uses TypeScript, imports from other workspace packages, or relies on other plugin behavior (e.g., `@vitejs/plugin-react` for JSX in metadata).
- Using Rollup's `this.load` in build mode keeps the plugin aligned with how every other Vite plugin fetches source during `rollup build`. It avoids re-implementing TypeScript compilation and stays inside Vite's already-trusted module graph.
- Structural `_zod` check avoids a hard import dependency on any specific Zod module specifier — the plugin works whether the user's `zod` is hoisted to the top of `node_modules` or scoped to a workspace.
- **Config types live in `@zod-to-form/core`**, not `@zod-to-form/codegen` or `@zod-to-form/cli`. This is an intentional refactor made as part of this feature: `CodegenConfig` moves from `@zod-to-form/codegen` to `@zod-to-form/core`, codegen re-exports it for backward compatibility, and the Vite plugin imports it from core directly. `core` also gains a pure-TypeScript `canonicalizeConfig(raw: CodegenConfig): string` helper used for cache keys. No new runtime dependencies land in `core` (Principle IV preserved), and the Vite plugin has zero dependency on `@zod-to-form/cli`.

### Alternatives considered

- **`jiti` for both dev and build**: rejected. Pulls Node-only APIs into the plugin's dep graph and bypasses Vite's transform pipeline, causing schema identity mismatches between dev server HMR and plugin-compiled forms.
- **Depending on `@zod-to-form/cli` for `loadConfig`**: rejected. Pulls `commander`, `chokidar`, `prettier`, `jiti` into the plugin's transitive dep graph — all of them Node-specific and unnecessary inside a Vite plugin that already has access to Vite's own loaders.
- **AST static extraction** (parse files, never execute them): rejected. Zod schemas use chained method calls, closures, and imported helpers; extracting "what the schema actually is" statically is brittle and would re-implement half of Zod's type system. Execution is the only correct path.
- **Moving `loadConfig` itself into `@zod-to-form/core`**: rejected. It would introduce `jiti` or equivalent into core, violating Principle IV. Only the *types* and the pure *canonicalization* helper move to core; the *file loading* remains a caller-side responsibility handled by Vite in the plugin and by `jiti` in the CLI.

---

## R3 — JSX scanning strategy for generate mode

### Decision

In generate mode, scan each `.tsx` / `.jsx` / `.ts` / `.js` source module during the `transform` hook (not `load` — we're modifying existing content). Steps:

1. **Early exit via substring check**: if the source does not contain `'ZodForm'`, return early. No parse, no traverse. This cheap guard keeps generate mode's cost at zero for files that don't use `<ZodForm>`.
2. **Parse with `@babel/parser`** using `{ sourceType: 'module', plugins: ['jsx', 'typescript'] }`. Parse failures propagate as Vite errors — generate mode assumes the file was already valid before the plugin ran.
3. **Traverse with `@babel/traverse`**, looking for `JSXElement` nodes whose `openingElement.name.name === 'ZodForm'`. For each match:
   - Walk up the scope to find the `Import` node for `ZodForm`. If the import source is not `@zod-to-form/react`, skip (it's a different `ZodForm`).
   - Find the `schema={X}` attribute. If it's not a `JSXExpressionContainer` wrapping an `Identifier`, skip (dynamic schema — per FR-022, leave as runtime).
   - Use `path.scope.getBinding(identifierName)` to find the binding. If the binding is itself an `ImportDeclaration` pointing to a project-local file (not `node_modules`), record this as a `RewriteSite`. Otherwise skip.
4. **Apply rewrites with `magic-string`**: for each resolved `RewriteSite`, replace the opening tag `<ZodForm schema={X} ... />` (preserving props) with `<GeneratedForm_<id> ... />` where `GeneratedForm_<id>` is a freshly generated unique local identifier. Prepend an `import { GeneratedForm_<id> } from '<schema>?z2f=__generate_<id>'` near the top of the file (after existing imports).
5. **Emit the `?z2f=__generate_<id>'` module via the same query-mode pipeline**. Generate mode reuses query mode — the two share a single code path for the actual codegen step. Internal variant names use the `__generate_` prefix to distinguish them from user-declared variants and avoid collisions.
6. **Attach sourcemap** via `magic-string.generateMap({ hires: true })` and return it from the `transform` hook so debugger line numbers match the original source.

### Rationale

- The substring fast path is critical: most files in a typical project won't contain `ZodForm`, and parsing every TSX module for generate mode would dominate build time. A single `indexOf` check costs microseconds per file.
- Reusing the query-mode pipeline for generate-mode outputs keeps the codegen logic in one place. Only the *entry path* differs (declared `?z2f` vs synthesized `?z2f=__generate_N`).
- `path.scope.getBinding` is the standard Babel pattern for resolving imported identifiers, handles shadowing and aliases correctly, and is what every production AST-rewriting tool uses.
- Using a `__generate_` prefix for synthesized variant names (instead of anonymous temporary names) keeps the cache keys human-readable in error messages and debug output.

### Alternatives considered

- **`esbuild.parseSync`**: rejected because esbuild doesn't expose scope analysis and we need binding resolution for FR-021/FR-022.
- **`typescript.createSourceFile`**: rejected because the TypeScript compiler is much slower than Babel for pure scanning and we don't need TypeScript's full type checker for what amounts to "find JSX element, resolve identifier". The TS compiler's startup cost alone would blow our performance budget.
- **Hand-rolled JSX regex**: already rejected in the plan's dependency justification table.

---

## R4 — Resolver tree-shaking via import stripping

### Decision

FR-013 requires stripping `@hookform/resolvers/zod` from the production bundle when `optimization.level` is set. Implement this as a separate module transform in the plugin, not as a Rollup external or a generate-mode side effect.

During `transform`:

1. Match modules whose id ends in `/useZodForm.js`, `/useZodForm.ts`, or the `@zod-to-form/react` package's resolved `useZodForm` module path.
2. If `config.optimization?.level` is unset, do nothing.
3. Otherwise, replace the top-of-file `import { zodResolver } from '@hookform/resolvers/zod'` line with an empty statement, and replace any `zodResolver(...)` call inside a branch gated on `optimization === undefined` with `undefined`. (The existing `useZodForm` source already contains `isOptimized ? undefined : zodResolver(...)` — so we only need to replace the `zodResolver(...)` half of that ternary.)
4. Emit a sourcemap so debuggers can still attribute runtime errors to the original source.

Rollup's dead-code elimination will then remove the unused `@hookform/resolvers/zod` import entirely from the final bundle.

### Rationale

- Scoping the strip to `useZodForm.{js,ts}` by id match is surgical and reversible. No other module in the graph is touched.
- Doing the strip at `transform` time means the rewrite is visible to Rollup's tree-shaker, which already knows how to drop unused imports. We don't have to fight Rollup's side-effect detection — we just feed it clean source.
- Keeping the trigger behind a simple `config.optimization?.level` check means the default behavior (no optimization, no strip) is byte-identical to what users get without the plugin. This satisfies FR-012's "byte-equivalent or smaller" guarantee and makes regressions easy to detect.

### Alternatives considered

- **Rollup `external`**: rejected because making `@hookform/resolvers/zod` external leaves an unresolved import rather than dropping it entirely; the bundle would still reference the package.
- **`alias` to a stub module**: rejected because it still pays the stub-module cost in the bundle and confuses IDE go-to-definition.
- **Forking `useZodForm` in the plugin**: rejected — would duplicate the runtime hook and create two places where a bug could live.

---

## R5 — TypeScript support for `?z2f` imports in user code

### Decision

Ship a `virtual-types.d.ts` file in the plugin package root with a module-augmentation block declaring `'*.ts?z2f'`, `'*.tsx?z2f'`, and the same patterns with `=variant` suffixes. The file is auto-included by the user's `tsconfig.json` via the standard `include` + `types` glob chain because it lives at `@zod-to-form/vite/virtual-types.d.ts` and the plugin package's `package.json` declares it under `typesVersions` and `exports`.

The declaration uses a generic type helper that reads the schema module's exports via `typeof import('...')` and infers the form component's props from `StripIndexSignature<z.output<typeof Schema>>` — matching the codegen output exactly:

```ts
// Illustrative only — exact shape refined during implementation
declare module '*?z2f' {
  const form: <TProps extends { onSubmit: (data: unknown) => void }>(props: TProps) => JSX.Element;
  export default form;
  export const Form: typeof form;
}
```

Ideally, the declaration would parameterize on the specific schema module so that `import { SignupForm } from './schemas/signup.ts?z2f'` knows `SignupForm`'s `onSubmit` payload matches `z.output<typeof signupSchema>`. Whether TypeScript's current module-augmentation syntax supports that level of precision is the open implementation question. Fallback: type the exported component as `ComponentType<{ onSubmit: (data: unknown) => void; ... }>` with `unknown` for the submit payload — less precise, but acceptable for v1 since the user can still write `onSubmit: (data) => { ... data is typed via the schema at the call site ... }`.

### Rationale

- Module augmentation is the standard TypeScript pattern for declaring virtual imports provided by build tools (Vite's own `vite/client` does the same for `?url`, `?raw`, `?worker`).
- Shipping the `.d.ts` in the package root means users only need `"types": ["@zod-to-form/vite/virtual-types"]` in their `tsconfig.json` — or, better, we auto-include it via `package.json`'s `types` field, matching Vite's convention.
- The precision fallback is acceptable because SC-005 requires only that autocomplete work without hand-written `.d.ts` files — not that the onSubmit payload be perfectly typed. Perfect inference can be pursued in v1.1 once the plugin is in users' hands.

### Alternatives considered

- **Emit per-schema `.d.ts` files to disk**: rejected because it pollutes the source tree and conflicts with FR-007 (no clobbering) and the virtual-module-first principle.
- **Runtime `zod` inference via TypeScript plugin**: rejected — requires users to install a TypeScript language-service plugin, violates SC-005.
- **Declare each generated form as `any`**: rejected — violates Principle VI (Type Safety First) and SC-005.

---

## Summary

All five technical unknowns are resolved. No open NEEDS CLARIFICATION items remain. Implementation can proceed to Phase 1 with high confidence that the chosen approaches align with the spec, the constitution, and typical Vite plugin conventions.

The only lingering uncertainty is R5's precision of the generic `typeof` declaration — addressed with a clearly-scoped fallback that still satisfies the success criteria.
