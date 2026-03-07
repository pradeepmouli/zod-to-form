# Public API Contract: @zod-to-form/core Config Exports

**Branch**: `refactor/001-1-componentconfig-config` | **Date**: 2026-03-04

## Exported Types (from `@zod-to-form/core`)

### New Exports

```typescript
// Primary config type — replaces ZodToFormComponentConfig
export type ZodFormsConfig<
  TComponents extends Record<string, unknown> = Record<string, unknown>,
  TSchemas extends Record<string, unknown> = Record<string, unknown>
> = {
  components: string;
  fieldTypes: Record<string, ComponentEntry<TComponents>>;
  formPrimitives?: FormPrimitivesConfig<TComponents>;
  defaults?: ConfigDefaults;
  types?: string[];
  include?: string[];
  exclude?: string[];
  fields?: Record<string, FieldConfig>;
  schemas?: Partial<Record<keyof TSchemas & string, ZodTypeConfig<TComponents>>>;
};

// CLI flag defaults storable in config
export type ConfigDefaults = {
  mode?: 'submit' | 'auto-save';
  ui?: 'shadcn' | 'unstyled';
  out?: string;
  overwrite?: boolean;
  serverAction?: boolean;
};

// Per-schema configuration
export type ZodTypeConfig<
  TComponents extends Record<string, unknown> = Record<string, unknown>
> = {
  name?: string;
  mode?: 'submit' | 'auto-save';
  out?: string;
  serverAction?: boolean;
  fields?: Record<string, FieldConfig>;
};

// Serializable field configuration — aligned with FormMeta
export type FieldConfig = {
  fieldType?: string;
  order?: number;
  hidden?: boolean;
  gridColumn?: string;
  props?: Record<string, unknown>;
};
```

### Deprecated Exports (JSDoc `@deprecated` only, no runtime warnings)

```typescript
/** @deprecated Use ZodFormsConfig instead */
export type ZodToFormComponentConfig<T, TFieldPath> = ZodFormsConfig<T>;

/** @deprecated Use FieldConfig instead */
export type FieldOverride = FieldConfig;

/** @deprecated Use defineConfig instead */
export function defineComponentConfig<T, V>(config): ZodFormsConfig<T>;
```

### Unchanged Exports

```typescript
export type ComponentEntry<T>;       // unchanged
export type FormPrimitivesConfig<T>; // unchanged
```

## Exported Functions (from `@zod-to-form/core`)

### New

```typescript
// Identity function for type inference — replaces defineComponentConfig
export function defineConfig<
  TComponents extends Record<string, unknown>,
  TSchemas extends Record<string, unknown>
>(config: ZodFormsConfig<TComponents, TSchemas>): ZodFormsConfig<TComponents, TSchemas>;

// Validates config at runtime — updated to accept new shape
export function validateConfig(
  value: unknown,
  source?: string
): ZodFormsConfig<Record<string, unknown>>;

// Merges per-schema field config over global field defaults at property level (not object replace)
export function resolveFieldConfig(
  globalFields: Record<string, FieldConfig> | undefined,
  schemaFields: Record<string, FieldConfig> | undefined
): Record<string, FieldConfig>;

// Normalizes old-style config to new shape (e.g., top-level overwrite → defaults.overwrite)
export function normalizeConfig(
  config: ZodFormsConfig
): ZodFormsConfig;
```

### Deprecated

```typescript
/** @deprecated Use validateConfig instead */
export function validateComponentConfig(
  value: unknown,
  source?: string
): ZodFormsConfig<Record<string, unknown>>;

/** @deprecated Use defineConfig instead */
export function defineComponentConfig<T, V>(config): ZodFormsConfig<T>;
```

## CLI Contract Changes

### `generate` command — unchanged flags, new behavior

All existing flags preserved. New behavior:
- Defaults from `config.defaults` apply when CLI flags are not provided
- Per-schema overrides from `config.schemas.X` applied per export
- Styled list output of generated forms printed to stdout

### `init` command — unchanged flags, new output

All existing flags preserved. New behavior:
- Autodiscovery results printed as styled list to stdout
- Generated template uses `defineConfig` instead of `defineComponentConfig`

## React Runtime Contract

### `RuntimeComponentConfig` — derived from core

```typescript
// Becomes a subset of ZodFormsConfig
export type RuntimeComponentConfig = Pick<ZodFormsConfig, 'components' | 'fieldTypes'> & {
  fields?: Record<string, FieldConfig>;
};
```

The `ZodFormProps.componentConfig` prop type changes from the local `RuntimeComponentConfig` to this derived type. Since it's structurally identical (same properties), existing usage is not broken.

## Backward Compatibility Matrix

| Consumer Code | Before | After | Breaking? |
|---|---|---|---|
| `defineComponentConfig({...})` | Works | Works (deprecated alias) | No |
| `defineConfig({...})` | N/A | Works | N/A (new) |
| `validateComponentConfig(v)` | Works | Works (deprecated alias) | No |
| `ZodToFormComponentConfig` type | Works | Works (deprecated alias) | No |
| `FieldOverride` type | Works | Works (deprecated alias) | No |
| `config.fields` at top level | Works | Works (global defaults) | No |
| `config.schemas` section | N/A | Works | N/A (new) |
| `config.defaults` section | N/A | Works | N/A (new) |
| `RuntimeComponentConfig` | Works | Works (structurally same) | No |
