# Unified Config and Zod 4.6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give CLI, Vite, and playground one public configuration contract, add independent Zod compilation, migrate Rune Langium, and measure compilation off/on.

**Architecture:** Core owns authored configuration types, property validation, layered merging, and effective settings resolution. Environment-specific loaders supply that resolver with canonical configs; generation receives derived internal data. Validation compiles finalized targets once while walking and registration retain original schema identities.

**Tech Stack:** TypeScript, Zod 4.6, pnpm workspaces, React Hook Form, Vite, Vitest, browser benchmarks, Rune Langium Studio.

**Spec:** [Unified configuration and Zod 4.6 compilation](../specs/2026-10-07-unified-config-zod-46-design.md).

## Global Constraints

- DRY is the primary correctness rule.
- `OptimizationConfig` has optional `level?: 1 | 2 | 3` and `compileZod?: boolean`.
- Omitted compilation resolves to false.
- `compileZod: true` without a level compiles ordinary whole-schema validation.
- Do not add a per-schema optimization override as part of this task.
- Use explicit `z.compile()` on individual validation targets, not the global `zod/compile` side-effect import.
- No publishing, deployment, or PR merge is part of this scope.
- No backward compatibility layer, legacy flat Vite aliases, or independent playground public schema.
- Preserve normalization, parsed output, issue messages, schema-registration identity, domain fields, and existing async behavior.
- Use Infigraph search/context/references/impact before code refactors; record findings and milestones immediately with narrative saves.
- Preserve unrelated changes in both repositories. Use pathspec commits. Create isolated worktrees at execution time if needed, following the worktree skill and indexing them.
- Read the consumer's AGENTS and linked architecture/workflow guidance before Rune changes; preserve Node compatibility and do not hand-edit generated Rune sources.

## Review Focus

1. Preset changes in variants: switching from shadcn to html must not retain injected controlled overrides. Test in Task 1.
2. Config HMR races and invalid reloads: newer edits must win and the last valid configuration must survive an invalid intermediate edit. Test in Task 2.
3. Compile-only settings: an optimization object without a level must retain the whole-schema resolver and its parsed output. Test in Tasks 3 and 4.
4. Playground edits to a subset: variants, schema entries, and unexposed field metadata must survive form edits and serialization. Test in Task 5.
5. Consumer component paths: generated imports must resolve from the schema module directory and controlled widgets must preserve their event wiring. Test in Task 7.

## File Structure and Dependencies

| Unit | Files | Responsibility |
| --- | --- | --- |
| Authored config | `packages/core/src/config.ts` | Canonical config/patch types and shared property validators |
| Config resolution | new `packages/core/src/resolve-config.ts` | Domain-specific layer merging, preset expansion, effective settings |
| Compilation | new `packages/core/src/validation-schema.ts` | Identity-based finalized-target preparation |
| Generated input | `packages/core/src/config-types.ts` | Internal resolved generation data, not a config-file schema |
| CLI/Vite adapters | `packages/cli/src/index.ts`, `packages/vite/src/config/load.ts`, `packages/vite/src/plugin.ts`, `packages/vite/src/query-mode/transform.ts` | Load modules, invoke shared resolver, preserve platform lifecycle |
| Runtime validation | `packages/react/src/useZodForm.ts`, `packages/core/src/walker.ts` | Prepare full-schema and per-field/SchemaLite validation targets |
| Generated validation | `packages/codegen/src/generate.ts` | Emit hoisted compiled targets with no compiler calls when disabled |
| Playground | `apps/playground/src/types/playground.ts`, config helpers, preview and worker code | Canonical completed config plus UI-only draft model |
| Measurement | performance suites and `scripts/bench-report.ts` | Consistent off/on/setup benchmark matrix |
| Consumer migration | Rune Studio and visual-editor configs/manifests | Consume the same canonical contract using updated local packages |

Execute Tasks 1–7 in order; Task 8 closes verification and documentation. Each task has a focused test cycle and a pathspec commit. The task boundaries are reviewable deliverables, not separate projects.

## Task 1: Canonical Config, Validation, and Resolver

**Files:** Modify `packages/core/src/config.ts`, `packages/core/src/config-types.ts`, `packages/core/src/index.ts`, `packages/core/src/loader/index.ts`, `packages/core/tests/config.test.ts`, `packages/core/tests/component-config-types.test.ts`. Create `packages/core/src/resolve-config.ts`, `packages/core/tests/resolve-config.test.ts`.

**Interfaces:**

```ts
// Preserve the existing config generics for typed component/field/schema keys.
type OptimizationConfig = { level?: 1 | 2 | 3; compileZod?: boolean };
type ConfigInvocation = {
  name?: string;
  mode?: 'submit' | 'auto-save';
  ui?: 'shadcn' | 'html';
  out?: string;
  serverAction?: boolean;
};
type ResolvedFormConfig = {
  componentConfig: ZodFormsConfig;
  componentName: string;
  mode: 'submit' | 'auto-save';
  ui: 'shadcn' | 'html';
  out?: string;
  overwrite: boolean;
  serverAction: boolean;
  formProvider: boolean;
  optimization: OptimizationConfig;
  fields: NonNullable<ZodFormsConfig['fields']>;
};
// ConfigPatch derives from the canonical body, excluding variants;
// components/defaults/schema entries are partial, fields retain their types.
mergeConfigLayers(...layers: ConfigPatch[]): ZodFormsConfig;
resolveFormConfig(input: {
  config: ZodFormsConfig;
  exportName: string;
  variant?: string;
  invocation?: ConfigInvocation;
}): ResolvedFormConfig;
```

`mergeConfigLayers` validates the merged complete config, but leaves presets unexpanded. `resolveFormConfig` selects the variant, resolves root-schema/invocation settings and field layers, then expands the final preset once. Empty variant means base. Missing named variants throw an error naming the requested and known variants. Vite translates it into its existing domain error.

- [ ] Write failing resolver tests with a complete base containing `components.source`, shadcn preset, `defaults.optimization: { level: 2, compileZod: true }`, a schema name/field override, and a mobile variant.

```ts
it('preserves inherited compilation while changing level', () => {
  const config = defineConfig({
    components: { source: './ui', preset: 'shadcn' },
    defaults: { optimization: { level: 2, compileZod: true } },
    variants: { mobile: { defaults: { optimization: { level: 1 } } } }
  });
  expect(resolveFormConfig({ config, exportName: 'User', variant: 'mobile' })
    .optimization).toEqual({ level: 1, compileZod: true });
});
it('honors an explicit compilation disable', () => {
  const config = mergeConfigLayers(
    { components: { source: './ui' }, defaults: { optimization: { compileZod: true } } },
    { defaults: { optimization: { compileZod: false } } }
  );
  expect(resolveFormConfig({ config, exportName: 'User' }).optimization.compileZod)
    .toBe(false);
});
```

- [ ] Add tests for preset switching, component override replacement, per-path field property merging with whole `props` replacement, array replacement, root-only settings, missing variants, and rejection of removed flat input keys. Add type assertions that a variant cannot contain another variants map and canonical schema keys retain autocomplete.
- [ ] Run `pnpm --filter @zod-to-form/core exec vitest run tests/config.test.ts tests/resolve-config.test.ts tests/component-config-types.test.ts`; expect missing resolver/unsupported new properties before implementation.
- [ ] Implement the merge/resolver using domain helpers, reusing `resolveFieldConfig`. The optimization merge is explicitly:

```ts
const optimization = {
  ...lower.defaults?.optimization,
  ...upper.defaults?.optimization
};
```

Preserve false with nullish defaults rather than truthiness. Derive config and patch validators from one property-schema definition. Export `configPropertySchemas` for playground schema derivation. Keep authored configs unexpanded: `defineConfig` remains a generic typed helper returning authored values; loader validation must not expand presets before resolution. Remove the deprecated root `overwrite` migration because root generation settings are rejected by the canonical contract. Ensure all existing uses of preset-expanded output migrate in later tasks.
- [ ] Keep `CodegenConfig` as internal resolved generation data and add `optimization?: OptimizationConfig`. Remove its separate `validationLevel`; update core canonicalization tests to hash nested compilation state and false correctly.
- [ ] Run the focused tests, then core test/build/type-check. Expect passing schema/merge tests and no new duplicate resolver in another package.
- [ ] Commit exactly the Task 1 files: `feat(core): unify config validation and resolution`.

## Task 2: Route CLI and Vite Through the Shared Resolver

**Files:** Modify `packages/cli/src/index.ts`, `packages/cli/src/codegen.ts`, `packages/vite/src/types.ts`, `packages/vite/src/index.ts`, `packages/vite/src/config/load.ts`, `packages/vite/src/plugin.ts`, `packages/vite/src/query-mode/transform.ts`, CLI/Vite config fixtures, `packages/vite/tests/unit/variant-merge.test.ts`, `packages/vite/tests/unit/load-query.test.ts`, `packages/vite/tests/unit/hmr-query.test.ts`, `packages/vite/tests/integration/codegen-parity.test.ts`. Create `packages/cli/tests/integration/config-resolution.test.ts`, `packages/vite/tests/unit/config-resolution.test.ts`.

**Consumes:** Task 1's canonical config, `mergeConfigLayers`, `resolveFormConfig`, and internal `CodegenConfig.optimization`.
**Produces:** Both entry points consume the same config; CLI accepts `GenerateOptions.variant` and `--variant`; plugin `configOverride` is `ConfigPatch`. Remove `Z2FViteConfig`/flat variants input type rather than adding aliases.

- [ ] Create a canonical fixture with `defaults.mode: 'auto-save'`, `defaults.ui: 'shadcn'`, optimization, components/preset, global fields and a schema name. Test both Vite file loading and inline overrides resolve identical values; adapt existing codegen parity tests to feed the same config.

```ts
const canonical = defineConfig({
  components: { source: './ui', preset: 'shadcn' },
  defaults: { mode: 'auto-save', ui: 'shadcn', optimization: { level: 2 } },
  schemas: { UserSchema: { name: 'ProfileForm' } }
});
expect(resolveFormConfig({ config: canonical, exportName: 'UserSchema' }))
  .toMatchObject({ componentName: 'ProfileForm', mode: 'auto-save', ui: 'shadcn' });
```

- [ ] Add tests that invalid nested values fail through the shared validator, no-config Vite retains its fallback, removed flat keys fail explicitly, variants work in CLI, and a bad HMR reload preserves the prior validated config while newer generations win. Reuse existing loader/HMR test harnesses.
- [ ] Run `pnpm --filter @zod-to-form/vite exec vitest run tests/unit/config-resolution.test.ts tests/unit/variant-merge.test.ts tests/unit/load-query.test.ts tests/unit/hmr-query.test.ts tests/integration/codegen-parity.test.ts` and CLI config-resolution test; expect failures for the old flat contract.
- [ ] Replace `ensureConfig` spreads with `mergeConfigLayers` using the existing fallback config, loaded module and override. Keep discovery, module invalidation, last-valid fallback and generation guards. Wrap validation failures inside the same reload error handling as import failures.

```ts
const authored = mergeConfigLayers(fallbackConfig, loaded, options.configOverride ?? {});
const resolved = resolveFormConfig({
  config: authored,
  exportName: selected.name,
  variant
});
const generation = {
  ...resolved,
  exportName: selected.name,
  schemaImportPath: defaultSchemaImportPath(schemaFile),
  optimization: resolved.optimization
};
```

- [ ] Make CLI's root-settings/field resolution call the same helper. Pass only CLI invocation settings supported previously; thread the variant through multi-export runs. Carry `formProvider`, optimization and derived output/import/SchemaLite data into generation. Keep export selection separate from config values and preserve generated `Form` export conventions.
- [ ] Remove Vite's independent flat effective-config merge and update generate-mode/resolver stripping to read `defaults.optimization.level`. Update existing flat fixtures and codegen settings to nested authored config or internal optimization, as appropriate.
- [ ] Run CLI/Vite suites, generated-compiles tests, build and type-check after dependency builds. Commit exact changed files: `fix: share canonical config across CLI and Vite`.

## Task 3: Upgrade Zod and Prepare Final Validation Targets

**Files:** Modify every workspace manifest that directly depends on Zod and corresponding peer ranges, `pnpm-lock.yaml`, `packages/core/src/index.ts`, `packages/core/src/types.ts`, `packages/core/src/walker.ts`. Create `packages/core/src/validation-schema.ts`, `packages/core/tests/validation-schema.test.ts`; extend `packages/core/tests/optimizers/walker-optimization.test.ts`.

**Consumes:** `OptimizationConfig` from Task 1.
**Produces:** `prepareValidationSchema<T extends $ZodType>(schema: T, options?: OptimizationConfig): T`, exported from core; optimized field validation targets and finalized SchemaLite use this helper after walking original schemas.

- [ ] Verify a stable Zod 4.6 patch from the registry, update dependency ranges to that patch and peers to `^4.6.0`, then `pnpm install`. Read installed declarations to confirm `compile` accepts core schema types. Record exact resolved version. Do not upgrade unrelated libraries or run registry publication.
- [ ] Add failing behavior tests for off returning original identity, on reusing a cached target, original metadata/registry identity, safeParse output/issues equivalence, final SchemaLite effects, recursive/coercion/async refusal behavior, and compile-only options returning ordinary walker fields.

```ts
const schema = z.object({ name: z.string().min(2), count: z.coerce.number() });
expect(prepareValidationSchema(schema, { compileZod: false })).toBe(schema);
const prepared = prepareValidationSchema(schema, { compileZod: true });
expect(prepareValidationSchema(schema, { compileZod: true })).toBe(prepared);
expect(prepared.safeParse({ name: 'Jo', count: '3' }))
  .toEqual(schema.safeParse({ name: 'Jo', count: '3' }));
```

- [ ] Run `pnpm --filter @zod-to-form/core exec vitest run tests/validation-schema.test.ts tests/optimizers/walker-optimization.test.ts`; expect missing helper failures.
- [ ] Implement one weak schema-identity cache and default `compile()` refusal semantics. Cache only enabled preparation, including unchanged/refused results.

```ts
const compiledSchemas = new WeakMap<$ZodType, $ZodType>();
export function prepareValidationSchema<T extends $ZodType>(
  schema: T, options?: OptimizationConfig
): T {
  if (!options?.compileZod) return schema;
  const cached = compiledSchemas.get(schema);
  if (cached) return cached as T;
  const prepared = z.compile(schema);
  compiledSchemas.set(schema, prepared);
  return prepared;
}
```

- [ ] Let `WalkOptions.optimization` reuse the shared optimization properties plus its existing custom optimizer map. Keep overloads that return `WalkResult` tied to a defined level. After walking and registry work, prepare only `zodSchema` validation-mode field targets and the final built SchemaLite. Recursively traverse returned field structures using the existing field-child utilities; do not compile native-rule-only fields or substitute compiled objects during registration.
- [ ] Run core full tests/build/type-check against Zod 4.6. Commit manifest/lockfile/core paths: `feat(core): add cached Zod 4.6 validation compilation`.

## Task 4: Runtime and Generated Validation Compilation

**Files:** Modify `packages/react/src/useZodForm.ts`, `packages/react/src/ZodForm.tsx`, `packages/codegen/src/generate.ts`, `packages/react/tests/performance/gen-fixtures.ts`, `packages/react/tests/useZodForm.test.ts`, `packages/react/tests/optimized-validation.test.ts`, `packages/codegen/tests/generate.test.ts`, `packages/codegen/tests/codegen-optimization.test.ts`, `packages/codegen/tests/schema-lite-codegen.test.ts`. Create `packages/codegen/tests/compiled-validation.test.ts`.

**Consumes:** Internal `CodegenConfig.optimization` and `prepareValidationSchema`.
**Produces:** Off/on behavior for full resolvers, auto-save parsing, per-field escape hatches and SchemaLite, with module-hoisted generated targets.

- [ ] Write a runtime compile-only test that changes a coercing input and asserts `onValueChange` receives parsed output and validity. Write off/on error-message equivalence tests for L1 and a refinement that forces an L2 escape hatch. Preserve `''` normalization and rejected-value behavior.

```ts
const schema = z.object({ age: z.coerce.number().min(18) });
// Run the existing hook/form harness with both false and true.
// An input of "21" must emit age: 21; invalid input must keep normalized raw data.
expect(onValueChange).toHaveBeenLastCalledWith({ age: 21 }, { isValid: true });
```

- [ ] Write generated-source tests for no `compile` imports/calls when disabled, module-scope calls when enabled, compilation of actual leaf accessors, and full-schema resolver compilation when no level is selected. Execute generated validators for valid/invalid input and compare issues/output to direct Zod.
- [ ] Run focused React and codegen tests; expect compile-only and emitted-source assertions to fail.
- [ ] Memoize the prepared full schema in `useZodForm` using schema identity and `compileZod`; use it in the resolver and auto-save parsing. Pass optimization to walking so final field/SchemaLite validators are prepared. Derive `isOptimized` only from level, never optimization object presence. Keep normalization before parsing.

```ts
const validationSchema = useMemo(
  () => prepareValidationSchema(schema, options?.optimization),
  [schema, options?.optimization?.compileZod]
);
const isOptimized = options?.optimization?.level !== undefined;
```

- [ ] In codegen, add compiler imports only to enabled output. Hoist each actual finalized target and close over it in validators; do not emit compilation inside a render or validation callback. Keep `safeParse` in message-producing escape hatches and output-producing auto-save callbacks. Audit boolean-only call sites with Infigraph and use `z.validate` only when tests confirm no output/messages are needed. If none qualify, record that conclusion and keep production behavior.

```ts
// Shape of enabled generated leaf validation:
const _schema_name = z.compile(UserSchema.shape['name']);
const _validate_name = (value: unknown) => {
  const result = _schema_name.safeParse(value);
  return result.success ? true : result.error.issues[0]?.message ?? 'Invalid';
};
```

- [ ] Test callback behavior against the installed direct `z.compile` path: z2f must not add a separate validate-then-parse invocation. Preserve async paths and native L2 behavior. Regenerate fixtures through their producers.
- [ ] Run React/codegen tests and CLI/Vite generated-compiles checks, then affected builds/type checks. Commit exact paths: `feat: compile runtime and generated validation targets`.

## Task 5: Canonical Playground Configuration

**Files:** Modify `apps/playground/src/types/playground.ts`, `apps/playground/src/lib/config-schema.ts`, `apps/playground/src/lib/config-completions.ts`, `apps/playground/src/lib/export.ts`, `apps/playground/src/components/config/ConfigPane.tsx`, `apps/playground/src/components/preview/CodeOutput.tsx`, `apps/playground/src/components/preview/FormPreview.tsx`, `apps/playground/src/worker/evaluate.ts`, `apps/playground/tests/unit/config-schema.test.ts`, `apps/playground/tests/unit/config-completions.test.ts`, `apps/playground/tests/unit/export.test.ts`, `apps/playground/ARCHITECTURE.md`.

**Consumes:** Canonical config/patch types, `configPropertySchemas`, and resolver.
**Produces:** UI-only partial draft input and validated canonical completed config; compiler options propagate into runtime/generated previews and export.

- [ ] Add failing round-trip tests for compilation false/true, level absence, variants, schema entries and unexposed field metadata. Change an editor-owned setting and verify the rest survives.

```ts
const original = {
  components: { source: './ui' },
  defaults: { optimization: { compileZod: true } },
  variants: { mobile: { defaults: { optimization: { compileZod: false } } } },
  schemas: { User: { name: 'ProfileForm' } }
};
const values = configToFormValues(original, []);
const updated = formValuesToConfig(values, original);
expect(updated.variants).toEqual(original.variants);
expect(updated.schemas).toEqual(original.schemas);
expect(updated.defaults?.optimization).toEqual(original.defaults.optimization);
```

- [ ] Run playground config/completion/export tests; expect missing-property loss or unsupported controls failures.
- [ ] Replace `PlaygroundConfig`'s independent field definitions with a canonical config/patch-derived type. Derive shared form-control validators from core property schemas, including optimization, while retaining UI presentation metadata. On completed imports/exports use core validation; on previews/codegen use the resolver.
- [ ] Add independent level and compilation controls with completions, preserving the difference between an unset level and a compilation boolean. Merge only editor-owned changes into existing authored values; do not rebuild config from a restricted whitelist. Update worker protocol types if optimization must cross the worker boundary; schema identity/cache must remain local to the worker/runtime.

```ts
const next = mergeConfigLayers(existingConfig ?? fallbackConfig, {
  defaults: editedDefaults,
  fields: editedFields
});
const resolved = resolveFormConfig({ config: next, exportName: selectedExport });
```

- [ ] Update preview, code output and exports to consume resolved settings and preserve original authored config for round trips. Verify both modes with compile on/off, and preserve existing behavior when users leave compilation disabled.
- [ ] Run playground tests/type-check/build and its existing editor-preview integration test. Commit exact paths: `feat(playground): consume canonical config and compilation controls`.

## Task 6: Compilation On/Off Metrics

**Files:** Create `packages/core/tests/performance/validation.bench.ts`, `packages/core/tests/performance/validation-cases.ts`, `packages/core/tests/performance/validation-cases.test.ts`; modify `packages/react/tests/performance/validation.browser.bench.tsx`, `packages/react/tests/performance/gen-fixtures.ts`, `packages/react/tests/performance/codegen-vs-runtime.browser.bench.tsx`, `scripts/bench-report.ts`, `benchmarks/RESULTS.md`, `apps/docs/docs/guides/benchmarks.md`.

**Consumes:** Production walker/preparation and finalized field/SchemaLite validation from Tasks 3–4.
**Produces:** Comparable fixture/level/compile/input/outcome metrics and separate fresh-schema setup timing, using one shared case matrix.

```ts
type ValidationFixture = {
  name: 'small' | 'medium' | 'large';
  schema: z.ZodObject;
  validInput: Record<string, unknown>;
  invalidInput: Record<string, unknown>;
};
type ValidationCase = {
  run(input: unknown): { valid: boolean; message?: string; data?: unknown };
};
createValidationCase(fixture: ValidationFixture, options: OptimizationConfig): ValidationCase;
runCase(prepared: ValidationCase, input: unknown): ReturnType<ValidationCase['run']>;
```

Build `ValidationFixture` entries from the existing small/medium/large schemas and samples in `packages/core/tests/performance/schemas.ts`; explicitly define rejected variants in `validation-cases.ts`. Both Node and browser consumers reuse the builder.

- [ ] Add a correctness test for the benchmark case builder: each baseline/L1/L2 and false/true case accepts the valid fixture, rejects the invalid fixture, and message-bearing validators consume messages. Confirm compiled child targets, not merely a compiled unused root.

```ts
for (const level of [undefined, 1, 2] as const) {
  for (const compileZod of [false, true]) {
    const name = `${level === undefined ? 'baseline' : `L${level}`} compile=${compileZod}`;
    for (const fixture of fixtures) {
      const preparedCase = createValidationCase(fixture, { level, compileZod });
      bench(`${fixture.name} ${name} valid`, () => runCase(preparedCase, fixture.validInput));
      bench(`${fixture.name} ${name} invalid`, () => runCase(preparedCase, fixture.invalidInput));
    }
  }
}
```

Here `runCase` and the case-builder belong to the new shared `validation-cases.ts`; each result includes validity and consumed first-message/output data matching its production entry point.
- [ ] Implement separate setup measurements that construct fresh schemas and prepare them on every measured setup operation. Keep steady-state setup outside callbacks. Include small/medium/large full submits, escape hatches and applicable SchemaLite cases. Keep native-rule L2 measurements honestly labeled when compilation has no work to speed up.
- [ ] Update generated fixtures to include compile on/off cases and regenerate them; update the report grouping to use explicit dimensions. Add Node/browser version, Zod version and fixture descriptions to reports. Evaluate pure boolean `z.validate` in a separate group without implying it replaces message-producing callbacks.
- [ ] Run `pnpm bench` and `pnpm bench:browser`, then `pnpm bench:report`. Capture actual absolute timings, ratios and setup cost. Do not write a positive speedup claim if measurements disagree; note unsupported targets/fallbacks and browser availability precisely.
- [ ] Commit case builders, authoritative fixture generator, regenerated fixtures, report logic and measured results: `perf: compare Zod compilation on and off`.

## Task 7: Rune Langium Consumer Migration

**Repository:** `/Users/pmouli/GitHub.nosync/active/ts/rune-langium`.
**Files:** Modify `apps/studio/vite.config.ts`, `apps/studio/z2f.config.ts`, `packages/visual-editor/z2f.config.ts`, affected package manifests, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `docs/agents/architecture.md`, `docs/agents/workflow.md`; update consumers that import the removed Vite config type. Create a focused config test in `apps/studio/test/codegen-forms/z2f-config.test.ts`.

**Consumes:** Built core/react/codegen/Vite packages from Tasks 1–5, canonical config, Zod 4.6.
**Produces:** Rune's effective plugin configuration and typed visual-editor config use the same contract, with verified local package consumption.

- [ ] Read the live Rune AGENTS and required architecture/workflow documents, recall/save its Infigraph session, inspect status/branch and package manager versions. Run Infigraph consumer references/impact before edits. Preserve existing work, `.resources` and generated source ownership.
- [ ] Add tests for effective auto-save/shadcn settings, sibling component import paths, controlled Checkbox/Select/TypeSelector wiring, hidden AST fields, sections, array reorder, and schema-relative field mappings. The test should validate the exported canonical config using the updated core resolver.

```ts
const resolved = resolveFormConfig({ config: studioConfig, exportName: 'ExcelOptionsSchema' });
expect(resolved).toMatchObject({ mode: 'auto-save', ui: 'shadcn' });
expect(resolved.componentConfig.components.source).toBe('./z2f-components');
expect(resolved.componentConfig.components.overrides?.Checkbox?.controlled).toBe(true);
```

- [ ] Build local z2f packages. Pack artifacts into an isolated temporary directory, rewrite packed workspace dependency references to the matching packed versions using the package manager's supported pack behavior, and install them reversibly for consumer checks. Record and restore temporary manifest/workspace overrides after validation; do not leave machine-specific tarball paths in committed files.
- [ ] Run the new config test before migration; expect old flat shape/type failures. Migrate Studio to one authoritative `defineConfig` export imported by its Vite config, removing the duplicate inline `componentConfig` workaround and obsolete type imports/comments.

```ts
// apps/studio/z2f.config.ts
export default defineConfig({
  components: { source: './z2f-components', preset: 'shadcn' },
  defaults: {
    mode: 'auto-save', ui: 'shadcn',
    optimization: { compileZod: false }
  }
});
// apps/studio/vite.config.ts
z2fVite({ configOverride: studioConfig });
```

- [ ] Migrate visual-editor's old string components/formPrimitives/fieldTypes settings into supported components/overrides/templates using its real widget exports. Preserve actual controlled props and domain field metadata; use current field-composition APIs where necessary. Do not delete domain fields merely because an old config property was removed. Keep compilation off in Rune by default until consumer parity is verified; tests also exercise enabled mode on representative forms.
- [ ] Add release changesets for affected z2f packages, calculate the forthcoming versions without publishing, and update Rune manifests/overrides to those versions consistently. Do not regenerate a registry lockfile pretending unreleased artifacts exist: retain reproducible local verification results and report publication as the remaining external delivery step if needed.
- [ ] With local updated artifacts installed, build Rune dependencies as required; run visual-editor form tests/type-check and Studio config/type-check/Vite build. Test compile-only enabled and disabled cases using the same component/config path. Restore local-only dependency overrides, preserve migration files, and record exactly what verified against unpublished packages.
- [ ] Commit only Rune migration files: `refactor: adopt unified zod-to-form configuration`.

## Task 8: Whole-Change Verification and Documentation

**Files:** Modify `README.md`, relevant Vite/CLI/core/playground docs discovered through Infigraph document search, `apps/docs/docs/guides/benchmarks.md`, `.changeset/` release notes, and consumer docs from Task 7.

**Consumes:** All completed implementation and consumer verification tasks.
**Produces:** Passing appropriate package checks, documented breaking config migration, and an honest report of measurements and publication limitations.

- [ ] Search public examples for removed flat input keys/types using Infigraph. Migrate authored examples to canonical nested config. Internal generation fixtures may retain derived component/import/output data but must use nested optimization. Regenerate API output with the documented producer instead of hand-editing generated docs.
- [ ] Document one shared config example, exact merge precedence, variant patch semantics, independent compile-only operation, preset expansion timing, message/output reasons for keeping safeParse, compilation setup/CSP/fallback behavior, and the Rune/playground migration.

```ts
defaults: { optimization: { compileZod: true } } // whole-schema strategy
defaults: { optimization: { level: 2 } }         // native strategy, no compilation
defaults: { optimization: { level: 2, compileZod: true } }
```

- [ ] Run `pnpm test`, `pnpm build`, `pnpm type-check`, `pnpm lint`, and formatting checks. Run appropriate package-scoped checks first, then broaden once for final integration. Scope formatting to authored changes if pre-existing unformatted files prevent a clean global check; report rather than silently rewriting unrelated files.
- [ ] Confirm no-config/query/generate/HMR tests, CLI/Vite parity, callback/output/error equivalence, playground round trips and Rune local consumer checks have passed. Any unresolved failure remains outstanding work, not a completed gate.
- [ ] Self-review the complete diff and spec acceptance criteria; invoke the review mechanism required by the selected execution workflow. Correct findings and rerun only affected checks.
- [ ] Commit remaining documentation/release files with exact pathspecs: `docs: document unified configuration and Zod compilation`.
- [ ] Report changed behavior, validation evidence, actual off/on metrics, consumer migration status and any unreleased-package limitation. Do not publish, deploy or merge.

## Self-Review Record

The plan covers the canonical contract/resolver (Tasks 1–2), Zod upgrade and finalized compilation targets (Tasks 3–4), conservative validate evaluation (Task 4), playground migration (Task 5), real on/off/setup metrics (Task 6), Rune migration and unpublished-package verification (Task 7), and delivery documentation/checks (Task 8). Each Review Focus item has an owning test task. The named resolver/preparation interfaces are defined before their consumers. UI drafts and internal generation input are distinguished from the public config schema. Product execution starts after plan review and execution method selection.
