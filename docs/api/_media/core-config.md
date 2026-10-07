---
title: Core Configuration
sidebar_position: 3
description: Full defineConfig surface from @zod-to-form/core — the shared configuration consumed by the CLI and Vite codegen pipeline.
---

# Core Configuration

`defineConfig()` from `@zod-to-form/core` is the shared configuration surface for codegen-oriented workflows. Put it in `z2f.config.ts` when you want one place to define:

- where generated components come from
- default generation settings for CLI and Vite
- field-path overrides
- per-export schema behavior
- reusable defaults for exported subschemas

## When to Use

Use `defineConfig()` when you want the CLI and Vite plugin to consume the same `z2f.config.ts`. The runtime can also import pieces of it, but runtime-only component module binding still happens through `componentConfig` on `<ZodForm>`.

## Installation and Import

```ts
import { defineConfig } from '@zod-to-form/core';
```

A typical project places the config at the repo root:

```ts
// z2f.config.ts
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: {
    source: '@/components/ui',
    preset: 'shadcn',
  },
  defaults: {
    out: 'src/components',
    overwrite: true,
    mode: 'submit',
  },
  fields: {},
  schemas: {},
});
```

## Full Config Shape

```ts
defineConfig({
  components: {
    source: string,
    preset?: 'shadcn' | 'html',
    fieldTemplate?: string,
    overrides?: Record<string, {
      controlled?: boolean,
      props?: Record<string, unknown>,
    }>,
  },
  defaults?: {
    mode?: 'submit' | 'auto-save',
    ui?: 'shadcn' | 'html',
    out?: string,
    overwrite?: boolean,
    serverAction?: boolean,
    formProvider?: boolean,
    optimization?: {
      level?: 1 | 2 | 3,
      compileZod?: boolean,
    },
  },
  variants?: Record<string, ConfigPatch>,
  types?: string[],
  include?: string[],
  exclude?: string[],
  fields?: Record<string, FieldConfig>,
  schemas?: Record<string, {
    name?: string,
    component?: string,
    mode?: 'submit' | 'auto-save',
    out?: string,
    serverAction?: boolean,
    fields?: Record<string, FieldConfig>,
  }>,
});
```

## `components`

`components` describes the module that generated code imports from, plus optional preset and per-component overrides.

```ts
components: {
  source: '@/components/ui',
  preset: 'shadcn',
}
```

### `components.source`

Static import path used by generated code.

### `components.preset`

Optional base mapping:

- `'shadcn'` for Radix/shadcn-oriented defaults
- `'html'` for plain HTML controls

### `components.overrides`

Per-component defaults, especially for controlled components:

```ts
components: {
  source: '@/components/ui',
  overrides: {
    Select: {
      controlled: true,
      props: {
        onValueChange: 'field.onChange',
        value: 'field.value',
      },
    },
  },
}
```

## `defaults`

`defaults` contains generation fallbacks shared by CLI and Vite:

```ts
defaults: {
  out: 'src/components',
  overwrite: true,
  mode: 'submit',
  ui: 'shadcn',
  serverAction: false,
  optimization: {
    level: 2,
  },
}
```

| Field | Meaning |
|---|---|
| `mode` | `submit` or `auto-save` |
| `ui` | UI hint / preset selection |
| `out` | Default output directory |
| `overwrite` | Whether generation can replace existing files |
| `serverAction` | Whether to emit a paired Next.js server action |
| `formProvider` | Whether generated output wraps the form in `FormProvider` |
| `optimization.level` | Validation optimization level |
| `optimization.compileZod` | Compile final Zod validation targets independently; omitted means off |

## `types`

`types` is the explicit export list used when `--export` is omitted:

```ts
types: ['UserSchema', 'AdminSchema']
```

## `include` / `exclude`

`include` and `exclude` filter exported schemas discovered from a module. They are most useful when one command should generate several forms:

```bash
npx z2f generate --config z2f.config.ts --schema src/schemas/index.ts
```

## `fields`

`fields` applies global field-path overrides across every matching root schema:

```ts
fields: {
  description: { component: 'Textarea', props: { rows: 4 } },
  'rules[].expression': { component: 'ExpressionEditor' },
  internalId: { hidden: true },
}
```

### Path syntax

| Pattern | Matches |
|---|---|
| `name` | Top-level field |
| `typeCall.type` | Nested object field |
| `attributes[].name` | Field within array items |
| `attributes[].typeCall.type` | Deep nested array/object field |

Always use `[]` bracket notation for arrays — never `items.0.field`.

## `schemas`

`schemas` is keyed by the exported schema constant name and has **two scopes** mixed into one object:

1. **Root-only generation settings**
   - `name`
   - `mode`
   - `out`
   - `serverAction`
2. **Schema-identity defaults**
   - `component`
   - `fields`

That second category follows the actual exported schema object anywhere it is reused as a subschema.

```ts
import * as schemaModule from './src/schemas';

export default defineConfig<typeof import('@/components/ui'), typeof schemaModule>({
  components: {
    source: '@/components/ui',
    preset: 'shadcn',
  },
  schemas: {
    ExpressionSchema: {
      component: 'ExpressionEditor',
      fields: {
        language: { hidden: true },
      },
    },
    WorkflowSchema: {
      name: 'WorkflowForm',
      out: 'src/forms',
      fields: {
        description: { component: 'Textarea', props: { rows: 6 } },
      },
    },
  },
});
```

If `WorkflowSchema` and `RuleSchema` both reuse the same exported `ExpressionSchema` instance, both inherit `ExpressionEditor` unless a more specific path override wins.

## Examples

### 1. Basic config

```ts
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: {
    source: '@/components/ui',
    preset: 'shadcn',
  },
  defaults: {
    mode: 'submit',
    out: 'src/components',
    overwrite: true,
  },
  types: ['UserSchema'],
  fields: {},
  schemas: {},
});
```

### 2. Global field defaults

```ts
import { defineConfig } from '@zod-to-form/core';

export default defineConfig({
  components: {
    source: '@/components/ui',
    preset: 'shadcn',
  },
  defaults: {
    mode: 'auto-save',
    out: 'src/components',
    overwrite: true,
  },
  fields: {
    description: { component: 'Textarea', props: { rows: 3 } },
    internalId: { hidden: true },
    'rules[].expression': { component: 'ExpressionEditor' },
  },
});
```

### 3. Exported subschema defaults

```ts
import { defineConfig } from '@zod-to-form/core';
import * as schemaModule from './src/schemas';

export default defineConfig<typeof import('@/components/ui'), typeof schemaModule>({
  components: {
    source: '@/components/ui',
    preset: 'shadcn',
  },
  defaults: {
    out: 'src/components',
    overwrite: true,
  },
  fields: {
    'rules[].label': { component: 'Input' },
  },
  schemas: {
    ExpressionSchema: {
      component: 'ExpressionEditor',
      fields: {
        language: { hidden: true },
      },
    },
    WorkflowSchema: {
      name: 'WorkflowForm',
      out: 'src/forms',
      fields: {
        description: { component: 'Textarea', props: { rows: 6 } },
      },
    },
  },
});
```

## Resolution Precedence

There are two overlapping precedence stories:

### Root generation settings

For `name`, `mode`, `out`, and `serverAction`:

1. CLI flags
2. `schemas[RootExport]`
3. `defaults`

### Field and component behavior

For nested field rendering and schema defaults:

1. Usage-site path overrides in `schemas[RootExport].fields`
2. Global `fields`
3. Schema-identity defaults from `schemas[ExportedSubschema].component` / `.fields`
4. Metadata or processor defaults inferred by the walker

The important nuance is that `schemas.ExpressionSchema.component` follows the exported `ExpressionSchema` object anywhere it is reused, while `schemas.ExpressionSchema.name` does not.

## Related Guides

- [CLI Codegen](./cli.md)
- [Runtime Component Config](./component-config.md)
- [Examples](./examples.md)

## Shared layers and variants

CLI files, Vite-discovered files and inline `configOverride` use this same contract. Vite layers its fallback, the loaded config, then the override; the selected variant is applied afterward. CLI invocation flags then override supported root settings. The shared `mergeConfigLayers` validates the completed authored config; `resolveFormConfig` applies root settings and expands the final preset once.

Optimization properties merge independently, preserving an inherited `compileZod: true` when a variant changes only `level`. Explicit false disables compilation. Component override entries replace whole entries; fields merge per property, with whole `props` replacement. Schema entries merge per export and their fields follow the same rules. `types`, `include`, and `exclude` arrays replace. Variants are partial canonical patches and cannot contain another variants map. Missing named variants fail explicitly; the empty variant selects the base.

```ts
export default defineConfig({
  components: { source: './ui', preset: 'shadcn' },
  defaults: { mode: 'submit', optimization: { level: 2, compileZod: true } },
  variants: {
    mobile: { defaults: { optimization: { level: 1 } } },
    plain: { components: { preset: 'html' }, defaults: { ui: 'html', optimization: { compileZod: false } } }
  }
});
```

The mobile variant inherits compilation. The plain variant replaces the preset before expansion, so injected shadcn controlled overrides do not leak into it. Explicit authored overrides remain.

## Breaking migration

Removed Vite flat keys (`mode`, `ui`, `validationLevel`, `componentConfig`, `componentName`, `exportName`, `schemaImportPath`, root `overwrite`) fail validation. Move generation settings into `defaults`, library settings into `components`, names into `schemas[Export].name`, and export selection into `types`. Internal resolved `CodegenConfig` remains generation data, not a public config-file schema. Use `defaults.optimization.level` and `defaults.optimization.compileZod` on both CLI and Vite; CLI supports `--variant`.

See [optimization](./optimization.md) for compile-only operation and [benchmarks](./benchmarks.md) for off/on measurements. Playground imports/exports preserve authored schema entries, variants, field metadata and compiler flags.
