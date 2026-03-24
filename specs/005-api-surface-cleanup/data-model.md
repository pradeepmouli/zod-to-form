# Data Model: API Surface Cleanup

**Feature**: 005-api-surface-cleanup | **Date**: 2026-03-23

## Entity Changes

### FieldConfigBase (packages/core/src/types.ts)

**Before**:
```
component?: string
order?: number
hidden?: boolean
gridColumn?: string        ← REMOVE
props?: Record<string, unknown>
propMap?: Record<string, string>  ← REMOVE
section?: string
```

**After**:
```
component?: string
order?: number
hidden?: boolean
disabled?: boolean         ← ADD
section?: string
helpText?: string          ← ADD
props?: Record<string, unknown>
```

**Validation rules**:
- `props` values matching `field.value|field.onChange|field.onBlur|field.ref|field.name` are resolved as field expressions
- `disabled` is boolean only (conditional form deferred)
- `helpText` is a plain string

### ComponentOverride (packages/core/src/config.ts)

**Before**:
```
controlled?: boolean
propMap?: Record<string, string>  ← REMOVE
```

**After**:
```
controlled?: boolean
props?: Record<string, unknown>   ← ADD (replaces propMap — field expressions auto-detected)
```

### ComponentsConfig (packages/core/src/config.ts)

**Before**:
```
source: string
preset?: ComponentPreset
overrides?: { [K in keyof T & string]?: ComponentOverride }
```

**After**:
```
source: string
preset?: ComponentPreset
fieldTemplate?: string     ← ADD
overrides?: { [K in keyof T & string]?: ComponentOverride }
```

### FormField IR (packages/core/src/types.ts)

**Before**:
```
key, component, props, label, description, placeholder, required,
defaultValue, readOnly, hidden, order, gridColumn, options,
children, arrayItem, constraints, zodType, hasCustomRender, render
```

**After** (changes only):
```
gridColumn    ← REMOVE
deprecated?: boolean   ← ADD (populated from z.globalRegistry)
disabled?: boolean     ← ADD (populated from field config)
helpText?: string      ← ADD (populated from field config)
```

### RuntimeComponentConfig (packages/react/src/FieldRenderer.tsx)

**Before**:
```
components: { source: string; overrides?: Record<string, ComponentOverride> }
componentModule?: Record<string, unknown>
fields?: Record<string, FieldConfig>
sectionComponents?: Record<string, ComponentType<{ fields: string[] }>>  ← REMOVE
```

**After**:
```
components: { source: string; overrides?: Record<string, ComponentOverride>; fieldTemplate?: string }
componentModule?: Record<string, unknown>
fields?: Record<string, FieldConfig>
```

### FieldTemplateProps (NEW — packages/react/src/FieldRenderer.tsx)

```
children: ReactNode      # The rendered input element
label: string            # Display label
description?: string     # Below-label help text
helpText?: string        # Below-input help text
error?: string           # Validation error message
name: string             # Field path/name
deprecated?: boolean     # Whether field is marked deprecated
```

## Relationships

```
ComponentsConfig
  └── overrides → ComponentOverride (per component type)
  └── fieldTemplate → resolves to a FieldTemplate component
  └── preset → determines default overrides + default fieldTemplate

FieldConfigBase
  └── props → merged with ComponentOverride.props (shallow, field wins)
  └── component → resolved from componentModule (for both leaf and object fields)
  └── section → resolved from componentModule (no longer from sectionComponents)

FormField (IR)
  └── populated by walker from schema + FieldConfigBase + z.globalRegistry
  └── consumed by FieldRenderer (runtime) and generateFormComponent (codegen)

FieldTemplateProps
  └── consumed by field template component (runtime)
  └── codegen emits equivalent JSX structure in generated file
```

## State Transitions

No state machines in this feature. All changes are to static configuration types and their resolution at render/codegen time.
