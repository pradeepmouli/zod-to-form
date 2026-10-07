# Unified configuration and Zod 4.6 compilation

## Intent and approved scope

Use one public configuration schema across the CLI, Vite plugin, and playground. Upgrade to Zod 4.6 and support Zod compilation independently of z2f validation optimization levels. Measure compilation enabled and disabled. Migrate Rune Langium's consumers and the in-repository playground.

DRY is the primary correctness rule. The user explicitly does not require backward compatibility: remove the competing public shape rather than maintaining aliases or a legacy normalizer. No publishing, deployment, or PR merge is part of this scope.

## Current problem

Core exposes `ZodFormsConfig` and `defineConfig()` with `components`, `defaults`, global `fields`, and per-export `schemas`. Validation optimization lives at `defaults.optimization.level`.

Vite exposes `Z2FViteConfig` derived from the flat `CodegenConfig`. It loads file exports and plugin overrides with separate spread-based defaults, exposes `validationLevel`, and wraps the core config in `componentConfig`. Variant overrides are shallow. CLI independently resolves defaults and schema overrides.

Rune Studio's current `apps/studio/vite.config.ts` documents a real consequence: using the nested shape in the flat plugin override silently selected the wrong mode and UI defaults. The playground maintains another `PlaygroundConfig` interface and local configuration schemas.

## Canonical public contract

Keep `ZodFormsConfig` in core as the authoritative public type, extended with named variants. `defineConfig()`, loaded config files, and Vite `configOverride` all describe this contract. Remove the flat public Vite shape and its `validationLevel` property. Internal resolved generation data remains separate and is not accepted as a config-file format.

```ts
export default defineConfig({
  components: {
    source: '@/components/ui',
    preset: 'shadcn'
  },
  defaults: {
    mode: 'submit',
    ui: 'shadcn',
    optimization: {
      level: 2,
      compileZod: true
    }
  },
  fields: {},
  schemas: {
    UserSchema: {
      name: 'UserForm',
      fields: {}
    }
  },
  variants: {
    mobile: {
      defaults: {
        optimization: { compileZod: false }
      },
      fields: {}
    }
  }
});
```

`OptimizationConfig` has optional `level?: 1 | 2 | 3` and `compileZod?: boolean`. Omitted compilation resolves to false. `compileZod: true` without a level compiles ordinary whole-schema validation. A level without compilation retains the existing z2f strategy. Compilation does not select, raise, or disable a level.

Retain existing core settings and their meanings: component overrides/templates, export filtering, output and overwrite settings, schema names, reusable-schema renderers, and field configuration. Do not add a per-schema optimization override as part of this task. Existing runtime form options can remain component APIs; they must reuse the same optimization type and semantics.

Variants are typed patches of the canonical config body, excluding nested variants. Permit partial `components`, `defaults`, fields, and schema entries. They use the same property validators as the base contract. Do not create an independently maintained variant validation schema.

## Shared validation and resolution

Core owns the configuration property schemas, preset expansion, merge semantics, and effective-settings resolver. CLI and Vite retain their environment-specific module loaders and file handling, then call these core operations. The playground calls the same operations for completed configs.

Resolve layers in this order:

1. The application's built-in fallback config.
2. The loaded canonical config.
3. A supplied canonical config override, such as Vite `configOverride`.
4. The selected named variant.
5. The selected export's existing root-only overrides.
6. Explicit invocation options for properties supported by that invocation.

Settings with no existing schema or invocation override, including optimization, use the applicable defaults. Do not silently introduce new override tiers for these settings. CLI can select a named variant through a `variant` invocation option and `--variant` so the canonical variants feature is usable by both entry points. Vite continues selecting variants from `?z2f=<name>`.

Merge `defaults` by property and `defaults.optimization` by property, preserving explicit false values. Merge `components` by property and its overrides by component key; each component's override entry replaces the lower-priority entry. Merge `fields` by path and then by property, with each `props` dictionary replaced as a whole. Merge `schemas` by export name and each schema's fields using the same field merge. Arrays such as `include`, `exclude`, and `types` replace the earlier array. No generic recursive merge is needed.

Expand component presets once after the layers are merged. Keep user overrides higher priority than preset entries. Schema renderer registration continues using the original schema objects and their identities.

Validate known properties through the shared validator. Reject the removed flat Vite keys (`componentConfig`, `validationLevel`, `componentName`, and top-level generation settings) with a useful error instead of silently ignoring them. This is an error message, not a compatibility mode. Preserve supported field metadata and extensions; do not apply blanket strictness to domain field entries.

No-config Vite operation remains supported by constructing the existing fallback component configuration internally. `components.source` remains required in a complete public config. Plugin transport options such as config path, file inclusion, generation mode, and logging remain Vite options rather than being folded into the form config.

Keep schema-export selection as invocation data: explicit CLI export or plugin query/call-site context, otherwise existing automatic selection. Compute component names from `schemas[exportName].name` and the established fallback; preserve the plugin's synthesized generate-mode export conventions. Import paths, SchemaLite data, output paths, selected export, and resolved settings belong to internal generation input.

## Zod 4.6 and compilation behavior

Update workspace dependencies, peer minimums, and lockfiles to a stable Zod 4.6 release. Validate integration against the installed release rather than depending on documentation alone.

Walk and register original schemas first. Compile only finalized schemas used for validation: whole-schema resolvers, per-field escape hatches, and final SchemaLite validators. Compiling the root does not imply that an accessor to a child is compiled; compile each actual validation target once. Preserve metadata and registration identity by never replacing the original schema used for walking or schema-config registration.

Use a shared compilation preparation helper for runtime validation, with schema-identity caching so render/keystroke work does not compile repeatedly. Generated forms hoist compiled targets outside their component functions. Compile after all schema derivation; derived schemas do not retain compilation automatically.

Use explicit `z.compile()` on individual validation targets, not the global `zod/compile` side-effect import. Use Zod's default refusal/fallback behavior for unsupported schemas; do not enable strict compilation. Preserve existing asynchronous validation behavior and confirm fallback behavior for recursive schemas, coercion, and supported execution environments against the installed release.

Compilation disabled must not emit compilation calls into generated forms. Compilation enabled is optional runtime work; document its setup cost and Zod's runtime code-generation requirement.

## L1/L2 escape hatches and `z.validate`

Audit both runtime and generated escape hatches. Use `z.validate` where a consumer needs only validity and does not use parsed output or issue messages. Keep `safeParse` where issue messages or parsed data are part of the contract.

Do not introduce a general `validate`-then-`safeParse` failure path: it can repeat user refinements/transforms and doubles work on failures. The current generated escape hatch reads the first issue message, so `validate` alone is not a valid replacement. Test boolean-only opportunities and benchmark them separately; retaining `safeParse` in message-producing validators is an acceptable outcome of this evaluation.

## Consumer migrations

### In-repository playground

Derive its persisted/exported configuration type from the canonical core type. The editor may hold a partial draft, but must not define a second public contract or independently validate the same settings. Reuse shared schemas for overlapping controls and common validation for complete configs.

Update config editor controls, completions, examples, import/export, previews, worker data flow, and generated code to carry optimization settings. Form edits must preserve canonical properties that the editor does not expose, including variants and schema configuration. Existing playground field presentation helpers remain UI concerns; they cannot become an alternative generation-settings resolver.

The known playground is `apps/playground` in this repository. If consumer discovery finds another local playground project, migrate its actual z2f usage as well rather than assuming its existence or path.

### Rune Langium

Audit the live checkout at `/Users/pmouli/GitHub.nosync/active/ts/rune-langium` before edits. Preserve unrelated changes and follow its repository instructions.

Migrate Studio's inline Vite override to the canonical shape. Make its actual config authoritative and remove contradictory comments/documentation that describe the two-format workaround. Preserve component import-path semantics: the active inline config uses sibling imports relative to generated schema modules, which differ from the currently documented config-file source path.

Audit and migrate `packages/visual-editor/z2f.config.ts`, including older component-string, form-primitives, and field-type settings where present. Preserve its controlled widget wiring, sections, hidden AST fields, schema-relative paths, array configuration, and domain-specific field metadata. Use supported current APIs for field composition rather than silently dropping older settings.

Upgrade consumer Zod versions and z2f package references in manifests, workspace overrides, and lockfile consistently. Verify with freshly built local packages using a reversible local installation of packed artifacts until the updated versions are published. Do not claim registry-based consumption is ready before publication, and do not publish as part of this request.

## Performance metrics

Extend the existing Node and browser validation benchmark suites and report pipeline. Compare compilation false/true for baseline, L1, and L2 using the same fixtures and valid/invalid inputs. Include small, medium, and large schemas, per-field escape hatches, full-form submit, and SchemaLite effects when applicable.

Prepare schemas outside steady-state timed loops. Measure compilation/setup separately, using fresh targets for each setup measurement so caches do not make setup appear free. Report absolute timings and relative ratios with environment, versions, fixture, validation level, and compilation state. Do not assert machine-dependent speedups in correctness tests.

Benchmark production validation entry points; do not use a synthetic compiled root when the real path validates uncompiled children. Isolate any boolean-only `validate` comparison from error-message-producing validators. Preserve result/error consumption where production reads it, since lazy errors can otherwise distort measurements. Include callback-bearing escape hatches in correctness tests.

## Verification and delivery

- Unit tests for canonical validation, shared resolution, precedence, false-value preservation, variant patches, presets, and explicit rejection of removed public keys.
- CLI/Vite parity tests using the same canonical config, including named variants and optimization combinations.
- Generated-form compile tests and Vite query/generate-mode, cache, HMR, and no-config regressions.
- Validation equivalence for valid/invalid input, error messages, transforms/refinements, coercion, unsupported/recursive targets, and compile-only operation without a level.
- Playground config round trips, editor changes, preview/codegen parity, and optimization controls.
- Rune visual-editor/Studio targeted type checks, form tests, and Vite build using local updated packages; report any pre-existing failures separately.
- Run appropriate z2f tests, builds, lint, and type checks, then run the benchmark matrix and record measured results without invented performance claims.
- Update API docs, Vite/CLI examples, playground documentation, and release changesets for the breaking public configuration change and Zod minimum version.

## Acceptance criteria

One `defineConfig()` object works for CLI, Vite file loading, Vite overrides, and playground export. Public consumers no longer author a flat codegen configuration. A variant that changes only `level` retains inherited `compileZod`, and explicit false disables compilation. The original and compiled validation paths preserve observable form behavior. Rune and the playground use the new contract with verified consumer paths, and reports show honest compilation off/on measurements plus setup cost.
