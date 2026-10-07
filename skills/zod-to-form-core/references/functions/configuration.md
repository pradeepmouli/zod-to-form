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
Typed identity helper for canonical authored configuration.
Presets are expanded by resolveFormConfig after variants and adapter overrides
have merged, so changing presets does not retain injected settings.
```ts
defineConfig<TComponents, TSchemas>(config: ZodFormsConfig<TComponents, TSchemas>): ZodFormsConfig<TComponents, TSchemas>
```
**Parameters:**
- `config: ZodFormsConfig<TComponents, TSchemas>` — Authored configuration.
**Returns:** `ZodFormsConfig<TComponents, TSchemas>` — The same object with generic inference retained.

### `validateConfig`
Validate canonical authored configuration without expanding presets.
Unknown root keys are rejected; known nested properties retain validation,
and field metadata supports application extensions.
```ts
validateConfig(value: unknown, source: string): ZodFormsConfig<Record<string, unknown>>
```
**Parameters:**
- `value: unknown`
- `source: string` — default: `'config'`
**Returns:** `ZodFormsConfig<Record<string, unknown>>`
**Throws:** Descriptive configuration error for invalid input.

### `resolveFieldConfig`
Merge global field config with per-schema field config overrides.
Per-schema entries shallow-merge on top of global entries for the same key.
Returns an empty record when both inputs are undefined.
```ts
resolveFieldConfig(globalFields: Partial<Record<string, FieldConfig>> | undefined, schemaFields: Partial<Record<string, FieldConfig>> | undefined): Record<string, FieldConfig>
```
**Parameters:**
- `globalFields: Partial<Record<string, FieldConfig>> | undefined` — Global field overrides from `ZodFormsConfig.fields`.
- `schemaFields: Partial<Record<string, FieldConfig>> | undefined` — Per-schema field overrides from `ZodFormsConfig.schemas[key].fields`.
**Returns:** `Record<string, FieldConfig>` — Merged field config map where schema-level overrides win on conflict.
