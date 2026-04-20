# Functions

## Configuration

### `canonicalizeConfig`
Serialize a CodegenConfig to a canonical string suitable for
hashing into a cache key.
```ts
canonicalizeConfig(config: CodegenConfig): string
```
**Parameters:**
- `config: CodegenConfig` — The codegen configuration to serialize.
**Returns:** `string` — A deterministic JSON string representation of the config with keys sorted lexicographically.
```ts
const key = canonicalizeConfig({ schemaImportPath: './schema', exportName: 'UserSchema' });
const hash = crypto.createHash('sha256').update(key).digest('hex');
```

### `defineConfig`
Identity helper that returns its argument typed as `ZodFormsConfig`.

Merges preset component overrides (e.g. shadcn) into `config.components.overrides`
so that user-supplied overrides layer on top of the preset defaults. Use this in
your `z2f.config.ts` to get full TypeScript inference and IDE autocompletion.

Identity helper that returns its argument typed as ZodFormsConfig.
Applies preset component overrides (e.g., shadcn) — preset defaults
merge with user overrides, user wins on conflicts. However, the props
dict is replaced entirely, not merged.
```ts
defineConfig<TComponents, TSchemas>(config: ZodFormsConfig<TComponents, TSchemas>): ZodFormsConfig<TComponents, TSchemas>
```
**Parameters:**
- `config: ZodFormsConfig<TComponents, TSchemas>` — The raw configuration object.
**Returns:** `ZodFormsConfig<TComponents, TSchemas>` — The same configuration with preset overrides applied.
```ts
export default defineConfig({
  components: { source: '@/components/ui', preset: 'shadcn' },
});
```

### `validateConfig`
Validates an unknown value as a `ZodFormsConfig` at runtime.

Parses `value` using the internal Zod config schema and throws a descriptive
error if validation fails. Use this when loading config from untrusted sources
such as JSON files or dynamic `import()` calls.
```ts
validateConfig(value: unknown, source: string): ZodFormsConfig<Record<string, unknown>>
```
**Parameters:**
- `value: unknown` — The value to validate.
- `source: string` — default: `'config'` — Human-readable label for error messages (defaults to `'config'`).
**Returns:** `ZodFormsConfig<Record<string, unknown>>` — The validated configuration cast to `ZodFormsConfig`.
**Throws:** If `value` does not conform to the config schema.

### `resolveFieldConfig`
Merge global field config with per-schema field config overrides.
Per-schema entries shallow-merge on top of global entries for the same key.
Returns an empty record when both inputs are undefined.
```ts
resolveFieldConfig(globalFields: Record<string, FieldConfig> | undefined, schemaFields: Partial<Record<string, FieldConfig>> | undefined): Record<string, FieldConfig>
```
**Parameters:**
- `globalFields: Record<string, FieldConfig> | undefined` — Global field overrides from `ZodFormsConfig.fields`.
- `schemaFields: Partial<Record<string, FieldConfig>> | undefined` — Per-schema field overrides from `ZodFormsConfig.schemas[key].fields`.
**Returns:** `Record<string, FieldConfig>` — Merged field config map where schema-level overrides win on conflict.

### `normalizeConfig`
Normalize a validated config by migrating deprecated top-level fields to their canonical locations.
Currently handles the legacy top-level `overwrite` key — moves it into `defaults.overwrite`
so the rest of the pipeline can assume the normalized shape.
```ts
normalizeConfig(config: ZodFormsConfig<Record<string, unknown>>): ZodFormsConfig<Record<string, unknown>>
```
**Parameters:**
- `config: ZodFormsConfig<Record<string, unknown>>` — A fully validated `ZodFormsConfig` (output of `validateConfig`).
**Returns:** `ZodFormsConfig<Record<string, unknown>>` — The same config with any deprecated top-level fields migrated into `defaults`.
