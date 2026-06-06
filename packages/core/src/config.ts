import { z } from 'zod';
import type { $ZodType } from 'zod/v4/core';
import type { FieldConfig } from './types.js';

// ─── Component Override ───────────────────────────────────────────────

/** Per-component metadata override. Only components that differ from defaults need an entry. */
export type ComponentOverride = {
  /** When true, use Controller/useController instead of register() spread */
  controlled?: boolean;
  /**
   * Default props for this component type.
   * Values matching a known field expression string are resolved from the RHF controller.
   * Per-field props override these via shallow merge (field config wins).
   */
  props?: Record<string, unknown>;
};

// ─── Components Config ────────────────────────────────────────────────

/**
 * Preset name for built-in component library mappings.
 * `'shadcn'` uses Radix-based controlled components with field-expression props;
 * `'html'` uses plain uncontrolled HTML inputs.
 *
 * @category Configuration
 */
export type ComponentPreset = 'shadcn' | 'html';

/** @category Configuration */
export type ComponentsConfig<T extends Record<string, unknown> = Record<string, unknown>> = {
  /** Import path for the components module */
  source: string;
  /** Preset that provides base overrides and default field template */
  preset?: ComponentPreset;
  /**
   * Custom field template component path.
   * Controls the composition of label + input + description + helpText + error.
   * Overrides the preset's default template.
   */
  fieldTemplate?: string;
  /** Per-component overrides, strongly typed to module export keys */
  overrides?: { [K in keyof T & string]?: ComponentOverride };
};

// ─── Typed Field Config ──────────────────────────────────────────────

/** Field config with props constrained to a specific component's prop type */
type TypedFieldConfigForComponent<
  TComponents extends Record<string, unknown>,
  K extends keyof TComponents & string
> = Omit<FieldConfig, 'component' | 'props'> & {
  component: K;
  props?: TComponents[K] extends Record<string, unknown>
    ? Partial<TComponents[K]>
    : Record<string, unknown>;
};

/** Field config with no component specified (untyped props) */
type UntypedFieldConfig = Omit<FieldConfig, 'component'> & {
  component?: undefined;
};

/**
 * Discriminated union over component keys.
 * When `component` is set to a known component key, `props` is constrained
 * to that component's prop type. When `component` is omitted, `props` is
 * an open `Record<string, unknown>`.
 */
export type TypedFieldConfig<
  TComponents extends Record<string, unknown> = Record<string, unknown>
> =
  | {
      [K in keyof TComponents & string]: TypedFieldConfigForComponent<TComponents, K>;
    }[keyof TComponents & string]
  | UntypedFieldConfig;

// ─── Config Types ────────────────────────────────────────────────────

export type OptimizationConfig = {
  level?: 1 | 2 | 3;
};

/**
 * Default generation settings applied to all schemas unless overridden per-schema.
 * These map directly to CLI flag defaults and to the `defaults` block in `z2f.config.ts`.
 *
 * @category Configuration
 */
export type ConfigDefaults = {
  mode?: 'submit' | 'auto-save';
  ui?: 'shadcn' | 'html';
  out?: string;
  overwrite?: boolean;
  serverAction?: boolean;
  /** Wrap generated form in <FormProvider {...form}> */
  formProvider?: boolean;
  /** Validation optimization configuration */
  optimization?: OptimizationConfig;
};

/**
 * Configuration for a single named schema export in `defineConfig({ schemas: ... })`.
 *
 * This type mixes two scopes:
 * - **root-export generation settings** like `name`, `mode`, `out`, and `serverAction`
 * - **schema-identity defaults** like `component` and nested `fields`, which follow
 *   the same exported schema object anywhere it is reused as a subschema
 *
 * Usage-site path overrides still win over these schema defaults.
 *
 * @category Configuration
 */
export type ZodTypeConfig<
  TFieldKeys extends string = string,
  TComponents extends Record<string, unknown> = Record<string, unknown>
> = {
  /**
   * Override the generated top-level form component name when this schema is
   * selected as the root export in CLI or Vite codegen.
   *
   * Root-only: nested appearances of the same subschema do not use this name.
   */
  name?: string;
  /**
   * Default renderer for this schema wherever the same exported schema object
   * is encountered.
   *
   * When set on a reusable subschema export (for example `ExpressionSchema`),
   * any parent schema that references that exact schema instance will render it
   * with this component unless a usage-site path override wins.
   */
  component?: string;
  /** Root-only generation mode override for this schema export. */
  mode?: 'submit' | 'auto-save';
  /** Root-only output path override for this schema export. */
  out?: string;
  /** Root-only server action override for this schema export. */
  serverAction?: boolean;
  /**
   * Schema-local field configuration applied relative to this schema's own
   * shape.
   *
   * For a root schema, these entries merge over global `fields`. For a reused
   * exported subschema, the same config follows that schema by identity and
   * becomes its default nested behavior everywhere it appears.
   */
  fields?: Partial<Record<TFieldKeys, TypedFieldConfig<TComponents>>>;
};

/**
 * Root configuration type for `zod-to-form` code generation.
 *
 * Describes the component library to use, generation defaults, per-schema
 * overrides, and global field configuration. Pass this to `defineConfig()` in
 * your `z2f.config.ts` for full type inference, or load and validate it at
 * runtime with `validateConfig()`.
 *
 * @typeParam TComponents - Shape of the component module (used to type `fields.component`).
 * @typeParam TSchemas - Map of schema export names to their Zod schema types (used to type `schemas.[key].fields`).
 * @category Configuration
 */
export type ZodFormsConfig<
  TComponents extends Record<string, unknown> = Record<string, unknown>,
  TSchemas extends Record<string, unknown> = Record<string, unknown>
> = {
  /**
   * @pitfalls - Setting `preset` to an unrecognized string silently no-ops all built-in overrides — controlled components like `Select`, `Checkbox`, and `Switch` will be treated as uncontrolled because no preset mappings are merged.
   * - `overrides[K].props` is replaced wholesale, not shallow-merged with the preset's default props. If you add a per-component `props` entry for a component the preset already covers (e.g. `shadcn`'s `Select`), you lose the preset's field expressions (`onValueChange: 'field.onChange'`) and the component stops binding to RHF state.
   * - Setting `controlled: true` in an override without also supplying the matching field-expression props (`field.value`, `field.onChange`) creates a controlled component with no value binding — the input renders but RHF never sees its changes.
   * - `source` is emitted verbatim into generated `import` statements and is resolved relative to the **output file**, not the config file. Relative paths break when the generated component is moved to a different directory; prefer package-relative paths (e.g. `@/components/ui`) unless the generated file always lives beside the component module.
   * - `source` must be a barrel/index that re-exports every component name referenced in `overrides` keys and in any `fields[].component` override. Codegen succeeds silently if an export is missing; the form only fails at runtime with a missing component error.
   * - `fieldTemplate` completely replaces the preset's field wrapper. If the preset's default template was providing error message display or ARIA structure, your replacement template must re-implement all of that; there is no partial extension mechanism.
   * - Omitting `components` entirely is a hard error — it is the only required key in `ZodFormsConfig` and `validateConfig()` throws immediately if it is absent or not an object.
   * @useWhen Set `components` whenever generated code must import UI components from a library — any time the output TSX should reference named components (e.g. `Input`, `Label`, `Select`) rather than raw HTML elements. Leave it unset only if you want the codegen to emit plain HTML (`<input>`, `<label>`, etc.) with no component imports at all.
   * @avoidWhen - Do not set `components.preset` to a value your component library does not match — shadcn preset enables controlled-mode mappings (field-expression props, explicit `checked`/`value` wiring) that silently break uncontrolled-by-default libraries like plain MUI or Chakra.
   * - Do not use a relative path for `components.source` unless the generated file will always live in the same directory as the component module; the path is emitted verbatim into import statements resolved relative to the output file, so it breaks whenever the generated component is moved.
   * - Do not populate `components.overrides` for every component when a matching preset already covers them; manual overrides that duplicate preset entries add maintenance burden and can shadow future preset updates without surfacing a type error.
   */
  components: ComponentsConfig<TComponents>;
  /**
   * @pitfalls - `defaults.overwrite: true` silently replaces every generated file on every run — set it only if all output paths are codegen-owned; leave it unset (or false) when generated files may receive manual edits.
   * - `defaults.out` writes every schema to the same directory; if two schemas produce the same file name (e.g. both resolve to `LoginForm.tsx`) the second write will clobber the first without warning.
   * - `defaults.ui` must agree with `components.preset`; mismatching them (e.g. `ui: 'shadcn'` with `preset: 'html'`) causes the codegen to emit import paths from one component set while the field templates expect another, producing broken imports that TypeScript will not catch until the consumer compiles.
   * - `defaults.serverAction: true` wraps every generated form in a server-action handler; applying it globally will break forms intended for client-side submission that never receive a `action` prop.
   * - `defaults.formProvider: true` injects `<FormProvider>` into every form; forms that do not use `useFormContext()` carry a needless render overhead, and the extra provider can mask missing explicit `form` prop wiring elsewhere in the tree.
   * - `defaults.optimization.level` is a codegen-time setting, not a runtime one — changing it has no effect on already-generated files or on `<ZodForm>` runtime rendering; you must re-run codegen for it to take effect.
   * - A high `optimization.level` (e.g. `3`) applied globally may eliminate inline validators that certain schemas rely on for conditional field visibility; override per-schema in `schemas[K].optimization` for any schema that uses dynamic refinements.
   * - Every key in `defaults` is a lowest-priority fallback; a per-schema override always wins — but if you later remove a per-schema override expecting `defaults` to take effect, verify that `defaults` was actually set, because an absent `defaults` key silently falls back to the built-in hardcoded default rather than erroring.
   * @useWhen Set `defaults` when multiple schemas in the config share the same generation settings — use it to avoid repeating `mode`, `ui`, `out`, `overwrite`, `serverAction`, `formProvider`, or `optimization` on every `schemas[key]` entry. For example, if every schema targets the same output directory with the same UI library, set those once in `defaults` rather than per-schema. Leave `defaults` unset (or set only the properties you actually want shared) when schemas have meaningfully different output targets or modes, since a value in `defaults` silently applies to every auto-discovered schema that does not override it. Per-`schemas[key]` values always win over `defaults`, so the safe strategy is to put the most permissive or most common settings here and override the exceptions per schema.
   * @avoidWhen Leave `defaults` unset when every schema in `schemas` has distinct settings — a `defaults` block that is fully overridden for every entry adds boilerplate without reducing repetition. Avoid setting `defaults.out` globally when your schemas target different output directories; every `schemas` entry must then explicitly re-specify `out`, and any new entry that forgets the override silently lands files in the shared fallback directory. Avoid `defaults.overwrite: true` globally in projects where generated files are manually edited after generation — it discards those edits without warning on the next run. Avoid `defaults.serverAction: true` globally when only a subset of schemas are used in Server Action contexts; the flag bleeds into client-only form schemas that should not carry server-action wiring.
   */
  defaults?: ConfigDefaults;
  /**
   * @pitfalls - **Exact strings, not glob patterns** — `types: ['*Schema']` matches the literal string `'*Schema'`, not any export ending in `Schema`; for pattern-based selection use `include` instead.
   * - **Case-sensitive** — `types: ['userSchema']` silently skips an export named `UserSchema`; the comparison is byte-for-byte against the exported name.
   * - **Silent miss on typo** — If a listed name does not exist in the schema file the CLI emits nothing and no error; always cross-check names against the file's actual export list.
   * - **Does not configure the schema** — Adding a name here only marks it for processing; it does not set field overrides, mode, or output path. For per-schema behaviour use `schemas[key]`.
   * - **No deduplication warning** — Listing the same name twice is silently accepted and may cause double-generation in pipelines that don't deduplicate.
   * @useWhen Use `types` when you have a **small, known, stable set of schema export names** and want to pin the exact exports to process — e.g. `types: ['LoginSchema', 'RegisterSchema']` on a schema file that exports several schemas but only two should produce forms. Prefer it over `include` when names don't share a useful prefix/suffix pattern and you want to enumerate them explicitly. Set it to the shortest list that covers all schemas you need; there is no need to set both `types` and `include` for the same names.
   * @avoidWhen Avoid `types` when the set of export names is large, frequently renamed, or follows a consistent naming pattern — in those cases `include` with a glob (e.g. `['*Schema']`) is less brittle and does not require updating a hand-maintained list on every rename. Avoid it when you need wildcard or suffix matching; `types` compares exact strings only and a glob like `'*Schema'` will match nothing except the literal four-character-plus-asterisk string. Avoid setting both `types` and `include` for the same names — they are redundant and the interaction can be confusing. Leave `types` unset when you want all exported Zod schemas processed (omit both `types` and `include`), or when auto-discovery via `include` patterns covers your selection cleanly.
   */
  types?: string[];
  /**
   * @pitfalls - An empty array `[]` is not the same as omitting the option — `include: []` matches no export names and silently produces zero generated forms; omit the property entirely to include all exports.
   * - Patterns match schema export names (e.g., `UserSchema`), not file system paths — glob syntax like `src/**\/*.ts` will never match anything because the filter operates on the exported symbol name, not the source file location.
   * - Matching is case-sensitive — `include: ['*schema']` will not match `UserSchema`; use `*Schema` to match PascalCase suffixes.
   * - `exclude` always wins when a name matches both lists — a schema whose export name satisfies an `include` pattern and an `exclude` pattern will be excluded, not included; there is no way to "protect" an included name from a broad `exclude` glob.
   * - Schemas listed explicitly under `schemas:` are not automatically exempt from `include`/`exclude` filtering — if `include` is set and a named `schemas` entry does not match any pattern, it may still be skipped; always ensure `include` patterns cover every key you declare in `schemas`.
   * @useWhen Set `include` when your schema file exports more Zod schemas than you want to generate forms for and you want to opt-in by glob pattern rather than by exact name — for example, `include: ['*Schema', '*Form']` to generate only exports whose names end with those suffixes.
   *
   * Prefer `include` over `types` when you need glob/wildcard matching; use `types` instead when you have a small, fixed list of exact export names.
   *
   * Leave `include` unset (omit the property entirely) to generate forms for every discovered Zod export — this is the right default for a schema file that is entirely dedicated to form schemas.
   *
   * Avoid setting it to `[]`; an empty array silently produces zero output because no name matches any pattern.
   * @avoidWhen Avoid setting `include` when your schema file is entirely dedicated to form schemas and every export should produce a form — omitting it is the correct default and generates forms for all discovered Zod exports without risk of accidentally filtering something out.
   *
   * Avoid it when you already have a short, explicit list of export names: use `types` instead, which is exact-match and eliminates glob edge cases entirely.
   *
   * Avoid setting `include: []`; an empty array silently produces zero generated forms — it matches nothing and emits no warning.
   *
   * Avoid combining `include` with broad `exclude` patterns that overlap: `exclude` always wins over `include` when both match the same name, making the `include` entry a no-op for that name.
   *
   * Avoid using `include` if you also declare entries under `schemas:` but don't add those exact keys to at least one `include` pattern — `schemas`-keyed entries are not exempt from `include` filtering and may be silently skipped.
   */
  include?: string[];
  /**
   * @pitfalls - Patterns match schema **export names**, not file paths — using path separators (`/`, `**`) in entries will never match anything and silently has no effect.
   * - Glob patterns are **case-sensitive**: `'internal*'` will not suppress `'InternalPayload'`; you must match the exact casing of the export.
   * - An overly broad entry like `'*Schema'` or `'*'` suppresses every **auto-discovered** export, resulting in a silent no-op codegen run with zero auto-generated outputs. However, schemas explicitly keyed under `schemas:` are unaffected — `exclude` only filters auto-discovery; `schemas:` entries are always processed regardless of any matching `exclude` pattern.
   * - Setting `exclude: []` (empty array) is functionally identical to omitting the field — it does not override or clear any exclude patterns inherited from a parent config layer.
   * - When both `include` and `exclude` are set, a schema matching **both** lists may produce surprising results depending on evaluation order; avoid overlapping the two lists — use one or the other, not both, for the same name space.
   * @useWhen Set `exclude` when your schema file exports internal, utility, or test schemas that should not produce generated form components — for example, `exclude: ['*Internal*', 'BaseSchema', 'TestFixture*']` suppresses matching export names while leaving everything else for auto-discovery. Also use it when you add a new export to a file and want to opt it out without touching `schemas:` entries. Leave `exclude` unset (or use `include` instead) when you have only a handful of schemas to process — it is easier to allowlist with `include` than to chase a growing denylist. Avoid pairing broad patterns like `'*'` with `exclude` unless you have explicit `schemas:` entries for everything you want generated, because `exclude` only skips auto-discovery and cannot suppress a `schemas:`-keyed entry.
   * @avoidWhen Leave `exclude` unset when every auto-discovered export in the target files should generate a form — adding an empty or unnecessary denylist forces ongoing maintenance as schemas are added. Avoid `exclude` when you have only a small, well-known set of schemas to process; use `include` for an allowlist instead, because chasing a growing denylist with `exclude` is harder to keep correct. Do not use `exclude` as a substitute for removing or refactoring schemas you intend to delete — it silently masks exports that will still be compiled and imported. Avoid setting `exclude` alongside `include` patterns that overlap the same names; `exclude` always wins over `include`, turning those `include` entries into a no-op. Do not rely on `exclude` to suppress a schema you have also declared under `schemas:` — `exclude` only filters auto-discovery, so explicitly keyed `schemas:` entries are always processed regardless of any matching `exclude` pattern.
   */
  exclude?: string[];
  /**
   * @pitfalls - Keys are **untyped strings** — unlike `schemas.[key].fields`, there is no dot-path type checking; a typo (e.g., `"emailAdress"` instead of `"emailAddress"`) silently does nothing at both compile time and runtime
   * - Applies **across every schema** — a key like `"name"` will override the `name` field in every schema that has one; isolate schema-specific overrides under `schemas.[key].fields` instead to avoid unintended collisions
   * - **`props` is not deep-merged** — the shallow merge in `resolveFieldConfig` (`{ ...globalField, ...schemaField }`) replaces the entire `props` object when a per-schema entry exists for the same key; any prop set only in the global entry is silently dropped if the schema entry also defines `props`
   * - Array item paths require **`[]` syntax** (e.g., `items[].title`), not numeric indices; a numeric path like `items.0.title` will not match and is silently ignored
   * - **Renaming a schema field breaks coverage silently** — because keys are plain strings, TypeScript cannot catch staleness when a Zod object property is renamed; the stale config key becomes an unreferenced no-op with no warning
   * - Per-schema entries always win, so a global entry **cannot be partially extended** at the schema level; if you need to add one prop while keeping global defaults, you must repeat all props in the schema-level entry
   * @useWhen Set `fields` when the same field name (e.g. `email`, `phone`, `createdAt`) appears in multiple schemas and you want to apply the same component or props override everywhere that name occurs — for example, `fields: { email: { component: 'EmailInput' }, phone: { component: 'PhoneField', props: { format: 'national' } } }`. This is the right level for project-wide naming conventions that span many schemas. Leave `fields` unset (and use `schemas.[key].fields` instead) when the override is relevant to only one schema, or when the field name is unique — the per-schema location provides dot-path type-checking that this global map cannot offer, so prefer it whenever the override is not genuinely cross-schema.
   * @avoidWhen Avoid `fields` when the override applies to only one schema — use `schemas.[key].fields` there instead, which provides dot-path type-checking that this global map cannot offer. Avoid it when the field name is common (e.g. `name`, `id`) but you only want the override applied selectively — every schema that has a matching key will receive it, with no way to opt specific schemas out. Avoid it when you need to extend a global entry at the schema level by adding one prop while inheriting others — per-schema `fields` entries replace the global entry wholesale, so you must repeat all props; the merge is not additive at the `props` level. Avoid it when you need typed dot-path keys for nested fields (e.g. `address.street`) — keys here are always `string`, so a typo silently does nothing and TypeScript cannot catch schema renames.
   */
  fields?: Record<string, TypedFieldConfig<TComponents>>;
  /**
   * @pitfalls - **Field path type-checking is opt-in** — `fields` keys are only typed as `SchemaFieldPath<TSchemas[K]>` when the `TSchemas` type parameter is bound (e.g. via `defineConfig<TComponents, typeof schemaModule>()`). Without it, keys fall back to `string` and typos in field paths silently do nothing.
   * - **`component` follows schema object identity, not usage location** — setting `schemas.AddressSchema.component` causes every parent schema that re-uses the *same exported object* as a nested subschema to also render with that component, not just the root codegen target; do not set `component` on widely-shared subschemas unless that renderer is correct in all nesting contexts.
   * - **`name`, `mode`, `out`, and `serverAction` are root-only** — these properties have no effect when the schema appears as a subschema inside another schema; they only apply when the schema is the top-level codegen target.
   * - **`out` on a per-schema entry does not override `defaults.out` for other schemas** — it is a one-off path for that single key; setting it to a directory shared with other schemas can still produce filename collisions if two schema names resolve to the same base filename.
   * - **`include` vs `exclude` asymmetry** — `exclude` patterns do NOT suppress entries explicitly declared under `schemas:`; they are always processed. However, an active `include` filter still applies — a `schemas` key whose export name does not match any `include` pattern may be skipped. Always add every `schemas` key to your `include` patterns when both are set.
   * - **A key for a non-existent schema export is silently ignored** — declaring `schemas: { GhostSchema: { ... } }` when `GhostSchema` is not exported from the schema file produces no error and no output; cross-check every key against the file's actual exports.
   * - **`fields` merge inside a schema entry is shallow** — the `props` object on a per-schema field entry replaces the global `fields` entry's `props` wholesale; any prop set only at the global level is silently dropped if the same key also carries a `props` object here. Repeat all necessary props at the schema level.
   * - **Keys not in `TSchemas` are invisible to TypeScript but accepted at runtime** — a key that does not exist in the `TSchemas` map cannot be type-checked and the entry is accepted silently; validate the config file with `validateConfig()` if loading it at runtime to catch structural errors early.
   * @useWhen Set `schemas` when you need per-schema overrides that must not bleed into other schemas — for example, a custom `out` path for one output file, a different `component` renderer for one root schema, or `fields` label/prop tweaks for a field name that exists in multiple schemas but should only be styled differently in this one. Set a key only for schemas that genuinely diverge from the global `fields`/`defaults` baseline; omit keys where the defaults are correct. Leave `schemas` entirely unset when `fields` and `defaults` cover all schemas uniformly — adding empty per-schema entries is noise. Avoid adding a key solely to repeat what global config already provides; the merge is additive and per-schema values always win, so an unnecessary entry silently prevents the global value from ever applying.
   * @avoidWhen Avoid setting a `schemas` entry for a schema whose generation can be fully described by the global `fields` and `defaults` — per-schema entries always win over globals, so an entry that merely repeats the same values silently blocks global config from ever applying to that schema. Do not add empty or near-empty entries just to document that a schema exists; they are noise with no effect. Avoid using `schemas` as your primary way to list which schemas to process — that is the job of `include` or `types`; an entry here does not make a schema immune from `include` filtering, so a key whose export name fails an active `include` pattern is still silently skipped. Do not set `name`, `mode`, `out`, or `serverAction` on a schema that is only ever consumed as a nested subschema inside another object schema — those root-only properties have no effect at nested positions. Avoid adding a key for a schema that is not exported from the source file; the entry is accepted without error but produces no output and emits no warning. Avoid setting `fields` on a schema entry if the same override already lives in the top-level `fields` map and no schema-specific divergence is needed — the global `fields` entry is sufficient, and duplicating it at the schema level means any future global change will silently not reach that schema.
   */
  schemas?: {
    [K in keyof TSchemas & string]?: ZodTypeConfig<
      TSchemas[K] extends $ZodType ? SchemaFieldPath<TSchemas[K]> : string,
      TComponents
    >;
  };
};

// ─── Utility Types ───────────────────────────────────────────────────

/**
 * Strips index signatures from a type, keeping only explicitly declared keys.
 * Useful for Zod's `z.output<>` which adds `[x: string]: unknown` index signatures.
 */
export type StripIndexSignature<T> = T extends readonly (infer U)[]
  ? StripIndexSignature<U>[]
  : T extends object
    ? {
        [K in keyof T as string extends K
          ? never
          : number extends K
            ? never
            : symbol extends K
              ? never
              : K]: StripIndexSignature<T[K]>;
      }
    : T;

// ─── Path Utilities ──────────────────────────────────────────────────

type Primitive = string | number | boolean | bigint | symbol | null | undefined | Date;

type DotPath<T> = T extends Primitive
  ? never
  : T extends readonly (infer TItem)[]
    ? `${number}` | `${number}.${DotPath<TItem>}`
    : {
        [TKey in Extract<keyof T, string>]: T[TKey] extends Primitive
          ? TKey
          : TKey | `${TKey}.${DotPath<T[TKey]>}`;
      }[Extract<keyof T, string>];

type NormalizeArrayPath<TPath extends string> =
  TPath extends `${infer Prefix}.${number}.${infer Suffix}`
    ? NormalizeArrayPath<`${Prefix}[].${Suffix}`>
    : TPath extends `${infer Prefix}.${number}`
      ? NormalizeArrayPath<`${Prefix}[]`>
      : TPath;

type FieldPath<TValues extends Record<string, unknown>> =
  DotPath<TValues> extends infer TPath
    ? TPath extends string
      ? TPath | NormalizeArrayPath<TPath>
      : never
    : never;

/** Extracts dot-notation field paths from a Zod schema's inferred type */
type SchemaFieldPath<T extends $ZodType> =
  z.infer<T> extends infer O ? (O extends Record<string, unknown> ? FieldPath<O> : string) : string;

// ─── Validation Schemas ───────────────────────────────────────────────

const nonEmptyStringSchema = z.string().trim().min(1);

const componentOverrideSchema = z
  .object({
    controlled: z.boolean().optional(),
    props: z.record(z.string(), z.unknown()).optional()
  })
  .loose();

const componentsConfigSchema = z
  .object({
    source: nonEmptyStringSchema,
    preset: z.enum(['shadcn', 'html']).optional(),
    fieldTemplate: nonEmptyStringSchema.optional(),
    overrides: z.record(z.string(), componentOverrideSchema).optional()
  })
  .loose();

const fieldConfigSchema = z
  .object({
    component: nonEmptyStringSchema.optional(),
    order: z.number().optional(),
    hidden: z.boolean().optional(),
    disabled: z.boolean().optional(),
    props: z.record(z.string(), z.unknown()).optional(),
    section: z.string().optional(),
    helpText: z.string().optional()
  })
  .loose();

const fieldOverrideSchema = z
  .object({
    component: nonEmptyStringSchema,
    props: z.record(z.string(), z.unknown()).optional()
  })
  .loose();

const optimizationConfigSchema = z
  .object({
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional()
  })
  .loose()
  .optional();

const defaultsSchema = z
  .object({
    mode: z.string().optional(),
    ui: z.string().optional(),
    out: z.string().optional(),
    overwrite: z.boolean().optional(),
    serverAction: z.boolean().optional(),
    formProvider: z.boolean().optional(),
    optimization: optimizationConfigSchema
  })
  .loose()
  .optional();

const zodTypeConfigSchema = z
  .object({
    name: z.string().optional(),
    component: z.string().optional(),
    mode: z.string().optional(),
    out: z.string().optional(),
    serverAction: z.boolean().optional(),
    fields: z.record(z.string(), fieldConfigSchema).optional()
  })
  .loose();

const configSchema = z
  .object({
    components: componentsConfigSchema,
    overwrite: z.boolean().optional(),
    include: z.array(z.string()).optional(),
    exclude: z.array(z.string()).optional(),
    types: z.array(z.string()).optional(),
    fields: z.record(z.string(), fieldOverrideSchema.or(fieldConfigSchema)).optional(),
    defaults: defaultsSchema,
    schemas: z.record(z.string(), zodTypeConfigSchema).optional()
  })
  .loose();

// ─── Error Formatting ─────────────────────────────────────────────────

function formatValidationError(error: z.ZodError, source: string): Error {
  const issue = error.issues[0];
  if (!issue) {
    return new Error(`${source} is invalid.`);
  }
  const path = issue.path.map((part) => String(part));
  const [root, entry, property] = path;

  if (!root) {
    return new Error(`${source} must be an object.`);
  }

  if (root === 'components') {
    if (!entry) {
      return new Error(`${source}.components must be an object.`);
    }

    if (entry === 'source') {
      return new Error(`${source}.components.source must be a non-empty string.`);
    }

    if (entry === 'overrides') {
      if (!property) {
        return new Error(`${source}.components.overrides must be an object when provided.`);
      }
      return new Error(`${source}.components.overrides.${property} must be an object.`);
    }

    return new Error(`${source}.components.${entry} is invalid.`);
  }

  if (root === 'fields') {
    if (!entry) {
      return new Error(`${source}.fields must be an object when provided.`);
    }

    if (!property) {
      return new Error(`${source}.fields.${entry} must be an object.`);
    }

    if (property === 'component') {
      return new Error(`${source}.fields.${entry}.component must be a non-empty string.`);
    }

    if (property === 'props') {
      return new Error(`${source}.fields.${entry}.props must be an object when provided.`);
    }

    return new Error(`${source}.fields.${entry} must be an object.`);
  }

  if (root === 'defaults') {
    if (!entry) {
      return new Error(`${source}.defaults must be an object when provided.`);
    }

    return new Error(`${source}.defaults.${entry} is invalid.`);
  }

  if (root === 'schemas') {
    if (!entry) {
      return new Error(`${source}.schemas must be an object when provided.`);
    }

    if (!property) {
      return new Error(`${source}.schemas.${entry} must be an object.`);
    }

    if (property === 'fields') {
      const fieldName = path[3];
      const fieldProp = path[4];
      if (fieldName && fieldProp) {
        return new Error(`${source}.schemas.${entry}.fields.${fieldName}.${fieldProp} is invalid.`);
      }
      if (fieldName) {
        return new Error(`${source}.schemas.${entry}.fields.${fieldName} must be an object.`);
      }
      return new Error(`${source}.schemas.${entry}.fields must be an object when provided.`);
    }

    return new Error(`${source}.schemas.${entry}.${property} is invalid.`);
  }

  if (root === 'overwrite') {
    return new Error(`${source}.overwrite must be a boolean when provided.`);
  }

  if (root === 'types') {
    return new Error(`${source}.types must be an array of strings when provided.`);
  }

  if (root === 'include') {
    return new Error(`${source}.include must be an array of strings when provided.`);
  }

  if (root === 'exclude') {
    return new Error(`${source}.exclude must be an array of strings when provided.`);
  }

  return new Error(`${source} is invalid: ${issue.message}`);
}

// ─── Field Expression Allowlist ──────────────────────────────────────

/**
 * Known RHF field expression strings recognized in component props config.
 * When a prop value matches one of these strings, codegen emits it as a JSX
 * expression (`{field.value}`) rather than a literal string.
 *
 * @category Configuration
 */
export const RHF_FIELD_EXPRESSIONS: ReadonlySet<string> = new Set([
  'field.value',
  'field.onChange',
  'field.onBlur',
  'field.ref',
  'field.name',
  // boolean coercion: guards undefined→false for controlled checkbox/switch
  '!!field.value'
]);

// ─── Preset Override Maps ─────────────────────────────────────────────

/** shadcn preset — Radix-based components need controlled mode + field expression props */
export const SHADCN_OVERRIDES: Record<string, ComponentOverride> = {
  Select: {
    controlled: true,
    props: { onValueChange: 'field.onChange' }
  },
  Checkbox: {
    controlled: true,
    props: { checked: 'field.value', onCheckedChange: 'field.onChange' }
  },
  Switch: {
    controlled: true,
    props: { checked: 'field.value', onCheckedChange: 'field.onChange' }
  }
};

/** Default HTML preset — no controlled components by default */
export const DEFAULT_OVERRIDES: Record<string, ComponentOverride> = {};

// ─── Public Functions ─────────────────────────────────────────────────

const PRESET_MAP: Record<ComponentPreset, Record<string, ComponentOverride>> = {
  shadcn: SHADCN_OVERRIDES,
  html: DEFAULT_OVERRIDES
};

/**
 * Identity helper that returns its argument typed as `ZodFormsConfig`.
 *
 * Merges preset component overrides (e.g. shadcn) into `config.components.overrides`
 * so that user-supplied overrides layer on top of the preset defaults. Use this in
 * your `z2f.config.ts` to get full TypeScript inference and IDE autocompletion.
 *
 * @remarks
 * Identity helper that returns its argument typed as ZodFormsConfig.
 * Applies preset component overrides (e.g., shadcn) — preset defaults
 * merge with user overrides, user wins on conflicts. However, the props
 * dict is replaced entirely, not merged.
 *
 * @param config - The raw configuration object.
 * @returns The same configuration with preset overrides applied.
 *
 * @useWhen
 * - You want TypeScript inference and IDE autocompletion for config — `defineConfig` is the typed entry point; bare object literals lose generic inference on `components.overrides`
 *
 * @avoidWhen
 * - Runtime-only usage where you pass config inline to walkSchema — `defineConfig` is a no-op at runtime without a preset; skip it when config comes from JSON or dynamic import
 *
 * @never
 * - NEVER assume preset props merge with your props — the entire props dict is replaced. If you set component props, you must include ALL props including the ones from the preset
 *
 * @example
 * ```ts
 * export default defineConfig({
 *   components: { source: '@/components/ui', preset: 'shadcn' },
 * });
 * ```
 *
 * @category Configuration
 */
export function defineConfig<
  TComponents extends Record<string, unknown> = Record<string, unknown>,
  TSchemas extends Record<string, unknown> = Record<string, unknown>
>(config: ZodFormsConfig<TComponents, TSchemas>): ZodFormsConfig<TComponents, TSchemas> {
  const preset = config.components.preset;
  if (!preset) {
    return config;
  }

  const base = PRESET_MAP[preset];
  return {
    ...config,
    components: {
      ...config.components,
      overrides: { ...base, ...config.components.overrides } as typeof config.components.overrides
    }
  };
}

/**
 * Validates an unknown value as a `ZodFormsConfig` at runtime.
 *
 * Parses `value` using the internal Zod config schema and throws a descriptive
 * error if validation fails. Use this when loading config from untrusted sources
 * such as JSON files or dynamic `import()` calls.
 *
 * @param value - The value to validate.
 * @param source - Human-readable label for error messages (defaults to `'config'`).
 * @returns The validated configuration cast to `ZodFormsConfig`.
 * @throws If `value` does not conform to the config schema.
 *
 * @useWhen
 * - Loading config from JSON files or dynamic import() where the type is `unknown` — validates and narrows to `ZodFormsConfig`
 *
 * @avoidWhen
 * - Using TypeScript with defineConfig() — type errors catch most issues at dev time; validateConfig is only needed when the config source is not type-checkable
 *
 * @never
 * - NEVER use as a type guard — it throws on invalid input, doesn't narrow; FIX: wrap in try/catch and branch on success, or check keys manually before calling
 * - NEVER assume extra keys cause failures — the schema uses z.object().loose(), so unrecognized keys are silently dropped not rejected; FIX: if you need strict key validation, inspect the returned config for unexpected fields manually
 *
 * @category Configuration
 */
export function validateConfig(
  value: unknown,
  source = 'config'
): ZodFormsConfig<Record<string, unknown>> {
  const parsed = configSchema.safeParse(value);
  if (!parsed.success) {
    throw formatValidationError(parsed.error, source);
  }

  return parsed.data as ZodFormsConfig<Record<string, unknown>>;
}

/**
 * Merge global field config with per-schema field config overrides.
 * Per-schema entries shallow-merge on top of global entries for the same key.
 * Returns an empty record when both inputs are undefined.
 *
 * @param globalFields - Global field overrides from `ZodFormsConfig.fields`.
 * @param schemaFields - Per-schema field overrides from `ZodFormsConfig.schemas[key].fields`.
 * @returns Merged field config map where schema-level overrides win on conflict.
 *
 * @category Configuration
 */
export function resolveFieldConfig(
  globalFields: Record<string, FieldConfig> | undefined,
  schemaFields: Partial<Record<string, FieldConfig>> | undefined
): Record<string, FieldConfig> {
  if (!globalFields && !schemaFields) {
    return {};
  }

  if (!globalFields) {
    return { ...schemaFields } as Record<string, FieldConfig>;
  }

  if (!schemaFields) {
    return { ...globalFields };
  }

  const merged: Record<string, FieldConfig> = { ...globalFields };
  for (const [key, schemaField] of Object.entries(schemaFields)) {
    if (!schemaField) {
      continue;
    }
    const globalField = merged[key];
    if (globalField) {
      merged[key] = { ...globalField, ...schemaField };
    } else {
      merged[key] = schemaField;
    }
  }

  return merged;
}

/**
 * Normalize a validated config by migrating deprecated top-level fields to their canonical locations.
 * Currently handles the legacy top-level `overwrite` key — moves it into `defaults.overwrite`
 * so the rest of the pipeline can assume the normalized shape.
 *
 * @param config - A fully validated `ZodFormsConfig` (output of `validateConfig`).
 * @returns The same config with any deprecated top-level fields migrated into `defaults`.
 *
 * @category Configuration
 */
export function normalizeConfig(
  config: ZodFormsConfig<Record<string, unknown>>
): ZodFormsConfig<Record<string, unknown>> {
  const hasTopLevelOverwrite = 'overwrite' in config && config.overwrite !== undefined;

  if (!hasTopLevelOverwrite) {
    return config;
  }

  const { overwrite, ...rest } = config as ZodFormsConfig<Record<string, unknown>> & {
    overwrite?: boolean;
  };
  return {
    ...rest,
    defaults: {
      ...rest.defaults,
      overwrite: rest.defaults?.overwrite ?? overwrite
    }
  };
}
