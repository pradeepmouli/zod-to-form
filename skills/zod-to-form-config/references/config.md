# Configuration

## ZodFormsConfig

### Properties

#### components

**Type:** `ComponentsConfig<TComponents>`

**Required:** yes

**Use when:**
- Always set `components` — it is the only required field in `ZodFormsConfig`, and its `source` sub-field (the import path for your component module) is the only required sub-field within it; all other sub-options (`preset`, `overrides`, `fieldTemplate`) are optional and layer on top of that required baseline.

Set `preset: 'shadcn'` when your component library uses Radix-based Select, Checkbox, or Switch: the shadcn preset injects `controlled: true` and wires field-expression props per component — Select receives only `onValueChange: 'field.onChange'` (no `field.value` binding), while Checkbox and Switch receive both `checked: 'field.value'` and `onCheckedChange: 'field.onChange'`. Omit `preset` or set `preset: 'html'` when using plain HTML inputs — the html preset applies no overrides.

Add `overrides` only for components whose controlled behavior or default props differ from what the preset already provides; `defineConfig` merges your `overrides` on top of the preset's entries with `{ ...base, ...config.components.overrides }`, so preset entries absent from your `overrides` are kept, but any entry you do supply replaces the preset's entire entry for that component.

Set `fieldTemplate` when you need a custom label + input + description + helpText + error wrapper that replaces the preset's default field composition template.

**Avoid when:**
- Avoid setting `preset: 'shadcn'` when your component library does not follow Radix/shadcn conventions — it injects `controlled: true` and field-expression props for `Select`, `Checkbox`, and `Switch`; any controlled-mode components in your library that share those names will inherit those overrides unintentionally.
- Avoid supplying `overrides` entries with a partial `props` object when `preset` is also set — `defineConfig` merges at the `ComponentOverride` level (`{ ...base, ...config.components.overrides }`), but within a single entry the entire `props` dict replaces the preset's `props` dict rather than merging with it; if you add an override entry for a preset component, you must re-supply the full `props` dict from the preset (e.g. `{ onValueChange: 'field.onChange' }` for `Select`) or omit the override entry for that component entirely.
- Avoid setting `preset: 'html'` when your custom components require controlled mode — the `html` preset provides no overrides, so every component defaults to uncontrolled (`register()` spread); you must declare `controlled: true` individually in `overrides` for any component that needs it.

**Pitfalls:**
- **`source` empty string throws at validation time**: `validateConfig` rejects an empty or whitespace-only `source` with a descriptive error (`components.source must be a non-empty string`), but it does NOT verify that the path resolves to an installable module — a plausible-looking but wrong import alias silently produces a broken `import` statement in every generated file.
- **Preset overrides are only applied by `defineConfig`, not by `validateConfig`**: Setting `preset: 'shadcn'` without wrapping the config in `defineConfig()` stores the preset name but never merges the preset's component overrides into `overrides`. If you load config via `validateConfig` alone (e.g., from a JSON file), any overrides you explicitly supplied are still present, but the preset's base entries (`Select`, `Checkbox`, and `Switch` controlled-mode wiring from `SHADCN_OVERRIDES`) will not be merged in — those components will behave as plain uncontrolled inputs.
- **Adding an entry to `overrides` for a preset-covered component replaces that component's entire entry**: The merge in `defineConfig` is `{ ...base, ...config.components.overrides }` — shallow at the component level. If `shadcn` preset defines `Select: { controlled: true, props: { onValueChange: 'field.onChange' } }` and you add `overrides: { Select: { controlled: true } }`, you lose the `props` dict. Re-state all required props whenever you override a preset component.
- **`overrides` keys are not validated against `source` exports**: `validateConfig` accepts any string key in `overrides` without checking whether that name is actually exported by `components.source`. A typo (e.g., `"Combobox"` vs `"ComboBox"`) is silently accepted and the override is never applied.
- **`fieldTemplate` is not checked for existence**: A non-empty string passes `validateConfig` even if the path points to a non-existent component. The error only surfaces at form render time or during generated-file review when the import is missing.
- **`overrides` component-level `props` are not deep-merged with per-field props**: Per-field props shallow-merge on top of component-level `props` (field config wins), but only at the key level — nested objects in `props` are replaced wholesale, not deep-merged.

#### defaults

**Type:** `ConfigDefaults`

**Use when:**
- `mode`, `out`, `serverAction`: CLI flag > `schemas.[key].[prop]` > `defaults.[prop]` > hardcoded fallback (`'submit'`, none, `false`)
- `ui`: CLI flag > `defaults.ui` > `'shadcn'` — `ui` does not appear in `ZodTypeConfig`, so there is no per-schema override tier
- `overwrite`: `defaults.overwrite` > `false` — there is no CLI flag tier and no per-schema override tier
- `formProvider`, `optimization`: `defaults.[prop]` only — neither property appears in `ZodTypeConfig`, so no per-schema override path exists
Leave `defaults` unset when you have only one schema or when every schema needs different settings; `schemas.[key]` entries cover per-schema control for the properties that support it (`mode`, `out`, `serverAction`).
**Footgun — `defaults.overwrite: true`**: because `overwrite` is absent from `ZodTypeConfig`, setting `defaults.overwrite: true` enables unconditional file overwriting for every schema in the project with no per-schema way to opt out. Any new schema added to `schemas` later will also be silently overwritten on every codegen run. Prefer leaving `overwrite` unset (it defaults to `false`) and pass `--overwrite` at the CLI call site only when you explicitly intend to regenerate a specific output.

**Avoid when:**
- Leave `defaults` unset when you have only one schema and configure it directly in `schemas.[key]` — every property that `defaults` supports for single-schema projects is also available in `ZodTypeConfig` (except `formProvider`, `optimization`, `ui`, and `overwrite`, which have no per-schema override). Avoid setting `defaults.overwrite: true` in any persistent config file: because `overwrite` has no per-schema override tier, it applies unconditionally to every schema in the project with no opt-out path, and silently overwrites existing output on every codegen run. Avoid setting `defaults.out` when schemas need different output directories, as you would have to override it per-schema anyway, making the `defaults` entry redundant noise. Avoid `defaults.ui` when individual schemas need different component libraries — it has no per-schema override path, so one value applies everywhere.

**Pitfalls:**
- Every sub-field of `defaults` is the lowest-priority override: CLI flags win, then `schemas.[key]` overrides, then `defaults`. Setting a value here does not guarantee it reaches codegen if any higher-priority source supplies the same field.
- `overwrite` silently defaults to `false` when the entire `defaults` block is omitted or when `overwrite` is not set inside it. In that state, existing output files are left unchanged and `runGenerate` returns `wroteFile: false` without throwing — generated output is silently discarded.
- There is a deprecated top-level `overwrite` key that `normalizeConfig` migrates into `defaults.overwrite`. If both are present, `defaults.overwrite` wins (`rest.defaults?.overwrite ?? overwrite`). Do not rely on the top-level key; set `defaults.overwrite` directly.
- `defaults.ui` controls the component library used during codegen only; it has no effect on runtime rendering. Setting it to `'shadcn'` while `components.preset` is `'html'` (or vice versa) produces a mismatch between the generated field components and the wired overrides.
- `optimization.level` accepts only `1 | 2 | 3`; any other number fails validation at `validateConfig` time. The property is validated by an explicit `z.union([z.literal(1), z.literal(2), z.literal(3)])`.
- The `defaults` block is parsed with `z.object().loose()`, so unrecognized keys are silently stripped by `validateConfig` rather than rejected — a typo like `overwirte: true` passes validation and takes no effect.
- `defaults.mode` falls back to `'submit'` when absent (`?? 'submit'`); `defaults.serverAction` falls back to `false`; `defaults.ui` falls back to `'shadcn'`. Omitting `defaults` entirely leaves all of these at their hard-coded fallback values.

#### types

**Type:** `string[]`

**Use when:**
- Set `types` to an explicit, fixed list of schema export names when you know exactly which exports to generate forms for and want no glob-pattern evaluation. Unlike `include`/`exclude`, each entry is matched literally against export names — no wildcard expansion occurs. Use it when the set of target schemas is stable and small (e.g. `['UserSchema', 'AddressSchema']`) and you want to pin codegen to those names in the config file rather than relying on pattern matching or auto-discovery.

Leave `types` unset when you need wildcard/glob-style filtering across many exports — use `include`/`exclude` instead.

**Avoid when:**
- When `--export` is passed on the CLI command, `types` is ignored entirely — the CLI uses the explicit flag and never consults `types`. Avoid setting `types` when you need wildcard or glob-style filtering across many exports — use `include`/`exclude` instead, since entries in `types` are matched as exact export name strings (no `wildcardPatternToRegExp` expansion). Do not set `types` to `[]` intending to suppress all generation — an empty array is treated the same as omitting the key (the `config.types.length > 0` guard falls through to `include`/`exclude` filtering); use `include: ['__never__']` (or any pattern that matches no real export name) if you want to prevent generation, because `matchesAnyPattern` returns `true` when `patterns` is empty or undefined.

**Pitfalls:**
- `types` completely bypasses `include`/`exclude` pattern filtering: when `types` has any entries, the CLI uses it as the exact export list and never calls `applyExportFilters`, so any `include` or `exclude` patterns in your config are silently ignored for that run.
- `types` is only consulted when `--export` is not passed on the CLI; a command-line `--export` flag takes precedence and makes `types` have no effect at all.
- An empty array `[]` is accepted by `validateConfig` without error, but at runtime the CLI treats `config.types.length > 0` as the condition, so `[]` falls through to `include`/`exclude` filtering — it does not produce an empty export list or skip generation. Use `undefined` (omit the key) rather than `[]` if you intend to delegate to `include`/`exclude`.
- Unlike `include`/`exclude`, entries in `types` are treated as exact export names, not wildcard patterns; `wildcardPatternToRegExp` is not applied to them, so `"*Schema"` will not match anything unless an export is literally named `"*Schema"`.
- A non-array value or an array containing any non-string elements will throw at `validateConfig` time with the message "config.types must be an array of strings when provided" — no silent coercion occurs.

#### include

**Type:** `string[]`

**Use when:**
- Set `include` when your schema file exports more names than you want to generate forms for and you need a whitelist. Each entry is an anchored wildcard pattern (`*` expands to `.*`; all other regex characters are escaped), matched against export names — for example `["*Schema"]` to target only exports ending in `Schema`, or `["UserSchema", "ProfileSchema"]` for an exact allowlist. `include` is applied before `exclude`, so only names that first survive `include` are then checked against `exclude`. Omit `include` (or set it to `[]`) when you want every export to be eligible — `matchesAnyPattern` returns `true` for an empty or missing array, so all exports pass through.

**Avoid when:**
- You only have one schema export to target — use the `--export` CLI flag (or `options.export` in `runGenerate`) to select it directly; `include` adds nothing when a single export is already identified by name. A `schemas` entry can supply generation config for that export (name, mode, out, fields) but does not perform export selection — only `--export`/`options.export` does.
- You want all exports processed — omit `include` entirely; an empty array `[]` is treated identically to `undefined` by `matchesAnyPattern` (both let every export through), so setting `include: []` is a no-op that misleads readers into thinking a filter is active.
- You are constraining exports exclusively through `schemas` keys — `include` filters by name pattern but does not merge with or replace per-schema config; using both simultaneously makes the effective allowed set harder to reason about.

**Pitfalls:**
- **`components`**: `source` is required and must be a non-empty string after trimming — an empty or whitespace-only value throws at `validateConfig` time. `fieldTemplate` has the same constraint. When you set `overrides` for a component that already has preset defaults (e.g. `shadcn`'s `Select`), `defineConfig` spreads at the entry level (`{ ...base, ...config.components.overrides }`), so your entry wholesale replaces the preset's entire `ComponentOverride` object — both `controlled` and `props` are replaced, not merged. If you override `Select` in a shadcn config without explicitly setting `controlled: true`, the component is rendered with `register()` spread instead of `Controller`, silently breaking controlled input wiring; you must also re-include `onValueChange: 'field.onChange'` in `props` yourself. A typo in an `overrides` component key (e.g. `"Selct"`) is not validated against the component module; the misnamed override is silently ignored.
- **`defaults`**: Every property here is a fallback — `schemas.[key].mode`, `schemas.[key].out`, `schemas.[key].serverAction`, and `schemas.[key].fields` all override the corresponding `defaults` entries for that schema. Setting a default does not guarantee it applies to every schema. `overwrite` defaults to `false` when omitted; existing output files are left unchanged without any error, and `runGenerate` returns `wroteFile: false` silently. `optimization.level` must be exactly `1`, `2`, or `3`; passing any other value (e.g. `4`) throws at `validateConfig` time — `.loose()` only strips unknown keys from the enclosing object, not invalid values for a known key like `level`, so the union `z.union([z.literal(1), z.literal(2), z.literal(3)])` produces a `ZodError` (surfaced via `formatValidationError`) when given an out-of-range value. A legacy top-level `overwrite` key is migrated to `defaults.overwrite` by `normalizeConfig`, but only when `defaults.overwrite` is not already set — if both exist, `defaults.overwrite` wins.
- **`types`**: Must be an array of strings; a non-array value throws with the message `"config.types must be an array of strings when provided"`. The implementation reference does not show this array being passed to `applyExportFilters` (which only consumes `include` and `exclude`); avoid assuming it filters schema exports the same way `include` does.
- **`include`**: An explicit empty array (`[]`) behaves identically to omitting `include` — `matchesAnyPattern` returns `true` when the patterns array is empty, so all exports pass through. Only a non-empty array with no matching patterns excludes anything. Patterns are anchored wildcards converted to `^pattern$` regexes; they are matched against export names, not file paths. `*` expands to `.*`, so `*Schema` matches any export ending in `Schema`, but a pattern containing `/` will not behave like a file-system glob — it matches against the export identifier string literally.
- **`exclude`**: Exclusion runs after `include` filtering; an export that matches both `include` and `exclude` is excluded. An empty `exclude` array disables all exclusions, the same as omitting the key. The same anchored wildcard matching as `include` applies — patterns are tested against export names only, not file paths or module paths.
- **`fields`**: Keys are dot-path strings; unrecognized paths that do not correspond to any field in the walked schema are silently ignored at codegen time — no error is raised. When a `schemas.[key].fields` entry also exists for the same dot-path key, it shallow-merges on top of the global entry: the schema-level entry wins per-property within the same key, not as a wholesale replacement. Because this map is global, a field path that happens to exist in multiple schemas will silently receive the same override in all of them unless a per-schema `schemas.[key].fields` entry explicitly overrides it. Setting `component` to an empty string throws at `validateConfig`; omitting it (undefined) is valid.
- **`schemas`**: Entry keys must exactly match the exported identifier name as it appears in the schema file; a name mismatch means the entire entry is silently ignored with no warning. `name`, `mode`, `out`, and `serverAction` are root-only settings — they apply only when this schema is the root export passed to codegen; nested appearances of the same schema object within a parent schema do not inherit these settings. `component` follows the schema object by identity: every parent schema that embeds the same exported Zod instance will inherit this default renderer, which can produce unexpected results when a subschema is deliberately reused in different contexts with different rendering needs. `fields` paths are relative to this schema's own shape; a path valid in the global `fields` map but not in this schema's inferred type will silently apply to nothing. The config schema uses `.loose()`, so unrecognized keys in a schema entry are stripped silently rather than causing a validation error.

#### exclude

**Type:** `string[]`

**Use when:**
- Set `exclude` when your schema file contains exports you do not want to generate forms for — for example, internal utility schemas, base/mixin schemas, or non-form domain types that happen to be co-located in the same file. Use wildcard patterns (e.g. `["*Base", "*Internal", "Raw*"]`) to batch-exclude by naming convention rather than enumerating each name. Leave it unset (or as an empty array) when every export in scope should be processed — both produce identical behavior since `applyExportFilters` treats missing or empty `exclude` as no-op. When used alongside `include`, remember that `exclude` runs after `include` on the already-filtered set, so a name excluded here will be dropped even if it matched an `include` pattern.

**Avoid when:**
- When all included exports should be generated — omit `exclude` entirely; an empty array `[]` and `undefined` behave identically (no exports are removed). When `include` already narrows the export set precisely to what you want — adding `exclude` on top creates a redundant, confusing second filter. When you need to skip only one well-known schema — prefer an exact-name entry like `exclude: ['ExactSchemaName']` over a glob; an exact string carries no wildcard expansion risk and is equally precise. Avoid patterns that are too broad (e.g. `["*Schema"]`) — they match eagerly against all export names after `include` runs and emit no error when every export is removed, leaving the output directory empty without warning.

**Pitfalls:**
- Patterns match export **names**, not file paths — a pattern like `src/schemas/*.ts` will never match anything; put it in `include`/`exclude` only if it matches the exported identifier string.
- `exclude` runs against the set already narrowed by `include` (line 19 then 24 in `applyExportFilters`), so `exclude: ['*']` with a non-empty `include` excludes everything from the included subset, not all exports in the file.
- An empty array `[]` is treated identically to omitting `exclude` — `applyExportFilters` short-circuits at `exclude.length === 0` and returns the included set unchanged.
- `*` is the only wildcard character — every other regex metacharacter (`?`, `.`, `+`, `{`, `}`, etc.) is escaped before compilation, so `User?chema` matches an export literally named `User?chema`, not `UserSchema`.
- Patterns are fully anchored (`^...$`) — `Schema` matches only an export named exactly `Schema`; use `*Schema` to match any export ending in `Schema`, or `*Schema*` for a contains match.
- An export that has explicit per-schema config in `schemas` is still excluded if its name matches an `exclude` pattern — the filter runs on raw export names before any schema config is consulted.

#### fields

**Type:** `Record<string, TypedFieldConfig<TComponents>>`

**Use when:**
- Set `fields` when you want the same field-level override — component, props, order, hidden, disabled, section, or helpText — to apply across **every** schema that shares that dot-path key. Use it for project-wide conventions such as forcing all `email` fields to use an `EmailInput` component or marking every `createdAt` field as hidden. Leave it unset (or use `schemas.[key].fields` instead) when an override should apply to only one schema; a path in `fields` silently propagates to all schemas that contain it, so global entries can affect schemas you did not intend to customize.

**Avoid when:**
- When the field configuration should apply to only one specific schema — use `schemas.[key].fields` instead, since entries in `fields` are applied globally to every schema processed. Avoid when different schemas need conflicting settings for the same field path key (e.g., one schema needs `email` as a `TextInput` and another as a `PasswordInput`) — a single global entry cannot satisfy both, and schema-level entries shallow-merge on top rather than replace, so the global value bleeds into schemas that do not override it. Avoid setting `props` here when any schema will partially override those props in `schemas.[key].fields` — `resolveFieldConfig` replaces `props` wholesale (shallow field-entry merge), so global `props` keys absent from the schema-level entry are silently dropped.

**Pitfalls:**
- **Typos in path keys are silently ignored.** There is no runtime validation that a key in `fields` corresponds to a real path in any schema — a misspelled key (e.g. `"fistName"` instead of `"firstName"`) produces no error and no effect.
- **`props` is replaced, not deep-merged.** When a `schemas[key].fields` entry overrides a global `fields` entry for the same path, `resolveFieldConfig` does a shallow per-entry merge (`{ ...globalField, ...schemaField }`). If both sides define `props`, the schema-level `props` object replaces the global one entirely; any prop keys present only in the global entry are lost.
- **Global `fields` bleeds into every schema.** An entry in `fields` applies to all schemas that share the same field path. If one schema should behave differently, you must explicitly override that path in `schemas[key].fields` — there is no way to unset a global entry for a single schema.
- **`component` must be a non-empty string.** Setting `component: ""` fails config validation with a descriptive error. Omit `component` entirely to leave the field's component unspecified.
- **Array path forms are not equivalent.** `items.0.name` targets the element at index 0 specifically; `items[].name` is the normalized pattern form for all array items. Using one where the other is expected silently misses the target.
- **Unknown extra keys in each entry are silently dropped.** The underlying Zod schema uses `.loose()`, so unrecognized properties are discarded during `validateConfig` without warning — typos in option names (e.g. `helptext` instead of `helpText`) are swallowed.

#### schemas

**Type:** `{ [K in keyof TSchemas & string]?: ZodTypeConfig< TSchemas[K] extends $ZodType ? SchemaFieldPath<TSchemas[K]> : string, TComponents >; }`

**Use when:**
- Use `schemas` when two or more schemas in the same file need different generation settings — for example, different `out` paths, `mode`, `serverAction`, or generated component `name` — that cannot be satisfied by a single `defaults` block. Also use it when a reusable exported subschema (e.g. `AddressSchema` referenced inside multiple parent schemas) should always render with a specific `component`: the schema's component setting follows that exported schema object by identity wherever it appears as a subschema, with usage-site path overrides still winning. Use it when you want per-schema `fields` overrides that only apply to one schema and should not bleed into others — those entries shallow-merge on top of global `fields` at `resolveFieldConfig` time. Leave `schemas` omitted when all schemas share the same generation settings and the global `fields` map plus `defaults` block are sufficient.

**Avoid when:**
- When every schema in the file shares the same generation settings — use `defaults` and top-level `fields` instead; an empty `schemas` object is noise. When a schema is not exported by name from the schema file — the lookup is `moduleExports[exportName]`, so a key that does not match any named export is silently ignored and has no effect. When you want to apply a field override uniformly across all schemas — put it in the top-level `fields` map; `schemas.[key].fields` only applies to that specific export and must be repeated for every schema that needs it. When the schema you want to configure is not a directly exported name (e.g. it is only used as an inline subschema and never exported) — `schemas` keys must match top-level module export names; inner anonymous shapes cannot be addressed here.

**Pitfalls:**
- Keys must exactly match the exported schema name as a string — the runtime looks up `componentConfig.schemas?.[exportName]` in `runGenerate`; a misspelled or wrong-case key passes validation (the internal schema uses a loose `z.record`) and is silently ignored with no warning or error.
- `name`, `mode`, `out`, and `serverAction` are root-only — they are consumed only when that schema export is the selected root for CLI or Vite codegen. Nested appearances of the same schema object within a parent schema ignore all four properties.
- `fields` merges per-key with a one-level spread over global `fields` (via `resolveFieldConfig`): `merged[key] = { ...globalField, ...schemaField }`. Scalar properties such as `component`, `order`, and `helpText` are inherited from the global entry through this spread. However, `props` inside a field entry is itself an object and is replaced wholesale — not deep-merged — so if a schema-level field entry defines `props`, the entire global `props` object for that field key is discarded; any prop keys present only in the global entry (e.g. `className`, `placeholder`) are silently dropped.
- Field path type inference for `fields` keys requires passing the schema map as the `TSchemas` type parameter to `defineConfig`. Without it, `fields` key type widens to `string`, losing dot-path autocomplete and compile-time safety.
- `component` on a schemas entry is a schema-identity default — it follows the exported object by reference everywhere it is reused as a subschema. It does not rename the generated top-level component; use `name` for that. Setting `component` on a root-only schema that is never reused as a subschema has no observable effect.