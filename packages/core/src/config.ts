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
   * @pitfalls - `components.source` is emitted verbatim as the import specifier in every generated `.tsx` file — a path alias that resolves in the config file (e.g. `@/components/ui` via tsconfig `paths`) may not resolve in the generated file's output directory if the alias is not project-wide; the error surfaces as a TypeScript compile error in the generated file, not during codegen.
   * - `components.overrides` keys must exactly match the exported name of the component from `source`; a misspelled key (e.g. `"DateInput"` instead of `"DatePicker"`) is silently ignored and the default component is used — no warning is emitted by `validateConfig` or the codegen pipeline.
   * - When you supply `overrides[x].props` for a component that `preset` already covers, review the generated output to confirm the props you expect are present — the codegen pipeline processes your override's `props` object but the boundary between a preset's contributed props and your override is not validated at config time; any RHF field-expression props (e.g. `onChange: '$$rhf.onChange'`) not included in your `props` object may be absent from the generated component.
   * - `components` is the only **required** key in `ZodFormsConfig`; omitting it or setting it to a non-object causes `validateConfig` to throw synchronously with `components must be an object`.
   * @useWhen Set `components.source` to your UI library's import specifier (e.g. `"@/components/ui"`, `"my-lib/forms"`) whenever the generated `.tsx` files must import components from a custom module — the string is emitted verbatim as the import path in every generated file, so set it to the path that resolves correctly from the generated file's output directory.
   *
   * Set `components.preset` to `'shadcn'` when your library exports Radix-based controlled components and you want the full shadcn field template (Field/FieldLabel/FieldError wrappers); set it to `'html'` when you want plain `<input>`/`<select>` elements with no external dependency. Omit `preset` only when you are supplying a fully custom `fieldTemplate` and `overrides` that cover every component type the schema walker can emit.
   *
   * Populate `components.overrides` only for the specific component names that need non-default wiring — add `controlled: true` for any component that requires `useController` instead of `register()`, and supply `props` only when a component needs static default props beyond what the preset provides. Keys that are absent from `overrides` silently inherit the preset's behavior, so no entry is needed for components that already behave correctly under the active preset.
   *
   * Set `components.fieldTemplate` when the label/input/description/error composition in the preset's default template does not match your design system — supply the import path to your wrapper component so codegen emits it in place of the preset's `<Field>` wrapper.
   * @avoidWhen - Do not set `preset: 'shadcn'` when the Radix-backed components it specifically configures — Checkbox, Switch, and DatePicker — cannot use `useController` in your setup; those three entries in the shadcn preset are marked `controlled: true`, so the generated code will wire them with `useController` rather than `register()` and produce incorrect output if your versions of those components expect uncontrolled inputs.
   * - Do not populate `overrides` for every component in the library — entries are only needed for components that deviate from the active preset's defaults; absent keys silently inherit preset behavior, so exhaustive entries add maintenance cost with no effect.
   * - Do not set `fieldTemplate` when the preset's default field wrapper already matches your design system — `fieldTemplate` is an import path that replaces the entire field wrapper component, so setting it unnecessarily swaps out the preset's wrapper for one that may duplicate or conflict with existing behavior.
   */
  components: ComponentsConfig<TComponents>;
  /**
   * @pitfalls - Providing a partial `defaults` object does not disable fallbacks for omitted keys — each sub-key resolves independently via its own fallback chain (`cli flag → schemas.[export].* → defaults.* → hardcoded value`); setting `defaults: { ui: 'html' }` still lets every other sub-key fall through to its coded default.
   * - Setting `defaults: {}` is functionally identical to omitting `defaults` entirely — no sub-key is activated and every sub-key still resolves to its hardcoded fallback; prefer omitting `defaults` outright when you have nothing to set to keep the config intent clear.
   * - There is no per-schema opt-out for `overwrite`: the resolution chain is `componentConfig.defaults?.overwrite ?? false` with no `schemaConfig?.overwrite` step (unlike `mode`, `out`, `serverAction`, and `ui`, which each check the per-schema block first); once `defaults.overwrite: true` is set, it applies to every generated file with no escape hatch at the schema level.
   * @useWhen Set `defaults` when generating more than one schema in a single config run and most schemas share the same `out`, `ui`, `mode`, `overwrite`, `serverAction`, or `optimization` settings — placing shared values here avoids repeating them inside every `schemas.*` entry. Set `defaults.overwrite: true` when running in CI or watch mode so every generation pass writes fresh output instead of silently skipping existing files (the hardcoded fallback is `false`). Set `defaults.ui: 'html'` when your project does not use shadcn (the hardcoded fallback is `'shadcn'`). Set `defaults.serverAction: true` when every schema in the run should emit a Next.js server action alongside its form component. Set `defaults.optimization` when you want schema-lite output for every schema globally. Leave `defaults` unset — or leave individual sub-keys unset — when the equivalent CLI flag covers the same setting for a one-off run, or when per-schema `schemas.*` values differ enough that a global default would need to be overridden for most schemas anyway.
   * @avoidWhen Leave `defaults` unset when every built-in fallback already matches your project — `mode` defaults to `'submit'`, `ui` to `'shadcn'`, `overwrite` to `false`, and `serverAction` to `false` — so setting `defaults` only to re-assert those values adds noise without effect. Avoid `defaults.overwrite: true` when any generated file should be protected: unlike `mode`, `out`, and `serverAction` (each checked at the per-schema `schemas[K]` level before `defaults`), `overwrite` has no per-schema escape hatch — the resolution is `componentConfig.defaults?.overwrite ?? false` with no `schemaConfig?.overwrite` step, so `defaults.overwrite: true` unconditionally overwrites every file. Avoid setting `defaults.mode`, `defaults.out`, or `defaults.serverAction` when your schemas require different values from one another; set those per schema in `schemas[K]` instead and omit `defaults` entirely. Avoid setting `defaults.ui` expecting to vary it per schema — `ui` is resolved as `options.ui ?? componentConfig.defaults?.ui ?? 'shadcn'` with no `schemaConfig?.ui` step, making it a global setting with no per-schema escape hatch; `defaults.ui` is only useful when every schema in the project should use the same non-default UI preset.
   */
  defaults?: ConfigDefaults;
  /**
   * @pitfalls - When `types` is non-empty, `include` and `exclude` are silently skipped — the CLI never calls `applyExportFilters`; setting all three gives the false impression that `exclude` still filters out unwanted exports.
   * - An empty array (`[]`) is treated identically to omitting `types` — the condition `config.types && config.types.length > 0` is falsy for `[]`, so the CLI falls through to `include`/`exclude` filtering; an empty array is not "process nothing", it is "process everything (filtered by include/exclude)".
   * - Entries in `types` are used as verbatim export names, not glob patterns — unlike `include` and `exclude`, which support `*` wildcards via `wildcardPatternToRegExp`; a pattern like `"*Schema"` in `types` will not match any export and will throw at generation time.
   * - A name listed in `types` that is missing from the schema file throws at generation time (`Export "${exportName}" was not found`), not at config-load time — the error surfaces per-export during the generation loop, so other exports in the list may have already written files before the error is raised.
   * - The CLI `--export` flag overrides `types` entirely; if a caller passes `--export` on the command line, the `types` array is never consulted.
   * @useWhen Set `types` to an explicit, exhaustive list of schema export names (exact strings, not glob patterns) when you know precisely which exports to generate and want a fixed, deterministic set — e.g. `types: ['UserSchema', 'AddressSchema']`. A non-empty `types` array completely bypasses `include` and `exclude` pattern filtering; leave `types` unset (or set it to `[]`) if you want `include`/`exclude` glob patterns to control selection instead. Do not mix the two mechanisms: once `types` is non-empty the `include`/`exclude` arrays are dead code for that config invocation.
   * @avoidWhen When `include` or `exclude` are also set — a non-empty `types` array takes priority in the CLI pipeline and the `include`/`exclude` patterns are silently skipped; set only one selection mechanism. When you need glob-style pattern matching to pick exports (e.g. `*Schema`) — use `include`/`exclude` instead; `types` accepts only exact export names and has no wildcard expansion. When you need per-schema settings such as `mode`, `out`, or `serverAction` — use `schemas` keyed by export name; `types` only controls which exports are selected, not how they are generated. When a single export is targeted interactively — pass `--export` on the CLI instead; listing it in `types` couples the config file to a one-off invocation.
   */
  types?: string[];
  /**
   * @pitfalls - **Silently ignored when `--export` is passed on the CLI** — the generate action checks `commandOptions.export` first; if it is set, `include` is never consulted and all patterns are skipped without warning.
   * - **Silently ignored when `config.types` is non-empty** — the priority order is `--export` > `config.types` > `applyExportFilters(include, exclude)`; placing patterns in both `types` and `include` causes `include` to be a dead letter with no error.
   * - **Empty array `[]` is equivalent to omitting the field** — `matchesAnyPattern` returns `true` for all exports when the array is empty, so `include: []` does not restrict code generation to zero exports; it generates everything.
   * - **Only `*` is a wildcard; `?` is a literal** — `wildcardPatternToRegExp` escapes `?` before expanding `*` to `.*`, so `"User?"` matches the seven-character string `"User?"` rather than any single-suffix variant like `"UserA"`.
   * - **Patterns are fully anchored** — each pattern compiles to `^…$`, so `"User*"` matches `"UserSchema"` but not `"GetUserSchema"`; the prefix must start at character 0 of the export name.
   * - **Matches export identifier names only** — `include` filters the string array returned by `resolveSchemaExportNames` (the JS export names in a schema file); it has no effect on file paths, type names, or module specifiers.
   * @useWhen Set `include` to a `string[]` of wildcard patterns (e.g. `["*Schema", "User*"]`) when you want the CLI to process only a named subset of a schema file's exports without enumerating every export name explicitly in `types`. When `include` is an empty array or omitted, `matchesAnyPattern` treats every export as included (no filtering occurs). Use `include` together with `exclude` to first narrow the set in, then trim specific names out. Only set `include` when neither `--export` (CLI flag) nor `config.types` is provided — those two options take precedence and `include`/`exclude` are never consulted when either is present.
   * @avoidWhen When `--export` is passed on the CLI or `config.types` is non-empty — the code skips `applyExportFilters` entirely in both cases, so `include` is silently ignored. When you want all exports from the schema file — omitting `include` (or setting it to `[]`) already passes every export through, because `matchesAnyPattern` returns `true` when the patterns array is empty or absent. When you only need to exclude a handful of names — set `exclude` alone and leave `include` unset; combining both adds no benefit and makes intent less clear. When you want one specific export — use `config.types` or `--export` instead; those are explicit and order-preserving, whereas `include` depends on the order that `resolveSchemaExportNames` returns names.
   */
  include?: string[];
  /**
   * @pitfalls - `exclude` is silently ignored when `--export` is passed on the CLI or `config.types` is non-empty — both paths bypass `applyExportFilters` entirely, so the array has no effect in those cases.
   * - `exclude` filters the set already narrowed by `include`, not the full export list. If `include` dropped a name, `exclude` cannot restore it; the two arrays are applied sequentially, not independently.
   * - Only `*` acts as a wildcard (expands to `.*`). All other regex-special characters (`.`, `?`, `+`, `(`, `)`) are escaped and treated as literals, so `User?Schema` will not match `UserSchema`.
   * - Patterns are fully anchored (`^…$`). A pattern like `Internal` (no wildcard) matches only the exact export name `Internal` — it will not match `UserInternal` because there is no leading `*` to cover the `User` prefix. Likewise, `User*` will not match `newUserSchema` because the `new` prefix precedes `User` and is not covered by a leading wildcard.
   * - Setting `exclude` to an empty array `[]` is identical to omitting it — the code short-circuits with `return included` when `exclude.length === 0`, so an explicit empty array does not prevent future entries from being accidentally uncommented.
   * @useWhen Set `exclude` to a non-empty string array of wildcard patterns when most exports in a schema file should be generated but a small set must be suppressed — for example `["*Internal", "*Test", "Base*"]` to drop helper or test schemas. Use it instead of enumerating every wanted export in `include` when the exclusion list is shorter. It is only consulted during batch discovery (no `--export` CLI flag, `types` is empty); set it to any non-empty value only in that path. Pair with `include` when you need to narrow the candidate pool first and then cut specific names from the result.
   * @avoidWhen Leave `exclude` unset when `config.types` is also populated — the CLI skips `applyExportFilters` entirely in that branch, so `exclude` has no effect. Leave it unset when the `--export` flag will always be provided at invocation, because `exclude` is never reached in that code path. Do not use `exclude` as a substitute for `include` when you want a small allowlist — `exclude` is a denylist applied *after* `include` filtering, so using it alone still starts from all discovered exports. Avoid relying on `exclude` for exports whose names contain regex-special characters (`.`, `+`, `^`, etc.) without verifying the pattern: `wildcardPatternToRegExp` escapes those characters and treats only `*` as a wildcard, so a pattern like `*.internal` matches the literal suffix `.internal`, but an unintended `*` in the wrong position may over-match.
   */
  exclude?: string[];
  /**
   * @pitfalls - Use `[]` bracket notation for array item paths (e.g., `"items[].name"`), not numeric indices. `resolveFieldMapping` in codegen normalizes numeric indices to `[]` for lookup, but `registerFlat`/`resolveSchemaPath` may not apply the same normalization — a numeric path key is unreliable across both layers.
   * - When `fields` is present alongside `schemas[K].fields`, `resolveFieldConfig` merges them with the schema-level value winning. You cannot unset a global field property at the schema level by omitting it — you must explicitly override with the desired value.
   * - A global `fields` entry whose key matches a field name common across multiple schemas (e.g., `"name"`, `"email"`) applies to every schema processed in the same `generate` run. Use `schemas[K].fields` for schema-specific overrides to avoid unintended cross-schema effects.
   * - Setting `fields: {}` (empty object) has no effect: `registerFlat` is not called when `Object.keys(mergedFields).length === 0`, producing identical output to omitting `fields` entirely.
   * - A `component` value inside a field entry is not validated against `components.overrides` — an unrecognized component name is emitted literally into the generated TSX, producing a compile error in the output file rather than a config error at generation time.
   * @useWhen Set `fields` to a `Record<string, TypedFieldConfig<TComponents>>` keyed by dot-path field name (e.g., `"address.street"`, `"items[].name"`) when you need to override label, component, props, or other metadata for specific fields **across every schema processed in a single config invocation**. Populate it when the same field name appears in several schemas and the override should apply to all of them uniformly. Use bracket notation (`items[].name`) for array-item paths — `resolveFieldMapping` normalizes numeric indices to `[]` during codegen lookup. Leave `fields` unset (or set it to `{}`) when you only need per-schema overrides; `{}` is identical to omitting the key because `registerFlat` is not called when `Object.keys(mergedFields).length === 0`. Prefer `schemas[K].fields` when the override should apply to one schema only, since schema-level entries win over `fields` on conflict via `resolveFieldConfig`.
   * @avoidWhen Use `schemas[K].fields` instead of the global `fields` map when the override should apply to only one schema — `fields` applies its entries to **every** schema processed in a single config run, so a key like `"name"` or `"email"` will override that path in all schemas, not just the intended one. Avoid `fields` when different schemas need different behavior for the same dot-path key; `resolveFieldConfig` merges schema-level entries over global entries (schema wins), so a global `fields` entry is silently suppressed for any schema that also declares the same key in `schemas[K].fields`, making the global entry a hidden no-op for that schema.
   */
  fields?: Record<string, TypedFieldConfig<TComponents>>;
  /**
   * @pitfalls - Key must exactly match the export's string name in the schema file; a typo silently produces no effect — no warning or error is emitted for an unrecognized key, so misconfigured entries are invisible at generation time.
   * - Export selection (`types`, `include`/`exclude`) happens before `schemas` is consulted: an entry whose key is filtered out by `exclude` patterns or absent from `types` is silently skipped — it does not generate any output or error.
   * - `schemas[K].fields` is merged **over** the global `fields` map (schema-level wins on conflict via `resolveFieldConfig`); a global field override you expect to apply to schema K will be silently suppressed if the same key is also present in `schemas[K].fields`.
   * - CLI flags (`--out`, `--mode`, `--server-action`) take precedence over every `schemas[K]` property — per-schema output routing and mode are ignored when those flags are passed, which can produce unexpected shared output paths.
   * - When `TSchemas` is inferred from a live module type, renaming or removing an export from the schema file leaves the stale `schemas` key dead with no compile-time error unless the generic parameter is kept in sync; with a plain `ZodFormsConfig` (no generic), all keys are `string` and typos are never caught by the type system.
   * @useWhen Set `schemas` when two or more exported schemas in a single run need different per-schema settings — different `out` directories, different `mode`, different `name`, `serverAction`, or schema-local `fields` overrides — that cannot be expressed by a single shared `defaults` block. Use one `schemas[K]` entry per export name wherever that export needs to deviate from the global defaults, and let absent entries fall through to `defaults` so you only write what differs.
   *
   * Set `schemas[K].fields` (instead of the global `fields` map) when a field path is local to one schema and you do not want the override to bleed into other schemas that happen to share the same field name (e.g., `"name"`, `"email"`). `resolveFieldConfig` merges `schemas[K].fields` over global `fields` with the schema-level value winning, so per-schema overrides here cannot be cancelled at the global level once set.
   *
   * Set `schemas[K].component` when an exported subschema object (e.g., `AddressSchema`) is reused as a nested subschema inside multiple parent schemas and should always render with the same component by default, regardless of which parent embeds it — the value is registered into the form registry by schema identity via `registerSchemaConfigs`, so it follows the object reference wherever it appears.
   *
   * Leave `schemas` unset when all selected exports share the same settings (express that in `defaults` instead), when you are targeting a single export with the `--export` CLI flag and one-off flags cover the needed customization, or when only global `fields` overrides are needed (no per-schema divergence). Do not set entries for schemas that will be excluded by `types`/`include`/`exclude` — export selection runs before `schemas` is consulted and unmatched keys are silently skipped.
   * @avoidWhen Leave `schemas` unset when every selected export shares the same settings — put those in `defaults` instead, since `schemas` entries that merely repeat `defaults` values add noise without effect. Omit `schemas` when targeting a single export via `--export` and CLI flags (`--out`, `--mode`, `--server-action`) cover all needed customization — those flags take precedence over every `schemas[K]` property anyway, making per-schema config redundant. Do not add a `schemas[K]` entry when only global `fields` overrides are needed and no per-schema divergence exists — global `fields` is applied without a `schemas` entry. Do not populate entries for exports that will be excluded by `types`, `include`, or `exclude` — export selection runs before `schemas` is consulted and unmatched keys are silently skipped without error or warning.
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
