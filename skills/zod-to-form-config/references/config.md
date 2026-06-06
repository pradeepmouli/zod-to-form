# Configuration

## ZodFormsConfig

### Properties

#### components

**Type:** `ComponentsConfig<TComponents>`

**Required:** yes

**Use when:**
- Set `components` whenever generated code must import UI components from a library — any time the output TSX should reference named components (e.g. `Input`, `Label`, `Select`) rather than raw HTML elements. Leave it unset only if you want the codegen to emit plain HTML (`<input>`, `<label>`, etc.) with no component imports at all.

**Avoid when:**
- Do not set `components.preset` to a value your component library does not match — shadcn preset enables controlled-mode mappings (field-expression props, explicit `checked`/`value` wiring) that silently break uncontrolled-by-default libraries like plain MUI or Chakra.
- Do not use a relative path for `components.source` unless the generated file will always live in the same directory as the component module; the path is emitted verbatim into import statements resolved relative to the output file, so it breaks whenever the generated component is moved.
- Do not populate `components.overrides` for every component when a matching preset already covers them; manual overrides that duplicate preset entries add maintenance burden and can shadow future preset updates without surfacing a type error.

**Pitfalls:**
- Setting `preset` to an unrecognized string silently no-ops all built-in overrides — controlled components like `Select`, `Checkbox`, and `Switch` will be treated as uncontrolled because no preset mappings are merged.
- `overrides[K].props` is replaced wholesale, not shallow-merged with the preset's default props. If you add a per-component `props` entry for a component the preset already covers (e.g. `shadcn`'s `Select`), you lose the preset's field expressions (`onValueChange: 'field.onChange'`) and the component stops binding to RHF state.
- Setting `controlled: true` in an override without also supplying the matching field-expression props (`field.value`, `field.onChange`) creates a controlled component with no value binding — the input renders but RHF never sees its changes.
- `source` is emitted verbatim into generated `import` statements and is resolved relative to the **output file**, not the config file. Relative paths break when the generated component is moved to a different directory; prefer package-relative paths (e.g. `@/components/ui`) unless the generated file always lives beside the component module.
- `source` must be a barrel/index that re-exports every component name referenced in `overrides` keys and in any `fields[].component` override. Codegen succeeds silently if an export is missing; the form only fails at runtime with a missing component error.
- `fieldTemplate` completely replaces the preset's field wrapper. If the preset's default template was providing error message display or ARIA structure, your replacement template must re-implement all of that; there is no partial extension mechanism.
- Omitting `components` entirely is a hard error — it is the only required key in `ZodFormsConfig` and `validateConfig()` throws immediately if it is absent or not an object.

#### defaults

**Type:** `ConfigDefaults`

**Use when:**
- Set `defaults` when multiple schemas in the config share the same generation settings — use it to avoid repeating `mode`, `ui`, `out`, `overwrite`, `serverAction`, `formProvider`, or `optimization` on every `schemas[key]` entry. For example, if every schema targets the same output directory with the same UI library, set those once in `defaults` rather than per-schema. Leave `defaults` unset (or set only the properties you actually want shared) when schemas have meaningfully different output targets or modes, since a value in `defaults` silently applies to every auto-discovered schema that does not override it. Per-`schemas[key]` values always win over `defaults`, so the safe strategy is to put the most permissive or most common settings here and override the exceptions per schema.

**Avoid when:**
- Leave `defaults` unset when every schema in `schemas` has distinct settings — a `defaults` block that is fully overridden for every entry adds boilerplate without reducing repetition. Avoid setting `defaults.out` globally when your schemas target different output directories; every `schemas` entry must then explicitly re-specify `out`, and any new entry that forgets the override silently lands files in the shared fallback directory. Avoid `defaults.overwrite: true` globally in projects where generated files are manually edited after generation — it discards those edits without warning on the next run. Avoid `defaults.serverAction: true` globally when only a subset of schemas are used in Server Action contexts; the flag bleeds into client-only form schemas that should not carry server-action wiring.

**Pitfalls:**
- `defaults.overwrite: true` silently replaces every generated file on every run — set it only if all output paths are codegen-owned; leave it unset (or false) when generated files may receive manual edits.
- `defaults.out` writes every schema to the same directory; if two schemas produce the same file name (e.g. both resolve to `LoginForm.tsx`) the second write will clobber the first without warning.
- `defaults.ui` must agree with `components.preset`; mismatching them (e.g. `ui: 'shadcn'` with `preset: 'html'`) causes the codegen to emit import paths from one component set while the field templates expect another, producing broken imports that TypeScript will not catch until the consumer compiles.
- `defaults.serverAction: true` wraps every generated form in a server-action handler; applying it globally will break forms intended for client-side submission that never receive a `action` prop.
- `defaults.formProvider: true` injects `<FormProvider>` into every form; forms that do not use `useFormContext()` carry a needless render overhead, and the extra provider can mask missing explicit `form` prop wiring elsewhere in the tree.
- `defaults.optimization.level` is a codegen-time setting, not a runtime one — changing it has no effect on already-generated files or on `<ZodForm>` runtime rendering; you must re-run codegen for it to take effect.
- A high `optimization.level` (e.g. `3`) applied globally may eliminate inline validators that certain schemas rely on for conditional field visibility; override per-schema in `schemas[K].optimization` for any schema that uses dynamic refinements.
- Every key in `defaults` is a lowest-priority fallback; a per-schema override always wins — but if you later remove a per-schema override expecting `defaults` to take effect, verify that `defaults` was actually set, because an absent `defaults` key silently falls back to the built-in hardcoded default rather than erroring.

#### types

**Type:** `string[]`

**Use when:**
- Use `types` when you have a **small, known, stable set of schema export names** and want to pin the exact exports to process — e.g. `types: ['LoginSchema', 'RegisterSchema']` on a schema file that exports several schemas but only two should produce forms. Prefer it over `include` when names don't share a useful prefix/suffix pattern and you want to enumerate them explicitly. Set it to the shortest list that covers all schemas you need; there is no need to set both `types` and `include` for the same names.

**Avoid when:**
- Avoid `types` when the set of export names is large, frequently renamed, or follows a consistent naming pattern — in those cases `include` with a glob (e.g. `['*Schema']`) is less brittle and does not require updating a hand-maintained list on every rename. Avoid it when you need wildcard or suffix matching; `types` compares exact strings only and a glob like `'*Schema'` will match nothing except the literal four-character-plus-asterisk string. Avoid setting both `types` and `include` for the same names — they are redundant and the interaction can be confusing. Leave `types` unset when you want all exported Zod schemas processed (omit both `types` and `include`), or when auto-discovery via `include` patterns covers your selection cleanly.

**Pitfalls:**
- **Exact strings, not glob patterns** — `types: ['*Schema']` matches the literal string `'*Schema'`, not any export ending in `Schema`; for pattern-based selection use `include` instead.
- **Case-sensitive** — `types: ['userSchema']` silently skips an export named `UserSchema`; the comparison is byte-for-byte against the exported name.
- **Silent miss on typo** — If a listed name does not exist in the schema file the CLI emits nothing and no error; always cross-check names against the file's actual export list.
- **Does not configure the schema** — Adding a name here only marks it for processing; it does not set field overrides, mode, or output path. For per-schema behaviour use `schemas[key]`.
- **No deduplication warning** — Listing the same name twice is silently accepted and may cause double-generation in pipelines that don't deduplicate.

#### include

**Type:** `string[]`

**Use when:**
- Set `include` when your schema file exports more Zod schemas than you want to generate forms for and you want to opt-in by glob pattern rather than by exact name — for example, `include: ['*Schema', '*Form']` to generate only exports whose names end with those suffixes.

Prefer `include` over `types` when you need glob/wildcard matching; use `types` instead when you have a small, fixed list of exact export names.

Leave `include` unset (omit the property entirely) to generate forms for every discovered Zod export — this is the right default for a schema file that is entirely dedicated to form schemas.

Avoid setting it to `[]`; an empty array silently produces zero output because no name matches any pattern.

**Avoid when:**
- Avoid setting `include` when your schema file is entirely dedicated to form schemas and every export should produce a form — omitting it is the correct default and generates forms for all discovered Zod exports without risk of accidentally filtering something out.

Avoid it when you already have a short, explicit list of export names: use `types` instead, which is exact-match and eliminates glob edge cases entirely.

Avoid setting `include: []`; an empty array silently produces zero generated forms — it matches nothing and emits no warning.

Avoid combining `include` with broad `exclude` patterns that overlap: `exclude` always wins over `include` when both match the same name, making the `include` entry a no-op for that name.

Avoid using `include` if you also declare entries under `schemas:` but don't add those exact keys to at least one `include` pattern — `schemas`-keyed entries are not exempt from `include` filtering and may be silently skipped.

**Pitfalls:**
- An empty array `[]` is not the same as omitting the option — `include: []` matches no export names and silently produces zero generated forms; omit the property entirely to include all exports.
- Patterns match schema export names (e.g., `UserSchema`), not file system paths — glob syntax like `src/**/*.ts` will never match anything because the filter operates on the exported symbol name, not the source file location.
- Matching is case-sensitive — `include: ['*schema']` will not match `UserSchema`; use `*Schema` to match PascalCase suffixes.
- `exclude` always wins when a name matches both lists — a schema whose export name satisfies an `include` pattern and an `exclude` pattern will be excluded, not included; there is no way to "protect" an included name from a broad `exclude` glob.
- Schemas listed explicitly under `schemas:` are not automatically exempt from `include`/`exclude` filtering — if `include` is set and a named `schemas` entry does not match any pattern, it may still be skipped; always ensure `include` patterns cover every key you declare in `schemas`.

#### exclude

**Type:** `string[]`

**Use when:**
- Set `exclude` when your schema file exports internal, utility, or test schemas that should not produce generated form components — for example, `exclude: ['*Internal*', 'BaseSchema', 'TestFixture*']` suppresses matching export names while leaving everything else for auto-discovery. Also use it when you add a new export to a file and want to opt it out without touching `schemas:` entries. Leave `exclude` unset (or use `include` instead) when you have only a handful of schemas to process — it is easier to allowlist with `include` than to chase a growing denylist. Avoid pairing broad patterns like `'*'` with `exclude` unless you have explicit `schemas:` entries for everything you want generated, because `exclude` only skips auto-discovery and cannot suppress a `schemas:`-keyed entry.

**Avoid when:**
- Leave `exclude` unset when every auto-discovered export in the target files should generate a form — adding an empty or unnecessary denylist forces ongoing maintenance as schemas are added. Avoid `exclude` when you have only a small, well-known set of schemas to process; use `include` for an allowlist instead, because chasing a growing denylist with `exclude` is harder to keep correct. Do not use `exclude` as a substitute for removing or refactoring schemas you intend to delete — it silently masks exports that will still be compiled and imported. Avoid setting `exclude` alongside `include` patterns that overlap the same names; `exclude` always wins over `include`, turning those `include` entries into a no-op. Do not rely on `exclude` to suppress a schema you have also declared under `schemas:` — `exclude` only filters auto-discovery, so explicitly keyed `schemas:` entries are always processed regardless of any matching `exclude` pattern.

**Pitfalls:**
- Patterns match schema **export names**, not file paths — using path separators (`/`, `**`) in entries will never match anything and silently has no effect.
- Glob patterns are **case-sensitive**: `'internal*'` will not suppress `'InternalPayload'`; you must match the exact casing of the export.
- An overly broad entry like `'*Schema'` or `'*'` suppresses every **auto-discovered** export, resulting in a silent no-op codegen run with zero auto-generated outputs. However, schemas explicitly keyed under `schemas:` are unaffected — `exclude` only filters auto-discovery; `schemas:` entries are always processed regardless of any matching `exclude` pattern.
- Setting `exclude: []` (empty array) is functionally identical to omitting the field — it does not override or clear any exclude patterns inherited from a parent config layer.
- When both `include` and `exclude` are set, a schema matching **both** lists may produce surprising results depending on evaluation order; avoid overlapping the two lists — use one or the other, not both, for the same name space.

#### fields

**Type:** `Record<string, TypedFieldConfig<TComponents>>`

**Use when:**
- Set `fields` when the same field name (e.g. `email`, `phone`, `createdAt`) appears in multiple schemas and you want to apply the same component or props override everywhere that name occurs — for example, `fields: { email: { component: 'EmailInput' }, phone: { component: 'PhoneField', props: { format: 'national' } } }`. This is the right level for project-wide naming conventions that span many schemas. Leave `fields` unset (and use `schemas.[key].fields` instead) when the override is relevant to only one schema, or when the field name is unique — the per-schema location provides dot-path type-checking that this global map cannot offer, so prefer it whenever the override is not genuinely cross-schema.

**Avoid when:**
- Avoid `fields` when the override applies to only one schema — use `schemas.[key].fields` there instead, which provides dot-path type-checking that this global map cannot offer. Avoid it when the field name is common (e.g. `name`, `id`) but you only want the override applied selectively — every schema that has a matching key will receive it, with no way to opt specific schemas out. Avoid it when you need to extend a global entry at the schema level by adding one prop while inheriting others — per-schema `fields` entries replace the global entry wholesale, so you must repeat all props; the merge is not additive at the `props` level. Avoid it when you need typed dot-path keys for nested fields (e.g. `address.street`) — keys here are always `string`, so a typo silently does nothing and TypeScript cannot catch schema renames.

**Pitfalls:**
- Keys are **untyped strings** — unlike `schemas.[key].fields`, there is no dot-path type checking; a typo (e.g., `"emailAdress"` instead of `"emailAddress"`) silently does nothing at both compile time and runtime
- Applies **across every schema** — a key like `"name"` will override the `name` field in every schema that has one; isolate schema-specific overrides under `schemas.[key].fields` instead to avoid unintended collisions
- **`props` is not deep-merged** — the shallow merge in `resolveFieldConfig` (`{ ...globalField, ...schemaField }`) replaces the entire `props` object when a per-schema entry exists for the same key; any prop set only in the global entry is silently dropped if the schema entry also defines `props`
- Array item paths require **`[]` syntax** (e.g., `items[].title`), not numeric indices; a numeric path like `items.0.title` will not match and is silently ignored
- **Renaming a schema field breaks coverage silently** — because keys are plain strings, TypeScript cannot catch staleness when a Zod object property is renamed; the stale config key becomes an unreferenced no-op with no warning
- Per-schema entries always win, so a global entry **cannot be partially extended** at the schema level; if you need to add one prop while keeping global defaults, you must repeat all props in the schema-level entry

#### schemas

**Type:** `{ [K in keyof TSchemas & string]?: ZodTypeConfig< TSchemas[K] extends $ZodType ? SchemaFieldPath<TSchemas[K]> : string, TComponents >; }`

**Use when:**
- Set `schemas` when you need per-schema overrides that must not bleed into other schemas — for example, a custom `out` path for one output file, a different `component` renderer for one root schema, or `fields` label/prop tweaks for a field name that exists in multiple schemas but should only be styled differently in this one. Set a key only for schemas that genuinely diverge from the global `fields`/`defaults` baseline; omit keys where the defaults are correct. Leave `schemas` entirely unset when `fields` and `defaults` cover all schemas uniformly — adding empty per-schema entries is noise. Avoid adding a key solely to repeat what global config already provides; the merge is additive and per-schema values always win, so an unnecessary entry silently prevents the global value from ever applying.

**Avoid when:**
- Avoid setting a `schemas` entry for a schema whose generation can be fully described by the global `fields` and `defaults` — per-schema entries always win over globals, so an entry that merely repeats the same values silently blocks global config from ever applying to that schema. Do not add empty or near-empty entries just to document that a schema exists; they are noise with no effect. Avoid using `schemas` as your primary way to list which schemas to process — that is the job of `include` or `types`; an entry here does not make a schema immune from `include` filtering, so a key whose export name fails an active `include` pattern is still silently skipped. Do not set `name`, `mode`, `out`, or `serverAction` on a schema that is only ever consumed as a nested subschema inside another object schema — those root-only properties have no effect at nested positions. Avoid adding a key for a schema that is not exported from the source file; the entry is accepted without error but produces no output and emits no warning. Avoid setting `fields` on a schema entry if the same override already lives in the top-level `fields` map and no schema-specific divergence is needed — the global `fields` entry is sufficient, and duplicating it at the schema level means any future global change will silently not reach that schema.

**Pitfalls:**
- **Field path type-checking is opt-in** — `fields` keys are only typed as `SchemaFieldPath<TSchemas[K]>` when the `TSchemas` type parameter is bound (e.g. via `defineConfig<TComponents, typeof schemaModule>()`). Without it, keys fall back to `string` and typos in field paths silently do nothing.
- **`component` follows schema object identity, not usage location** — setting `schemas.AddressSchema.component` causes every parent schema that re-uses the *same exported object* as a nested subschema to also render with that component, not just the root codegen target; do not set `component` on widely-shared subschemas unless that renderer is correct in all nesting contexts.
- **`name`, `mode`, `out`, and `serverAction` are root-only** — these properties have no effect when the schema appears as a subschema inside another schema; they only apply when the schema is the top-level codegen target.
- **`out` on a per-schema entry does not override `defaults.out` for other schemas** — it is a one-off path for that single key; setting it to a directory shared with other schemas can still produce filename collisions if two schema names resolve to the same base filename.
- **`include` vs `exclude` asymmetry** — `exclude` patterns do NOT suppress entries explicitly declared under `schemas:`; they are always processed. However, an active `include` filter still applies — a `schemas` key whose export name does not match any `include` pattern may be skipped. Always add every `schemas` key to your `include` patterns when both are set.
- **A key for a non-existent schema export is silently ignored** — declaring `schemas: { GhostSchema: { ... } }` when `GhostSchema` is not exported from the schema file produces no error and no output; cross-check every key against the file's actual exports.
- **`fields` merge inside a schema entry is shallow** — the `props` object on a per-schema field entry replaces the global `fields` entry's `props` wholesale; any prop set only at the global level is silently dropped if the same key also carries a `props` object here. Repeat all necessary props at the schema level.
- **Keys not in `TSchemas` are invisible to TypeScript but accepted at runtime** — a key that does not exist in the `TSchemas` map cannot be type-checked and the entry is accepted silently; validate the config file with `validateConfig()` if loading it at runtime to catch structural errors early.