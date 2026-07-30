# Configuration

## ArrayConfig

Configuration for collection-style field add/remove buttons.
Applied via FormMeta registry on schemas rendered as `ArrayField`:
`z.array()`, `z.set()`, and `z.map()`.

### Properties

#### addLabel

Label for the "add item" button (default: "+ Add")

**Type:** `string`

#### removeLabel

Label for the "remove item" button (default: "− Remove")

**Type:** `string`

#### reorder

Enable per-row reorder affordance. When true, the renderer mounts a
registered `ArrayReorderHandle` component per row and wires it to
`useFieldArray.move()`. Off by default — existing arrays are unchanged.

**Type:** `boolean`

#### onReorder

Optional callback fired after a reorder completes. Adopters who hold a
parallel copy of the array (e.g. a graph store) mirror the change here.
`from` and `to` are zero-based indices into the form-driven array
(excluding ghost rows).

**Type:** `(from: number, to: number) => void`

#### before

Non-form rows rendered before the first form-driven row. Each entry is
a self-contained renderable; the library never inspects its contents.
Ghost rows do not participate in form state, validation, or submission.

**Type:** `GhostRow[]`

#### after

Non-form rows rendered after the last form-driven row. Same semantics as
`before`.

**Type:** `GhostRow[]`

## FieldConfig

Per-field configuration that customises how a Zod schema field is rendered.

Merges base options (component override, visibility, order, props) with type-aware
extras: nested `fields` for object schemas, and `arrayItems` for array schemas.
Use this type when annotating a `ZodFormsConfig.fields` record or a per-schema
`schemas.[key].fields` map.

## WalkOptions

### Properties

#### formRegistry

Custom form registry for metadata annotations

**Type:** `ZodFormRegistry`

#### processors

Custom processors to add or override built-in ones

**Type:** `Record<string, FormProcessor<$ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>>>`

#### maxDepth

Maximum recursion depth for lazy/recursive schemas (default: 5)

**Type:** `number`

#### optimization

Validation optimization settings.

This is the walker's API surface — callers (useZodForm, CLI codegen) pass
the optimization config here. The CLI reads `config.defaults.optimization`
and forwards it; useZodForm accepts it via its own options. Both converge
here as the single source of truth for the walker.

**Type:** `{ level: 1 | 2 | 3; optimizers?: Record<string, FormOptimizer[]> }`

## ComponentsConfig

### Properties

#### source

Import path for the components module

**Type:** `string`

**Required:** yes

#### preset

Preset that provides base overrides and default field template

**Type:** `ComponentPreset`

#### fieldTemplate

Custom field template component path.
Controls the composition of label + input + description + helpText + error.
Overrides the preset's default template.

**Type:** `string`

#### overrides

Per-component overrides, strongly typed to module export keys

**Type:** `{ [K in keyof T & string]?: ComponentOverride }`

## TypedFieldConfig

Discriminated union over component keys.
When `component` is set to a known component key, `props` is constrained
to that component's prop type. When `component` is omitted, `props` is
an open `Record<string, unknown>`.

## ZodFormsConfig

Root configuration type for `zod-to-form` code generation.

Describes the component library to use, generation defaults, per-schema
overrides, and global field configuration. Pass this to `defineConfig()` in
your `z2f.config.ts` for full type inference, or load and validate it at
runtime with `validateConfig()`.

### Properties

#### components

**Type:** `ComponentsConfig<TComponents>`

**Required:** yes

**Use when:**
- Always set `components` — it is the only required field in `ZodFormsConfig`, and its `source` sub-field (the import path for your component module) is the only required sub-field within it; all other sub-options (`preset`, `overrides`, `fieldTemplate`) are optional and layer on top of that required baseline.
- Set `preset: 'shadcn'` when your component library uses Radix-based Select, Checkbox, or Switch: the shadcn preset injects `controlled: true` and wires field-expression props per component — Select receives only `onValueChange: 'field.onChange'` (no `field.value` binding), while Checkbox and Switch receive both `checked: 'field.value'` and `onCheckedChange: 'field.onChange'`. Omit `preset` or set `preset: 'html'` when using plain HTML inputs — the html preset applies no overrides.
- Add `overrides` only for components whose controlled behavior or default props differ from what the preset already provides; `defineConfig` merges your `overrides` on top of the preset's entries with `{ ...base, ...config.components.overrides }`, so preset entries absent from your `overrides` are kept, but any entry you do supply replaces the preset's entire entry for that component.
- Set `fieldTemplate` when you need a custom label + input + description + helpText + error wrapper that replaces the preset's default field composition template.

**Avoid when:**
- Avoid setting `preset: 'shadcn'` when your component library does not follow Radix/shadcn conventions — it injects `controlled: true` and field-expression props for `Select`, `Checkbox`, and `Switch`; any controlled-mode components in your library that share those names will inherit those overrides unintentionally.
- Avoid supplying `overrides` entries with a partial `props` object when `preset` is also set — `defineConfig` merges at the `ComponentOverride` level (`{ ...base, ...config.components.overrides }`), but within a single entry the entire `props` dict replaces the preset's `props` dict rather than merging with it; if you add an override entry for a preset component, you must re-supply the full `props` dict from the preset (e.g. `{ onValueChange: 'field.onChange' }` for `Select`) or omit the override entry for that component entirely.
- Avoid setting `preset: 'html'` when your custom components require controlled mode — the `html` preset provides no overrides, so every component defaults to uncontrolled (`register()` spread); you must declare `controlled: true` individually in `overrides` for any component that needs it.

#### defaults

**Type:** `ConfigDefaults`

**Use when:**
- Set `defaults` when you have multiple schemas and want a shared project-wide fallback for generation settings without repeating the same value in every `schemas.[key]` entry. The precedence chain is **not uniform** across properties — it varies by property:
- `mode`, `out`, `serverAction`: CLI flag > `schemas.[key].[prop]` > `defaults.[prop]` > hardcoded fallback (`'submit'`, none, `false`)
- `ui`: CLI flag > `defaults.ui` > `'shadcn'` — `ui` does not appear in `ZodTypeConfig`, so there is no per-schema override tier
- `overwrite`: `defaults.overwrite` > `false` — there is no CLI flag tier and no per-schema override tier
- `formProvider`, `optimization`: `defaults.[prop]` only — neither property appears in `ZodTypeConfig`, so no per-schema override path exists Leave `defaults` unset when you have only one schema or when every schema needs different settings; `schemas.[key]` entries cover per-schema control for the properties that support it (`mode`, `out`, `serverAction`). **Footgun — `defaults.overwrite: true`**: because `overwrite` is absent from `ZodTypeConfig`, setting `defaults.overwrite: true` enables unconditional file overwriting for every schema in the project with no per-schema way to opt out. Any new schema added to `schemas` later will also be silently overwritten on every codegen run. Prefer leaving `overwrite` unset (it defaults to `false`) and pass `--overwrite` at the CLI call site only when you explicitly intend to regenerate a specific output.

**Avoid when:**
- Leave `defaults` unset when you have only one schema and configure it directly in `schemas.[key]` — every property that `defaults` supports for single-schema projects is also available in `ZodTypeConfig` (except `formProvider`, `optimization`, `ui`, and `overwrite`, which have no per-schema override). Avoid setting `defaults.overwrite: true` in any persistent config file: because `overwrite` has no per-schema override tier, it applies unconditionally to every schema in the project with no opt-out path, and silently overwrites existing output on every codegen run. Avoid setting `defaults.out` when schemas need different output directories, as you would have to override it per-schema anyway, making the `defaults` entry redundant noise. Avoid `defaults.ui` when individual schemas need different component libraries — it has no per-schema override path, so one value applies everywhere.

#### types

**Type:** `string[]`

**Use when:**
- Set `types` to an explicit, fixed list of schema export names when you know exactly which exports to generate forms for and want no glob-pattern evaluation. Unlike `include`/`exclude`, each entry is matched literally against export names — no wildcard expansion occurs. Use it when the set of target schemas is stable and small (e.g. `['UserSchema', 'AddressSchema']`) and you want to pin codegen to those names in the config file rather than relying on pattern matching or auto-discovery.
- Leave `types` unset when you need wildcard/glob-style filtering across many exports — use `include`/`exclude` instead.

**Avoid when:**
- When `--export` is passed on the CLI command, `types` is ignored entirely — the CLI uses the explicit flag and never consults `types`. Avoid setting `types` when you need wildcard or glob-style filtering across many exports — use `include`/`exclude` instead, since entries in `types` are matched as exact export name strings (no `wildcardPatternToRegExp` expansion). Do not set `types` to `[]` intending to suppress all generation — an empty array is treated the same as omitting the key (the `config.types.length > 0` guard falls through to `include`/`exclude` filtering); use `include: ['__never__']` (or any pattern that matches no real export name) if you want to prevent generation, because `matchesAnyPattern` returns `true` when `patterns` is empty or undefined.

#### include

**Type:** `string[]`

**Use when:**
- Set `include` when your schema file exports more names than you want to generate forms for and you need a whitelist. Each entry is an anchored wildcard pattern (`*` expands to `.*`; all other regex characters are escaped), matched against export names — for example `["*Schema"]` to target only exports ending in `Schema`, or `["UserSchema", "ProfileSchema"]` for an exact allowlist. `include` is applied before `exclude`, so only names that first survive `include` are then checked against `exclude`. Omit `include` (or set it to `[]`) when you want every export to be eligible — `matchesAnyPattern` returns `true` for an empty or missing array, so all exports pass through.

**Avoid when:**
- You only have one schema export to target — use the `--export` CLI flag (or `options.export` in `runGenerate`) to select it directly; `include` adds nothing when a single export is already identified by name. A `schemas` entry can supply generation config for that export (name, mode, out, fields) but does not perform export selection — only `--export`/`options.export` does.
- You want all exports processed — omit `include` entirely; an empty array `[]` is treated identically to `undefined` by `matchesAnyPattern` (both let every export through), so setting `include: []` is a no-op that misleads readers into thinking a filter is active.
- You are constraining exports exclusively through `schemas` keys — `include` filters by name pattern but does not merge with or replace per-schema config; using both simultaneously makes the effective allowed set harder to reason about.

#### exclude

**Type:** `string[]`

**Use when:**
- Set `exclude` when your schema file contains exports you do not want to generate forms for — for example, internal utility schemas, base/mixin schemas, or non-form domain types that happen to be co-located in the same file. Use wildcard patterns (e.g. `["*Base", "*Internal", "Raw*"]`) to batch-exclude by naming convention rather than enumerating each name. Leave it unset (or as an empty array) when every export in scope should be processed — both produce identical behavior since `applyExportFilters` treats missing or empty `exclude` as no-op. When used alongside `include`, remember that `exclude` runs after `include` on the already-filtered set, so a name excluded here will be dropped even if it matched an `include` pattern.

**Avoid when:**
- When all included exports should be generated — omit `exclude` entirely; an empty array `[]` and `undefined` behave identically (no exports are removed). When `include` already narrows the export set precisely to what you want — adding `exclude` on top creates a redundant, confusing second filter. When you need to skip only one well-known schema — prefer an exact-name entry like `exclude: ['ExactSchemaName']` over a glob; an exact string carries no wildcard expansion risk and is equally precise. Avoid patterns that are too broad (e.g. `["*Schema"]`) — they match eagerly against all export names after `include` runs and emit no error when every export is removed, leaving the output directory empty without warning.

#### fields

**Type:** `Record<string, TypedFieldConfig<TComponents>>`

**Use when:**
- Set `fields` when you want the same field-level override — component, props, order, hidden, disabled, section, or helpText — to apply across **every** schema that shares that dot-path key. Use it for project-wide conventions such as forcing all `email` fields to use an `EmailInput` component or marking every `createdAt` field as hidden. Leave it unset (or use `schemas.[key].fields` instead) when an override should apply to only one schema; a path in `fields` silently propagates to all schemas that contain it, so global entries can affect schemas you did not intend to customize.

**Avoid when:**
- When the field configuration should apply to only one specific schema — use `schemas.[key].fields` instead, since entries in `fields` are applied globally to every schema processed. Avoid when different schemas need conflicting settings for the same field path key (e.g., one schema needs `email` as a `TextInput` and another as a `PasswordInput`) — a single global entry cannot satisfy both, and schema-level entries shallow-merge on top rather than replace, so the global value bleeds into schemas that do not override it. Avoid setting `props` here when any schema will partially override those props in `schemas.[key].fields` — `resolveFieldConfig` replaces `props` wholesale (shallow field-entry merge), so global `props` keys absent from the schema-level entry are silently dropped.

#### schemas

**Type:** `{ [K in keyof TSchemas & string]?: ZodTypeConfig<TSchemas[K] extends $ZodType ? SchemaFieldPath<TSchemas[K]> : string, TComponents> }`

**Use when:**
- Use `schemas` when two or more schemas in the same file need different generation settings — for example, different `out` paths, `mode`, `serverAction`, or generated component `name` — that cannot be satisfied by a single `defaults` block. Also use it when a reusable exported subschema (e.g. `AddressSchema` referenced inside multiple parent schemas) should always render with a specific `component`: the schema's component setting follows that exported schema object by identity wherever it appears as a subschema, with usage-site path overrides still winning. Use it when you want per-schema `fields` overrides that only apply to one schema and should not bleed into others — those entries shallow-merge on top of global `fields` at `resolveFieldConfig` time. Leave `schemas` omitted when all schemas share the same generation settings and the global `fields` map plus `defaults` block are sufficient.

**Avoid when:**

<!-- truncated -->
