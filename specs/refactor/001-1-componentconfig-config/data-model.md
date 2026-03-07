# Data Model: Unified ZodFormsConfig

**Branch**: `refactor/001-1-componentconfig-config` | **Date**: 2026-03-04

## Type Hierarchy

### Before (Current)

```
ZodToFormComponentConfig<T, TFieldPath>   (core/component-config.ts)
├── components: string
├── overwrite?: boolean
├── include?: string[]
├── exclude?: string[]
├── types?: string[]
├── fieldTypes: Record<string, ComponentEntry<T>>
├── formPrimitives?: FormPrimitivesConfig<T>
└── fields?: Partial<Record<TFieldPath, FieldOverride>>

FieldOverride                             (core/component-config.ts)
├── fieldType: string
└── props?: Record<string, unknown>

FormMeta                                  (core/types.ts)
├── fieldType?: string
├── order?: number
├── hidden?: boolean
├── gridColumn?: string
├── props?: Record<string, unknown>
└── render?: (field, props) => unknown

RuntimeComponentConfig                    (react/FieldRenderer.tsx)
├── components: string
├── fieldTypes: Record<string, RuntimeComponentEntry>
└── fields?: Partial<Record<string, RuntimeFieldOverride>>
```

### After (Target)

```
FieldConfig                               (core/config.ts) — NEW
├── fieldType?: string
├── order?: number
├── hidden?: boolean
├── gridColumn?: string
└── props?: Record<string, unknown>

FormMeta extends FieldConfig              (core/types.ts) — MODIFIED
└── render?: (field, props) => unknown    (runtime-only addition)

ZodTypeConfig<TComponents>                (core/config.ts) — NEW
├── name?: string                         (component name override)
├── mode?: 'submit' | 'auto-save'        (generation mode override)
├── out?: string                          (output path override)
├── serverAction?: boolean                (server action override)
└── fields?: Record<string, FieldConfig>  (per-field config, ALIGNED with FormMeta)

ZodFormsConfig<TComponents, TSchemas>     (core/config.ts) — NEW (replaces ZodToFormComponentConfig)
├── components: string                    (component module path)
├── fieldTypes: Record<string, ComponentEntry<TComponents>>
├── formPrimitives?: FormPrimitivesConfig<TComponents>
├── defaults?: {                          (CLI flag defaults — NEW)
│     mode?: 'submit' | 'auto-save'
│     ui?: 'shadcn' | 'unstyled'
│     out?: string
│     overwrite?: boolean
│     serverAction?: boolean
│   }
├── types?: string[]                      (type filtering — backward compat from old config)
├── include?: string[]                    (schema filtering — kept at top level)
├── exclude?: string[]
├── fields?: Record<string, FieldConfig>  (global field defaults — backward compat)
└── schemas?: Partial<Record<            (per-zodType config — NEW)
      keyof TSchemas & string,
      ZodTypeConfig<TComponents>
    >>

ComponentEntry<T>                         (core/config.ts) — UNCHANGED
├── component: keyof T & string
└── render?: () => Promise<unknown>

FormPrimitivesConfig<T>                   (core/config.ts) — UNCHANGED
├── field?: keyof T & string
├── label?: keyof T & string
└── control?: keyof T & string
```

### Deprecated Aliases (core/config.ts)

```typescript
/** @deprecated Use ZodFormsConfig instead */
type ZodToFormComponentConfig<T, TFieldPath> = ZodFormsConfig<T, Record<string, unknown>>

/** @deprecated Use FieldConfig instead */
type FieldOverride = FieldConfig

/** @deprecated Use defineConfig instead */
function defineComponentConfig<T, V>(config) = defineConfig(config)
```

### Runtime Config (react/FieldRenderer.tsx)

```typescript
// RuntimeComponentConfig becomes a Pick of ZodFormsConfig
type RuntimeComponentConfig = Pick<ZodFormsConfig, 'components' | 'fieldTypes'> & {
  fields?: Record<string, FieldConfig>;
};
```

## Relationships

```
                    ┌──────────────┐
                    │  FieldConfig  │ ← serializable base
                    └──────┬───────┘
                           │ extends
                    ┌──────┴───────┐
                    │   FormMeta   │ ← adds runtime `render`
                    └──────────────┘

                    ┌──────────────┐
                    │ZodTypeConfig │ ← per-schema settings
                    │  .fields     │──→ Record<string, FieldConfig>
                    └──────────────┘

┌──────────────────────────────┐
│       ZodFormsConfig         │ ← unified top-level config
│  .fieldTypes                 │──→ Record<string, ComponentEntry>
│  .formPrimitives             │──→ FormPrimitivesConfig
│  .defaults                   │──→ { mode, ui, out, overwrite, serverAction }
│  .fields (global defaults)   │──→ Record<string, FieldConfig>
│  .schemas                    │──→ Record<SchemaName, ZodTypeConfig>
└──────────────────────────────┘
```

## Config Resolution Order

For any property (e.g., `mode`, `out`, `serverAction`):
```
CLI flag  >  schemas.X.[prop]  >  defaults.[prop]
```

For field-level config:
```
schemas.X.fields[path]  >  fields[path] (global)
```

Field config properties merge (not replace) — `schemas.X.fields.email` overrides individual properties from `fields.email`, not the entire object.

## Validation Schema Changes

The Zod validation schema (`componentConfigSchema` → `configSchema`) must:
1. Accept all existing fields (backward compat)
2. Add `defaults` as optional object with known keys
3. Add `schemas` as optional record of `ZodTypeConfig`-shaped objects
4. Accept `fields` at both top level AND nested under `schemas.X`
5. Accept `types` at top level (kept for backward compat, not moved to `schemas`)

## State Transitions

N/A — config objects are immutable after loading. No lifecycle.
